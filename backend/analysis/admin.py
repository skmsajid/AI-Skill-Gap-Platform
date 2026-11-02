from django.contrib import admin
from .models import Analysis, AnalysisMatchedSkill, AnalysisMissingSkill, SkillProgress


@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ['user', 'job_role', 'company_name', 'match_percentage', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'job_role', 'company_name']


@admin.register(AnalysisMatchedSkill)
class AnalysisMatchedSkillAdmin(admin.ModelAdmin):
    list_display = ['analysis', 'job_skill', 'resume_skill', 'similarity_score']


@admin.register(AnalysisMissingSkill)
class AnalysisMissingSkillAdmin(admin.ModelAdmin):
    list_display = ['analysis', 'skill_name']


@admin.register(SkillProgress)
class SkillProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'skill_name', 'status', 'updated_at']
    list_filter = ['status']
    search_fields = ['skill_name', 'user__username']
