"""
Serializers for the resumes app.
"""

from rest_framework import serializers
from .models import Resume, ResumeSkill


class ResumeSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeSkill
        fields = ['id', 'skill_name', 'confidence', 'created_at']


class ResumeSerializer(serializers.ModelSerializer):
    skills = ResumeSkillSerializer(many=True, read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id', 'original_filename', 'extracted_text', 'is_active',
            'uploaded_at', 'skills', 'file_url'
        ]
        read_only_fields = ['id', 'original_filename', 'extracted_text', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ResumeUploadSerializer(serializers.Serializer):
    """Serializer for resume file upload validation."""
    file = serializers.FileField()

    def validate_file(self, value):
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError("Only PDF files are allowed.")

        # Check file size (max 10 MB)
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 10 MB.")

        return value
