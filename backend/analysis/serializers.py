"""
Serializers for the analysis app.
"""

from rest_framework import serializers
from .models import Analysis, AnalysisMatchedSkill, AnalysisMissingSkill, SkillProgress


class AnalysisMatchedSkillSerializer(serializers.ModelSerializer):
    job_skill_name = serializers.CharField(source='job_skill', read_only=True)
    resume_skill_name = serializers.CharField(source='resume_skill', read_only=True)

    class Meta:
        model = AnalysisMatchedSkill
        fields = ['id', 'job_skill', 'resume_skill', 'job_skill_name', 'resume_skill_name', 'similarity_score']


class AnalysisMissingSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisMissingSkill
        fields = ['id', 'skill_name', 'recommendation']


class SkillProgressSerializer(serializers.ModelSerializer):
    job_role = serializers.SerializerMethodField()

    class Meta:
        model = SkillProgress
        fields = ['id', 'skill_name', 'status', 'notes', 'job_role', 'updated_at', 'created_at']
        read_only_fields = ['id', 'updated_at', 'created_at']

    def get_job_role(self, obj):
        if obj.job_role:
            return obj.job_role
        if obj.analysis and obj.analysis.job_role:
            return obj.analysis.job_role
        return 'Target Role'


class AnalysisSerializer(serializers.ModelSerializer):
    matched_skills = AnalysisMatchedSkillSerializer(many=True, read_only=True)
    missing_skills = AnalysisMissingSkillSerializer(many=True, read_only=True)
    matched_count = serializers.IntegerField(source='total_matched', read_only=True)
    missing_count = serializers.IntegerField(source='total_missing', read_only=True)

    class Meta:
        model = Analysis
        fields = [
            'id', 'job_role', 'company_name', 'match_percentage',
            'total_job_skills', 'total_matched', 'total_missing',
            'matched_count', 'missing_count',
            'recommendations_json', 'created_at',
            'matched_skills', 'missing_skills'
        ]
        read_only_fields = ['id', 'created_at']


class AnalysisListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing analyses."""
    matched_count = serializers.IntegerField(source='total_matched', read_only=True)
    missing_count = serializers.IntegerField(source='total_missing', read_only=True)

    class Meta:
        model = Analysis
        fields = [
            'id', 'job_role', 'company_name', 'match_percentage',
            'total_matched', 'total_missing', 'matched_count', 'missing_count', 'created_at'
        ]


class RunAnalysisSerializer(serializers.Serializer):
    """Serializer for running a new analysis."""
    job_description_id = serializers.IntegerField(required=False, allow_null=True)
    job_id = serializers.IntegerField(required=False, allow_null=True)
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    job_title = serializers.CharField(max_length=200, required=False, allow_blank=True)
    company_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    job_description_text = serializers.CharField(required=False, allow_blank=True)
    similarity_threshold = serializers.FloatField(required=False, default=0.70)
    threshold = serializers.FloatField(required=False, allow_null=True, default=None)

    def validate(self, data):
        # Alias job_id <-> job_description_id
        if data.get('job_id') and not data.get('job_description_id'):
            data['job_description_id'] = data['job_id']
        # Alias threshold <-> similarity_threshold
        if data.get('threshold') is not None and ('similarity_threshold' not in data or data.get('similarity_threshold') == 0.70):
            data['similarity_threshold'] = data['threshold']
        return data
