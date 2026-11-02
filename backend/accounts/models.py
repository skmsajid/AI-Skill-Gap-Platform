"""
Models for the accounts app.
Extends Django's built-in User model with a Profile model.
"""

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    """
    Extended user profile with career-related information.
    One-to-one relationship with Django's User model.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=15, blank=True, default='')
    education = models.CharField(max_length=200, blank=True, default='')
    target_role = models.CharField(max_length=150, blank=True, default='')
    skills = models.TextField(blank=True, default='', help_text='Comma-separated list of skills')
    bio = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


# Signal to create a Profile automatically when a User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
