"""
Seed script to create a demo user, load sample resume, create target job descriptions,
and run an initial AI skill gap analysis for demonstration.
"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillgap_project.settings')
django.setup()

from django.contrib.auth.models import User
from django.core.files import File
from accounts.models import Profile
from resumes.models import Resume, ResumeSkill
from jobs.models import JobDescription, JobSkill
from analysis.models import Analysis, AnalysisMatchedSkill, AnalysisMissingSkill, SkillProgress
from resumes.nlp_utils import extract_text_from_pdf, extract_skills_from_text, match_skills, generate_recommendations

def seed():
    print("Seeding database with demo data...")

    # 1. Create Demo User
    user, created = User.objects.get_or_create(
        username='demo',
        defaults={
            'email': 'demo@skillbridge.edu',
            'first_name': 'Alex',
            'last_name': 'Morgan'
        }
    )
    user.set_password('DemoPassword123')
    user.save()

    # Update Profile
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.target_role = 'Senior Python Backend Engineer'
    profile.education = 'B.Tech in Computer Science & Engineering'
    profile.skills = 'Python, Django, React, MySQL, Git, Docker'
    profile.bio = 'Passionate software engineer focused on cloud-native backend systems and REST API development.'
    profile.save()
    print("[OK] Demo user created: demo / DemoPassword123")

    # 2. Upload Sample Resume
    pdf_path = os.path.join(os.path.dirname(__file__), 'sample_resume_john_doe.pdf')
    if os.path.exists(pdf_path):
        Resume.objects.filter(user=user).update(is_active=False)
        with open(pdf_path, 'rb') as f:
            resume = Resume(
                user=user,
                original_filename='Alex_Morgan_Resume.pdf',
                is_active=True
            )
            resume.file.save('Alex_Morgan_Resume.pdf', File(f), save=True)

        extracted_text = extract_text_from_pdf(resume.file.path)
        resume.extracted_text = extracted_text
        resume.save()

        # Extract skills
        skills = extract_skills_from_text(extracted_text)
        for s in skills:
            ResumeSkill.objects.get_or_create(
                resume=resume,
                skill_name=s['skill'],
                defaults={'confidence': s['confidence']}
            )
        print(f"[OK] Sample resume uploaded with {len(skills)} extracted skills")
    else:
        print("Notice: sample_resume_john_doe.pdf not found, skipping resume upload")
        resume = None

    # 3. Create Sample Job Descriptions
    jobs_data = [
        {
            "job_role": "Senior Python Backend Engineer",
            "company_name": "CloudScale Systems",
            "description": """
            CloudScale Systems is looking for a Senior Python Backend Engineer to scale our distributed cloud platform.
            Requirements:
            • 3+ years experience with Python and Django or FastAPI.
            • Strong experience with REST APIs and microservice architecture.
            • Experience with relational databases like PostgreSQL and MySQL.
            • Hands-on experience with Docker, Kubernetes, and container orchestration.
            • Familiarity with Amazon Web Services (AWS) or GCP cloud infrastructure.
            • Experience with Redis caching and message queues (Celery/RabbitMQ).
            • Solid understanding of Git version control and CI/CD pipelines.
            """
        },
        {
            "job_role": "Full Stack Web Developer",
            "company_name": "NextGen Innovations",
            "description": """
            NextGen Innovations is seeking a versatile Full Stack Developer to build modern web solutions.
            Requirements:
            • Strong proficiency in React, JavaScript, HTML5, CSS3, and modern frontend development.
            • Backend development using Python, Node.js, and Django REST Framework.
            • Database management with MySQL, PostgreSQL, and MongoDB.
            • Git collaboration and Agile/Scrum team experience.
            • Understanding of REST API integration and state management.
            """
        },
        {
            "job_role": "AI / Machine Learning Engineer",
            "company_name": "NeuralTech AI Labs",
            "description": """
            We are hiring a Machine Learning Engineer to deploy state-of-the-art predictive models.
            Requirements:
            • Proficiency in Python, NumPy, Pandas, and Scikit-Learn.
            • Experience with Machine Learning algorithms and Deep Learning frameworks (PyTorch or TensorFlow).
            • Knowledge of Natural Language Processing (NLP) and large language model architectures.
            • Docker containerization and cloud model deployment on AWS.
            • Strong mathematics, statistics, and data science background.
            """
        }
    ]

    saved_jobs = []
    for jd in jobs_data:
        job, _ = JobDescription.objects.get_or_create(
            user=user,
            job_role=jd['job_role'],
            company_name=jd['company_name'],
            defaults={'description': jd['description']}
        )
        # Extract skills
        extracted_skills = extract_skills_from_text(jd['description'])
        for s in extracted_skills:
            JobSkill.objects.get_or_create(
                job_description=job,
                skill_name=s['skill'],
                defaults={'is_required': True}
            )
        saved_jobs.append(job)
    print(f"[OK] Created {len(saved_jobs)} sample job descriptions with extracted skills")

    # 4. Run an initial analysis between resume and the first job
    if resume and saved_jobs:
        primary_job = saved_jobs[0]
        resume_skills = list(resume.skills.values_list('skill_name', flat=True))
        job_skills = list(primary_job.skills.values_list('skill_name', flat=True))

        result = match_skills(resume_skills, job_skills, threshold=0.45)
        recommendations = generate_recommendations(result['missing'])

        analysis = Analysis.objects.create(
            user=user,
            resume=resume,
            job_description=primary_job,
            job_role=primary_job.job_role,
            company_name=primary_job.company_name,
            match_percentage=result['match_percentage'],
            total_job_skills=result['total_job_skills'],
            total_matched=result['total_matched'],
            total_missing=result['total_missing'],
            recommendations_json=json.dumps(recommendations)
        )

        for match in result['matched']:
            AnalysisMatchedSkill.objects.create(
                analysis=analysis,
                job_skill=match['job_skill'],
                resume_skill=match['resume_skill'],
                similarity_score=match['similarity']
            )

        for i, missing_skill in enumerate(result['missing']):
            rec_text = ''
            if i < len(recommendations):
                rec = recommendations[i]
                rec_text = f"{rec['description']}\n" + "\n".join(f"• {step}" for step in rec['steps'])

            AnalysisMissingSkill.objects.create(
                analysis=analysis,
                skill_name=missing_skill,
                recommendation=rec_text
            )

            # Create progress item
            status_choice = 'in_progress' if i == 0 else 'not_started'
            SkillProgress.objects.get_or_create(
                user=user,
                skill_name=missing_skill,
                defaults={'analysis': analysis, 'status': status_choice}
            )

        print(f"[OK] Completed initial analysis: {result['match_percentage']}% match ({result['total_matched']} matched, {result['total_missing']} missing)")


    print("\nDatabase seeded successfully!")

if __name__ == '__main__':
    seed()
