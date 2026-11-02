from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

class AccountsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/accounts/register/'
        self.login_url = '/api/accounts/login/'
        self.profile_url = '/api/accounts/profile/'

    def test_registration_and_auto_login(self):
        payload = {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'StrongPassword123',
            'first_name': 'John',
            'last_name': 'Doe',
            'target_role': 'Python Developer',
            'education': 'B.Tech CS'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['username'], 'john_doe')
        
        # Verify user and profile in DB
        user = User.objects.get(username='john_doe')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.profile.target_role, 'Python Developer')

    def test_duplicate_registration_rejected(self):
        User.objects.create_user(username='existing_user', email='exist@example.com', password='Password123')
        payload = {
            'username': 'existing_user',
            'email': 'different@example.com',
            'password': 'Password123',
            'first_name': 'Alex'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_flow(self):
        user = User.objects.create_user(username='testuser', email='test@example.com', password='Password123')
        # Bad login
        bad_res = self.client.post(self.login_url, {'username': 'testuser', 'password': 'WrongPassword'}, format='json')
        self.assertEqual(bad_res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Good login
        good_res = self.client.post(self.login_url, {'username': 'testuser', 'password': 'Password123'}, format='json')
        self.assertEqual(good_res.status_code, status.HTTP_200_OK)

    def test_profile_update(self):
        user = User.objects.create_user(username='profileuser', email='prof@example.com', password='Password123')
        self.client.force_authenticate(user=user)
        
        update_data = {
            'first_name': 'UpdatedName',
            'target_role': 'Senior Full Stack Engineer',
            'education': 'M.S. Software Engineering',
            'skills': 'Python, Django, React'
        }
        res = self.client.put(self.profile_url, update_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'UpdatedName')
        self.assertEqual(user.profile.target_role, 'Senior Full Stack Engineer')
