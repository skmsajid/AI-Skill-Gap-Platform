"""
Serializers for the accounts app.
Handles user registration, login, and profile data with full validation.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration with comprehensive validation."""
    username = serializers.CharField(max_length=150, min_length=3)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=30)
    last_name = serializers.CharField(max_length=30, required=False, allow_blank=True, default='')
    target_role = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    education = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')

    def validate_username(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Username cannot be blank.")
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return val

    def validate_email(self, value):
        val = value.strip().lower()
        if not val:
            raise serializers.ValidationError("Email cannot be blank.")
        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError("An account with this email address is already registered.")
        return val

    def validate(self, data):
        pwd = data.get('password')
        confirm_pwd = data.get('confirm_password')
        if confirm_pwd is not None and pwd != confirm_pwd:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data.get('last_name', ''),
        )
        # Profile is created via post_save signal
        if hasattr(user, 'profile'):
            user.profile.target_role = validated_data.get('target_role', '')
            user.profile.education = validated_data.get('education', '')
            user.profile.save()
        else:
            Profile.objects.create(
                user=user,
                target_role=validated_data.get('target_role', ''),
                education=validated_data.get('education', '')
            )
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login supporting username or email."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'education', 'target_role', 'skills', 'bio',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        updated_user = False

        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
            updated_user = True
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
            updated_user = True
        if 'email' in user_data:
            new_email = user_data['email'].strip().lower()
            if new_email and new_email != user.email:
                if User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
                    raise serializers.ValidationError({'email': 'This email address is already in use.'})
                user.email = new_email
                updated_user = True

        if updated_user:
            user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for auth responses."""
    target_role = serializers.CharField(source='profile.target_role', read_only=True, default='')
    education = serializers.CharField(source='profile.education', read_only=True, default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'target_role', 'education']
