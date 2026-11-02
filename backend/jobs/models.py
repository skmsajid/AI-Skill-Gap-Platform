"""
Models for the jobs app.
Handles saved job descriptions and extracted job skills.
"""

from django.db import models
from django.contrib.auth.models import User


class JobDescription(models.Model):
    """
    Stores a job description entered by the user.
    Users can save multiple job descriptions for different roles.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_descriptions')
    company_name = models.CharField(max_length=200)
    job_role = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_role} at {self.company_name}"


class JobSkill(models.Model):
    """
    Stores skills extracted from a job description by AI/NLP.
    """
    job_description = models.ForeignKey(
        JobDescription, on_delete=models.CASCADE, related_name='skills'
    )
    skill_name = models.CharField(max_length=150)
    is_required = models.BooleanField(default=True, help_text='Required vs nice-to-have')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['skill_name']
        unique_together = ['job_description', 'skill_name']

    def __str__(self):
        return f"{self.skill_name} ({self.job_description.job_role})"
