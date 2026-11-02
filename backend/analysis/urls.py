"""
URL patterns for the analysis app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('run/', views.run_analysis, name='run-analysis'),
    path('', views.analysis_list, name='analysis-list'),
    path('history/', views.analysis_list, name='analysis-history'),
    path('latest/', views.latest_analysis, name='latest-analysis'),
    path('dashboard/', views.dashboard_data, name='dashboard-data'),
    path('dashboard-summary/', views.dashboard_data, name='dashboard-summary'),
    path('<int:analysis_id>/', views.analysis_detail, name='analysis-detail'),
    path('history/<int:analysis_id>/', views.analysis_detail, name='analysis-detail-history'),
    path('<int:analysis_id>/delete/', views.delete_analysis, name='delete-analysis'),
    path('history/<int:analysis_id>/delete/', views.delete_analysis, name='delete-analysis-history'),
    path('progress/', views.skill_progress_list, name='skill-progress-list'),
    path('progress/<int:progress_id>/', views.update_skill_progress, name='update-skill-progress'),
]

