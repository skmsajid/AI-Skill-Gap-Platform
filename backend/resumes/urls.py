"""
URL patterns for the resumes app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.resume_list, name='resume-list'),
    path('active/', views.active_resume, name='active-resume'),
    path('current/', views.active_resume, name='current-resume'),
    path('upload/', views.upload_resume, name='upload-resume'),
    path('<int:resume_id>/', views.delete_resume, name='delete-resume-direct'),
    path('<int:resume_id>/delete/', views.delete_resume, name='delete-resume'),
]

