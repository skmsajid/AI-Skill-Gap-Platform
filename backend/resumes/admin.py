from django.contrib import admin
from .models import Resume, ResumeSkill


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['user', 'original_filename', 'is_active', 'uploaded_at']
    list_filter = ['is_active', 'uploaded_at']
    search_fields = ['user__username', 'original_filename']


@admin.register(ResumeSkill)
class ResumeSkillAdmin(admin.ModelAdmin):
    list_display = ['skill_name', 'resume', 'confidence', 'created_at']
    search_fields = ['skill_name']
