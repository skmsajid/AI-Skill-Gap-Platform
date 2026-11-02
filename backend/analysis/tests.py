from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from resumes.models import Resume, ResumeSkill
from jobs.models import JobDescription, JobSkill
from analysis.models import Analysis, SkillProgress
from resumes.nlp_utils import match_skills, generate_recommendations

class AnalysisWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='analyzer', email='analyzer@example.com', password='Password123')
        self.client.force_authenticate(user=self.user)

        # Create active resume with skills
        self.resume = Resume.objects.create(
            user=self.user,
            original_filename='john_resume.pdf',
            extracted_text='Proficient in Python, Django, MySQL, Git, and React.',
            is_active=True
        )
        for s in ['python', 'django', 'mysql', 'git', 'react']:
            ResumeSkill.objects.create(resume=self.resume, skill_name=s)

        # Create job description with required skills
        self.job = JobDescription.objects.create(
            user=self.user,
            job_role='Backend Python Engineer',
            company_name='Cloud Corp',
            description='Looking for Python, Django, REST API, MySQL, Docker, and AWS.'
        )
        for s in ['python', 'django', 'rest api', 'mysql', 'docker', 'amazon web services']:
            JobSkill.objects.create(job_description=self.job, skill_name=s)

    def test_semantic_match_skills_math(self):
        resume_skills = ['python', 'django', 'mysql', 'git', 'react']
        job_skills = ['python', 'django', 'rest api', 'mysql', 'docker', 'amazon web services']

        result = match_skills(resume_skills, job_skills, threshold=0.45)

        # Should match python, django, mysql directly
        matched_job_skills = [m['job_skill'].lower() for m in result['matched']]
        self.assertIn('python', matched_job_skills)
        self.assertIn('django', matched_job_skills)
        self.assertIn('mysql', matched_job_skills)

        # Missing should include docker and aws
        missing_skills = [s.lower() for s in result['missing']]
        self.assertIn('docker', missing_skills)
        self.assertIn('amazon web services', missing_skills)

        # Match percentage should be real and calculated: (matched / 6) * 100
        expected_percentage = round((len(result['matched']) / 6.0) * 100, 1)
        self.assertEqual(result['match_percentage'], expected_percentage)
        self.assertGreater(result['match_percentage'], 0)
        self.assertLessEqual(result['match_percentage'], 100)

    def test_run_analysis_api_and_recommendations(self):
        payload = {
            'job_description_id': self.job.id,
            'similarity_threshold': 0.45
        }
        response = self.client.post('/api/analysis/run/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.data['analysis']
        self.assertEqual(data['job_role'], 'Backend Python Engineer')
        self.assertEqual(data['company_name'], 'Cloud Corp')
        self.assertGreater(data['total_matched'], 0)
        self.assertGreater(data['total_missing'], 0)

        # Verify recommendations generated
        self.assertIn('recommendations', response.data)
        self.assertGreater(len(response.data['recommendations']), 0)

        # Verify Analysis was saved in database history
        self.assertEqual(Analysis.objects.filter(user=self.user).count(), 1)

        # Verify SkillProgress items were created for missing skills
        progress_items = SkillProgress.objects.filter(user=self.user)
        self.assertGreater(progress_items.count(), 0)

    def test_update_skill_progress(self):
        # Create a progress item
        progress = SkillProgress.objects.create(
            user=self.user,
            skill_name='docker',
            status='not_started'
        )

        update_url = f'/api/analysis/progress/{progress.id}/'
        res = self.client.put(update_url, {'status': 'in_progress'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        progress.refresh_from_db()
        self.assertEqual(progress.status, 'in_progress')

        # Test marking completed
        res2 = self.client.put(update_url, {'status': 'completed'}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        progress.refresh_from_db()
        self.assertEqual(progress.status, 'completed')

    def test_authorization_user_cannot_access_others_data(self):
        other_user = User.objects.create_user(username='other_user', email='other@example.com', password='Password123')
        other_analysis = Analysis.objects.create(
            user=other_user,
            job_role='Frontend Engineer',
            company_name='Other Inc',
            match_percentage=80.0
        )

        # Current user attempts to access other user's analysis
        res = self.client.get(f'/api/analysis/{other_analysis.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
