"""
Models for the analysis app.
Stores skill gap analysis results, matched/missing skills, 
recommendations, and skill progress tracking.
"""

from django.db import models
from django.contrib.auth.models import User
from resumes.models import Resume
from jobs.models import JobDescription


class Analysis(models.Model):
    """
    Stores the result of a skill gap analysis comparing
    a user's resume against a job description.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, related_name='analyses')
    job_description = models.ForeignKey(
        JobDescription, on_delete=models.SET_NULL, null=True, related_name='analyses'
    )
    job_role = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    match_percentage = models.FloatField(default=0.0)
    total_job_skills = models.IntegerField(default=0)
    total_matched = models.IntegerField(default=0)
    total_missing = models.IntegerField(default=0)
    recommendations_json = models.TextField(blank=True, default='[]',
        help_text='JSON string of recommendations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'analyses'

    def __str__(self):
        return f"{self.user.username} - {self.job_role} ({self.match_percentage}%)"


class AnalysisMatchedSkill(models.Model):
    """A skill from the job description that matched a resume skill."""
    analysis = models.ForeignKey(
        Analysis, on_delete=models.CASCADE, related_name='matched_skills'
    )
    job_skill = models.CharField(max_length=150)
    resume_skill = models.CharField(max_length=150)
    similarity_score = models.FloatField(default=1.0)

    class Meta:
        ordering = ['job_skill']

    def __str__(self):
        return f"{self.job_skill} ↔ {self.resume_skill}"


class AnalysisMissingSkill(models.Model):
    """A skill required by the job that is missing from the resume."""
    analysis = models.ForeignKey(
        Analysis, on_delete=models.CASCADE, related_name='missing_skills'
    )
    skill_name = models.CharField(max_length=150)
    recommendation = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['skill_name']

    def __str__(self):
        return f"Missing: {self.skill_name}"


class SkillProgress(models.Model):
    """
    Tracks user's progress on learning missing/recommended skills.
    Preserves user progress across analyses.
    """
    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_progress')
    analysis = models.ForeignKey(
        Analysis, on_delete=models.SET_NULL, related_name='skill_progress',
        null=True, blank=True
    )
    skill_name = models.CharField(max_length=150)
    job_role = models.CharField(max_length=200, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['skill_name']
        unique_together = ['user', 'skill_name']

    def __str__(self):
        return f"{self.skill_name} - {self.get_status_display()}"
