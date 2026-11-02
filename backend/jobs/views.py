"""
Views for the jobs app.
Handles full CRUD operations for target job descriptions with automatic skill extraction.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JobDescription, JobSkill
from .serializers import JobDescriptionSerializer, JobDescriptionCreateSerializer
from resumes.nlp_utils import extract_skills_from_text


def _process_create_job(request):
    """Internal helper to create a job description and extract skills."""
    serializer = JobDescriptionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Create job description
    job = JobDescription.objects.create(
        user=request.user,
        company_name=data['company_name'],
        job_role=data['job_role'],
        description=data['description'],
    )

    # Extract unique technical skills from job description using NLP
    try:
        skills = extract_skills_from_text(data['description'])
        for skill_data in skills:
            JobSkill.objects.get_or_create(
                job_description=job,
                skill_name=skill_data['skill'],
                defaults={'is_required': True}
            )
    except Exception:
        pass  # Job is saved even if skill extraction fails

    result_serializer = JobDescriptionSerializer(job)
    response_data = dict(result_serializer.data)
    response_data['message'] = 'Job description saved successfully.'
    response_data['job'] = result_serializer.data
    return Response(response_data, status=status.HTTP_201_CREATED)


def _process_update_job(request, job_id):
    """Internal helper to update a job description and re-extract skills."""
    try:
        job = JobDescription.objects.get(id=job_id, user=request.user)
    except JobDescription.DoesNotExist:
        return Response(
            {'error': 'Job description not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = JobDescriptionCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    job.company_name = data['company_name']
    job.job_role = data['job_role']
    job.description = data['description']
    job.save()

    # Re-extract skills: clear old requirements and insert freshly identified unique ones
    job.skills.all().delete()
    try:
        skills = extract_skills_from_text(data['description'])
        for skill_data in skills:
            JobSkill.objects.get_or_create(
                job_description=job,
                skill_name=skill_data['skill'],
                defaults={'is_required': True}
            )
    except Exception:
        pass

    result_serializer = JobDescriptionSerializer(job)
    response_data = dict(result_serializer.data)
    response_data['message'] = 'Job description updated successfully.'
    response_data['job'] = result_serializer.data
    return Response(response_data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def job_list(request):
    """Get all saved job descriptions for current user or create a new one."""
    if request.method == 'POST':
        return _process_create_job(request)
    jobs = JobDescription.objects.filter(user=request.user)
    serializer = JobDescriptionSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def job_detail(request, job_id):
    """Get, update, or delete a specific job description."""
    try:
        job = JobDescription.objects.get(id=job_id, user=request.user)
    except JobDescription.DoesNotExist:
        return Response(
            {'error': 'Job description not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        job.delete()
        return Response({'message': 'Job description deleted successfully.'})
    elif request.method == 'PUT':
        return _process_update_job(request, job_id)

    serializer = JobDescriptionSerializer(job)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_job(request):
    """Create a new job description and extract unique technical skills from it."""
    return _process_create_job(request)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_job(request, job_id):
    """Update a job description and re-extract required technical skills."""
    return _process_update_job(request, job_id)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_job(request, job_id):
    """Delete a job description."""
    try:
        job = JobDescription.objects.get(id=job_id, user=request.user)
    except JobDescription.DoesNotExist:
        return Response(
            {'error': 'Job description not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    job.delete()
    return Response({'message': 'Job description deleted successfully.'})
