"""
URL patterns for the jobs app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.job_list, name='job-list'),
    path('create/', views.create_job, name='create-job'),
    path('<int:job_id>/', views.job_detail, name='job-detail'),
    path('<int:job_id>/update/', views.update_job, name='update-job'),
    path('<int:job_id>/delete/', views.delete_job, name='delete-job'),
]
