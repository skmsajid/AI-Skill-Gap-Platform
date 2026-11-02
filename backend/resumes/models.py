"""
Models for the resumes app.
Handles resume uploads and extracted skills.
"""

import os
from django.db import models
from django.contrib.auth.models import User


def resume_upload_path(instance, filename):
    """Generate upload path: media/resumes/user_<id>/<filename>"""
    return f'resumes/user_{instance.user.id}/{filename}'


class Resume(models.Model):
    """
    Stores an uploaded resume PDF and its extracted text.
    Each user can have one active resume at a time.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to=resume_upload_path)
    original_filename = models.CharField(max_length=255)
    extracted_text = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.user.username} - {self.original_filename}"

    def get_file_extension(self):
        _, ext = os.path.splitext(self.original_filename)
        return ext.lower()


class ResumeSkill(models.Model):
    """
    Stores skills extracted from a resume by AI/NLP.
    """
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=150)
    confidence = models.FloatField(default=1.0, help_text='Confidence score of extraction')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['skill_name']
        unique_together = ['resume', 'skill_name']

    def __str__(self):
        return f"{self.skill_name} ({self.resume.user.username})"
