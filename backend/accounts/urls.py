"""
URL patterns for the accounts app.
"""

from django.urls import path
from . import views

urlpatterns = [
    path('csrf/', views.get_csrf_token, name='csrf-token'),
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('check/', views.check_auth, name='check-auth'),
    path('profile/', views.profile_view, name='profile'),
]
