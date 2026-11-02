"""
Views for the accounts app.
Handles registration, login, logout, and profile management.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from .serializers import RegisterSerializer, LoginSerializer, ProfileSerializer, UserSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """Return CSRF token for the frontend and ensure the cookie is set."""
    token = get_token(request)
    return Response({'csrfToken': token})


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user and initialize their session."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Session login after registration
        login(request, user)
        profile_data = ProfileSerializer(user.profile).data if hasattr(user, 'profile') else {}
        return Response({
            'message': 'Registration successful.',
            'user': UserSerializer(user).data,
            'profile': profile_data,
        }, status=status.HTTP_201_CREATED)
    return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Log in an existing user.
    Supports either username or email address in the username field.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    input_identifier = serializer.validated_data['username'].strip()
    password = serializer.validated_data['password']

    # Support login with email address as well as username
    auth_username = input_identifier
    if '@' in input_identifier:
        matched_user = User.objects.filter(email__iexact=input_identifier).first()
        if matched_user:
            auth_username = matched_user.username

    user = authenticate(request, username=auth_username, password=password)
    if user is not None:
        login(request, user)
        profile_data = ProfileSerializer(user.profile).data if hasattr(user, 'profile') else {}
        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'profile': profile_data,
        })

    return Response(
        {'error': 'Invalid username/email or password.'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Log out the current user and flush session."""
    logout(request)
    return Response({'message': 'Logged out successfully.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """Check if the current user is authenticated."""
    profile_data = ProfileSerializer(request.user.profile).data if hasattr(request.user, 'profile') else {}
    return Response({
        'isAuthenticated': True,
        'user': UserSerializer(request.user).data,
        'profile': profile_data,
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get or update the current user's profile."""
    profile = request.user.profile

    if request.method == 'GET':
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        nested_profile = data.pop('profile', None)
        if isinstance(nested_profile, dict):
            data.update(nested_profile)

        serializer = ProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Return flat serializer data (same shape as GET) for frontend consistency
            return Response(serializer.data)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

