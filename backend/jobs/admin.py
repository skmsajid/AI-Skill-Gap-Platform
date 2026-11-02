from django.contrib import admin
from .models import JobDescription, JobSkill


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'job_role', 'company_name', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job_role', 'company_name', 'user__username']


@admin.register(JobSkill)
class JobSkillAdmin(admin.ModelAdmin):
    list_display = ['skill_name', 'job_description', 'is_required', 'created_at']
    search_fields = ['skill_name']
