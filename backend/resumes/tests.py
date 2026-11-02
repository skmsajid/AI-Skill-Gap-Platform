from django.test import TestCase
from django.contrib.auth.models import User
from resumes.models import Resume, ResumeSkill
from resumes.nlp_utils import extract_skills_from_text, normalize_skill, compute_skill_similarity

class ResumeNLPTestCase(TestCase):
    def test_extract_skills_from_resume_text(self):
        sample_resume_text = """
        John Doe
        Software Engineer
        Experience:
        Developed scalable microservices using Python, Django, and Django REST Framework.
        Managed PostgreSQL databases, performed query optimization, and wrote complex queries.
        Built dynamic frontend components using React.js, JavaScript, and Tailwind CSS.
        Utilized Docker for containerization and automated deployments using Git.
        """
        extracted = extract_skills_from_text(sample_resume_text)
        extracted_skill_names = [item['skill'].lower() for item in extracted]

        # Verify key technical skills were detected
        self.assertIn('python', extracted_skill_names)
        self.assertIn('django', extracted_skill_names)
        self.assertIn('react.js', extracted_skill_names)
        self.assertIn('git', extracted_skill_names)
        self.assertIn('docker', extracted_skill_names)

    def test_semantic_similarity(self):
        # "Django REST Framework" vs "REST API development"
        score = compute_skill_similarity("django rest framework", "rest api development")
        self.assertGreater(score, 0.40)

        # "React" vs "React.js"
        exact_score = compute_skill_similarity("react", "react.js")
        self.assertGreater(score, 0.40)

        # Completely unrelated: "Python" vs "Graphic Design"
        unrelated = compute_skill_similarity("python", "graphic design")
        self.assertLess(unrelated, 0.30)
