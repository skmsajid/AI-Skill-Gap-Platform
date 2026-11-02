"""
Views for the analysis app.
Handles running skill gap analysis, viewing historical reports, and tracking skill progress.
"""

import json
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Analysis, AnalysisMatchedSkill, AnalysisMissingSkill, SkillProgress
from .serializers import (
    AnalysisSerializer, AnalysisListSerializer,
    SkillProgressSerializer, RunAnalysisSerializer
)
from resumes.models import Resume
from jobs.models import JobDescription, JobSkill
from resumes.nlp_utils import (
    match_skills, generate_recommendations,
    extract_skills_from_text, deduplicate_skills
)


def _explain_match_reason(job_skill, resume_skill, score):
    """Generate human-readable justification for a matched skill."""
    if score >= 0.99:
        return f"Exact match: '{resume_skill}' directly satisfies '{job_skill}'"
    return f"Semantic match ({score:.0%}): '{resume_skill}' fulfills '{job_skill}'"


def _explain_miss_reason(job_skill, best_score, best_resume_skill, threshold):
    """Generate human-readable justification for a missing skill."""
    if best_score <= 0.0 or not best_resume_skill:
        return f"No resume skill has semantic similarity to '{job_skill}'"
    return (
        f"Closest resume skill '{best_resume_skill}' scored {best_score:.0%}, "
        f"which is below the threshold of {threshold:.0%}"
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_analysis(request):
    """
    Run a semantic skill gap analysis.
    Compares the user's active resume skills against a job description's required skills.
    Ensures deduplication, strict domain isolation, and accurate percentage calculation.
    """
    try:
        serializer = RunAnalysisSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify active resume exists
        resume_id = serializer.validated_data.get('resume_id')
        if resume_id:
            resume = Resume.objects.filter(id=resume_id, user=request.user).first()
        else:
            resume = Resume.objects.filter(user=request.user, is_active=True).first()

        if not resume:
            return Response(
                {'error': 'No active resume found. Please upload a PDF resume first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        job_id = serializer.validated_data.get('job_description_id') or serializer.validated_data.get('job_id')
        threshold = serializer.validated_data.get('similarity_threshold')
        if threshold is None:
            threshold = serializer.validated_data.get('threshold')
        if threshold is None:
            threshold = 0.70

        # 2. Get or create job description
        if job_id:
            try:
                job = JobDescription.objects.get(id=job_id, user=request.user)
            except JobDescription.DoesNotExist:
                return Response(
                    {'error': 'Job description not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            title = (serializer.validated_data.get('job_title') or '').strip()
            desc = (serializer.validated_data.get('job_description_text') or '').strip()
            comp = (serializer.validated_data.get('company_name') or 'Target Role').strip()
            if not title or not desc:
                return Response(
                    {'error': 'Both job title and job description text must be provided.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            job = JobDescription.objects.create(
                user=request.user,
                job_role=title,
                company_name=comp,
                description=desc,
            )
            # Extract skills for this new job
            job_extracted = extract_skills_from_text(desc)
            for s in job_extracted:
                JobSkill.objects.get_or_create(
                    job_description=job,
                    skill_name=s['skill'],
                    defaults={'is_required': True}
                )

        # 3. Get raw skills from database
        raw_resume_skills = list(resume.skills.values_list('skill_name', flat=True))
        raw_job_skills = list(job.skills.values_list('skill_name', flat=True))

        if not raw_resume_skills:
            return Response(
                {'error': 'No technical skills were detected in your active resume. Please ensure your PDF contains technical skills.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not raw_job_skills:
            return Response(
                {'error': 'No technical skills could be identified in the job description.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Deduplicate before matching
        resume_skills = deduplicate_skills(raw_resume_skills)
        job_skills = deduplicate_skills(raw_job_skills)

        # 5. Run semantic skill matching
        try:
            result = match_skills(resume_skills, job_skills, threshold=threshold)
        except Exception as e:
            return Response(
                {'error': f'Semantic analysis failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 6. Generate practical 3-step recommendations for missing skills
        recommendations = generate_recommendations(result['missing'])

        # 7. Save permanent analysis record to database
        analysis = Analysis.objects.create(
            user=request.user,
            resume=resume,
            job_description=job,
            job_role=job.job_role,
            company_name=job.company_name,
            match_percentage=result['match_percentage'],
            total_job_skills=result['total_job_skills'],
            total_matched=result['total_matched'],
            total_missing=result['total_missing'],
            recommendations_json=json.dumps(recommendations),
        )

        # 8. Save matched skills
        for match in result['matched']:
            AnalysisMatchedSkill.objects.create(
                analysis=analysis,
                job_skill=match['job_skill'],
                resume_skill=match['resume_skill'],
                similarity_score=match['similarity'],
            )

        # 9. Save missing skills with their recommendations
        rec_by_skill = {r['skill'].lower(): r for r in recommendations if isinstance(r, dict) and 'skill' in r}
        for missing_skill in result['missing']:
            rec = rec_by_skill.get(missing_skill.lower(), {})
            rec_text = ''
            if rec and 'steps' in rec:
                rec_text = f"{rec.get('description', '')}\n" + "\n".join(f"- {s}" for s in rec['steps'])

            AnalysisMissingSkill.objects.create(
                analysis=analysis,
                skill_name=missing_skill,
                recommendation=rec_text,
            )

        # 10. Create or preserve SkillProgress for missing skills
        progress_items_data = []
        for missing_skill in result['missing']:
            sp, created = SkillProgress.objects.get_or_create(
                user=request.user,
                skill_name=missing_skill,
                defaults={
                    'analysis': analysis,
                    'job_role': job.job_role,
                    'status': 'not_started'
                }
            )
            if not created and not sp.job_role:
                sp.job_role = job.job_role
                sp.save()

            progress_items_data.append({
                'id': sp.id,
                'skill_name': sp.skill_name,
                'status': sp.status,
                'job_role': sp.job_role or job.job_role,
            })

        # 11. Format matched skills data
        matched_skills_data = [
            {
                'job_skill': m['job_skill'],
                'job_skill_name': m['job_skill'],
                'required_skill': m['job_skill'],
                'resume_skill': m['resume_skill'],
                'resume_skill_name': m['resume_skill'],
                'similarity': m['similarity'],
                'similarity_score': m['similarity'],
            }
            for m in result['matched']
        ]

        # 12. Format missing skills data — include best_score and reason
        missing_skills_data = []
        # Build a lookup of detail info keyed by job_skill for quick access
        details_map = {d['job_skill']: d for d in result.get('details', [])}
        for missing_skill in result['missing']:
            rec = rec_by_skill.get(missing_skill.lower(), {})
            rec_text = ''
            priority = rec.get('priority', 'medium') if rec else 'medium'
            if rec and 'steps' in rec:
                rec_text = f"{rec.get('description', '')}\n" + "\n".join(f"- {s}" for s in rec['steps'])

            detail = details_map.get(missing_skill, {})
            best_score = detail.get('similarity', 0.0)
            best_resume_skill = detail.get('best_match')  # None if truly 0 score

            missing_skills_data.append({
                'skill': missing_skill,
                'skill_name': missing_skill,
                'recommendation': rec_text,
                'importance': priority,
                'best_score': best_score,
                'best_resume_skill': best_resume_skill,
                'reason': _explain_miss_reason(missing_skill, best_score, best_resume_skill, threshold),
            })

        # 13. Full per-skill diagnostic breakdown
        skill_breakdown = [
            {
                'job_skill': d['job_skill'],
                'is_match': d['is_match'],
                'similarity_score': d['similarity'],
                'best_resume_skill': d.get('best_match'),
                'threshold_used': threshold,
                'reason': (
                    _explain_match_reason(d['job_skill'], d.get('best_match'), d['similarity'])
                    if d['is_match']
                    else _explain_miss_reason(d['job_skill'], d['similarity'], d.get('best_match'), threshold)
                ),
            }
            for d in result.get('details', [])
        ]

        return Response({
            'id': analysis.id,
            'message': 'Analysis completed successfully.',
            'analysis_id': analysis.id,
            'analysis': AnalysisSerializer(analysis).data,
            'match_percentage': result['match_percentage'],
            'job_role': job.job_role,
            'company_name': job.company_name,
            'matched_count': result['total_matched'],
            'missing_count': result['total_missing'],
            'total_job_skills': result['total_job_skills'],
            'similarity_threshold': threshold,
            'matched_skills': matched_skills_data,
            'missing_skills': missing_skills_data,
            'progress_items': progress_items_data,
            'recommendations': recommendations,
            'skill_breakdown': skill_breakdown,
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Failed to run analysis: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analysis_list(request):
    """Get all historical analyses for the current user."""
    analyses = Analysis.objects.filter(user=request.user)
    serializer = AnalysisListSerializer(analyses, many=True)
    return Response(serializer.data)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def analysis_detail(request, analysis_id):
    """Get a specific historical analysis or delete it."""
    try:
        analysis = Analysis.objects.get(id=analysis_id, user=request.user)
    except Analysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'DELETE':
        analysis.delete()
        return Response({'message': 'Analysis deleted successfully.'})

    # Matched skills
    matched_skills_data = [
        {
            'job_skill': ms.job_skill,
            'job_skill_name': ms.job_skill,
            'required_skill': ms.job_skill,
            'resume_skill': ms.resume_skill,
            'resume_skill_name': ms.resume_skill,
            'similarity': ms.similarity_score,
            'similarity_score': ms.similarity_score,
        }
        for ms in analysis.matched_skills.all()
    ]

    # Recommendations
    try:
        recommendations = json.loads(analysis.recommendations_json) if analysis.recommendations_json else []
    except (json.JSONDecodeError, TypeError):
        recommendations = []

    rec_by_skill = {r['skill'].lower(): r for r in recommendations if isinstance(r, dict)}

    # Missing skills
    missing_skills_data = []
    progress_items_data = []

    for ms in analysis.missing_skills.all():
        rec = rec_by_skill.get(ms.skill_name.lower(), {})
        priority = rec.get('priority', 'medium') if rec else 'medium'
        missing_skills_data.append({
            'skill': ms.skill_name,
            'skill_name': ms.skill_name,
            'recommendation': ms.recommendation,
            'importance': priority,
        })

        # Look up current user progress for this missing skill
        sp = SkillProgress.objects.filter(user=request.user, skill_name=ms.skill_name).first()
        if not sp:
            sp = SkillProgress.objects.create(
                user=request.user,
                skill_name=ms.skill_name,
                job_role=analysis.job_role,
                status='not_started'
            )
        progress_items_data.append({
            'id': sp.id,
            'skill_name': sp.skill_name,
            'status': sp.status,
            'job_role': sp.job_role or analysis.job_role,
        })

    data = {
        'id': analysis.id,
        'job_role': analysis.job_role,
        'company_name': analysis.company_name,
        'match_percentage': analysis.match_percentage,
        'matched_count': analysis.total_matched,
        'missing_count': analysis.total_missing,
        'total_job_skills': analysis.total_job_skills,
        'similarity_threshold': 0.70,
        'created_at': analysis.created_at,
        'matched_skills': matched_skills_data,
        'missing_skills': missing_skills_data,
        'progress_items': progress_items_data,
        'recommendations': recommendations,
    }

    return Response(data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_analysis(request, analysis_id):
    """Delete an analysis owned by the current user."""
    try:
        analysis = Analysis.objects.get(id=analysis_id, user=request.user)
    except Analysis.DoesNotExist:
        return Response(
            {'error': 'Analysis not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    analysis.delete()
    return Response({'message': 'Analysis deleted successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def latest_analysis(request):
    """Get the most recent analysis for current user."""
    analysis = Analysis.objects.filter(user=request.user).first()
    if not analysis:
        return Response(
            {'message': 'No analysis found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = AnalysisSerializer(analysis)
    data = serializer.data
    try:
        data['recommendations'] = json.loads(analysis.recommendations_json)
    except (json.JSONDecodeError, TypeError):
        data['recommendations'] = []

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def skill_progress_list(request):
    """Get all skill progress entries for the current user."""
    progress = SkillProgress.objects.filter(user=request.user)
    serializer = SkillProgressSerializer(progress, many=True)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_skill_progress(request, progress_id):
    """Update the status of a skill progress entry in the database."""
    try:
        progress = SkillProgress.objects.get(id=progress_id, user=request.user)
    except SkillProgress.DoesNotExist:
        return Response(
            {'error': 'Skill progress not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    new_status = request.data.get('status')
    valid_statuses = ['not_started', 'in_progress', 'completed']
    if new_status not in valid_statuses:
        return Response(
            {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    progress.status = new_status
    if 'notes' in request.data:
        progress.notes = request.data['notes']
    progress.save()

    serializer = SkillProgressSerializer(progress)
    response_data = dict(serializer.data)
    response_data['message'] = 'Skill status updated successfully.'
    response_data['progress'] = serializer.data
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    """
    Get aggregated dashboard summary data for the current user.
    """
    user = request.user

    # Latest analysis
    latest = Analysis.objects.filter(user=user).first()

    # Recent analyses (last 5)
    recent = Analysis.objects.filter(user=user)[:5]
    recent_serializer = AnalysisListSerializer(recent, many=True)

    # Skill progress summary
    total_progress = SkillProgress.objects.filter(user=user)
    progress_stats = {
        'total': total_progress.count(),
        'not_started': total_progress.filter(status='not_started').count(),
        'in_progress': total_progress.filter(status='in_progress').count(),
        'completed': total_progress.filter(status='completed').count(),
    }

    # Active resume info
    active_resume = Resume.objects.filter(user=user, is_active=True).first()

    data = {
        'latest_analysis': AnalysisSerializer(latest).data if latest else None,
        'recent_analyses': recent_serializer.data,
        'progress_stats': progress_stats,
        'has_resume': active_resume is not None,
        'total_analyses': Analysis.objects.filter(user=user).count(),
        'total_jobs': user.job_descriptions.count(),
    }

    return Response(data)
