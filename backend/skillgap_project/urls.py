"""
Main URL configuration for skillgap_project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/auth/', include('accounts.urls')),
    path('api/resumes/', include('resumes.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/analysis/', include('analysis.urls')),

]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
