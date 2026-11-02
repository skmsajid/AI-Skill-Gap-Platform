"""
Serializers for the jobs app.
"""

from rest_framework import serializers
from .models import JobDescription, JobSkill


class JobSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSkill
        fields = ['id', 'skill_name', 'is_required', 'created_at']


class JobDescriptionSerializer(serializers.ModelSerializer):
    skills = JobSkillSerializer(many=True, read_only=True)
    required_skills = JobSkillSerializer(source='skills', many=True, read_only=True)
    title = serializers.CharField(source='job_role', read_only=True)
    company = serializers.CharField(source='company_name', read_only=True)

    class Meta:
        model = JobDescription
        fields = [
            'id', 'company_name', 'job_role', 'title', 'company',
            'description', 'is_active', 'created_at', 'updated_at',
            'skills', 'required_skills'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class JobDescriptionCreateSerializer(serializers.Serializer):
    """Serializer for creating and updating a job description.
    Accepts both 'description' (full text) and 'required_skills' (comma-separated list) as input.
    """
    company_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    job_role = serializers.CharField(max_length=200, required=False, allow_blank=True)
    title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    company = serializers.CharField(max_length=200, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    required_skills = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, data):
        # Alias: job_role <-> title
        role = (data.get('job_role') or data.get('title') or '').strip()
        if not role:
            raise serializers.ValidationError({"job_role": "Job title/role is required."})
        data['job_role'] = role

        # Alias: company_name <-> company
        company = (data.get('company_name') or data.get('company') or '').strip()
        data['company_name'] = company if company else 'Unknown'

        # Merge required_skills into description for NLP extraction
        description = data.get('description', '').strip()
        required_skills = data.get('required_skills', '').strip()

        if not description and required_skills:
            description = required_skills
        elif required_skills and required_skills not in description:
            description = f"{description}\n\nRequired Skills: {required_skills}".strip()

        if len(description) < 5:
            raise serializers.ValidationError(
                {"description": "Please provide a job description or required skills (at least 5 characters)."}
            )
        data['description'] = description
        return data
