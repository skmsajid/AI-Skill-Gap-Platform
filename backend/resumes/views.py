"""
Views for the resumes app.
Handles resume upload, text extraction, and technical skill extraction.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Resume, ResumeSkill
from .serializers import ResumeSerializer, ResumeUploadSerializer
from .nlp_utils import extract_text_from_pdf, extract_skills_from_text


def _process_resume_upload(request):
    """Core logic to handle resume PDF upload and skill extraction."""
    serializer = ResumeUploadSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    uploaded_file = serializer.validated_data['file']

    # Keep track of old active resume in case extraction fails
    old_active = Resume.objects.filter(user=request.user, is_active=True).first()
    if old_active:
        old_active.is_active = False
        old_active.save()

    # Create new resume record
    resume = Resume.objects.create(
        user=request.user,
        file=uploaded_file,
        original_filename=uploaded_file.name,
        is_active=True,
    )

    # Extract text from PDF using PyMuPDF
    try:
        extracted_text = extract_text_from_pdf(resume.file.path)
        resume.extracted_text = extracted_text
        resume.save()
    except ValueError as e:
        # Cleanup uploaded file record on extraction failure
        resume.delete()
        if old_active:
            old_active.is_active = True
            old_active.save()
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        resume.delete()
        if old_active:
            old_active.is_active = True
            old_active.save()
        return Response(
            {'error': 'Failed to process the resume PDF. Please ensure the file is not corrupted.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Extract unique technical skills using NLP
    try:
        skills = extract_skills_from_text(extracted_text)
        for skill_data in skills:
            ResumeSkill.objects.get_or_create(
                resume=resume,
                skill_name=skill_data['skill'],
                defaults={'confidence': skill_data['confidence']}
            )
    except Exception:
        pass

    result_serializer = ResumeSerializer(resume, context={'request': request})
    response_data = dict(result_serializer.data)
    response_data['message'] = 'Resume uploaded and processed successfully.'
    response_data['resume'] = result_serializer.data
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def resume_list(request):
    """Get all resumes or upload a new resume for the current user."""
    if request.method == 'POST':
        return _process_resume_upload(request)
    resumes = Resume.objects.filter(user=request.user)
    serializer = ResumeSerializer(resumes, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_resume(request):
    """Get the current active resume for the logged-in user."""
    resume = Resume.objects.filter(user=request.user, is_active=True).first()
    if not resume:
        return Response(
            {'message': 'No active resume found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    serializer = ResumeSerializer(resume, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_resume(request):
    """
    Upload a PDF resume, validate format & size, extract text with PyMuPDF,
    and parse unique technical skills using NLP.
    Deactivates any previous active resume.
    """
    return _process_resume_upload(request)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_resume(request, resume_id):
    """Delete a resume (only if owned by current user)."""
    try:
        resume = Resume.objects.get(id=resume_id, user=request.user)
    except Resume.DoesNotExist:
        return Response(
            {'error': 'Resume not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    was_active = resume.is_active
    resume.delete()

    # If deleted resume was active, set the most recent remaining resume as active
    if was_active:
        remaining = Resume.objects.filter(user=request.user).order_by('-uploaded_at').first()
        if remaining:
            remaining.is_active = True
            remaining.save()

    return Response({'message': 'Resume deleted successfully.'})
