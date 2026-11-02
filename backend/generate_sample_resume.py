"""
Utility script to generate sample PDF resumes for testing and demonstration.
"""

import os
import pymupdf as fitz

def generate_sample_resume(output_path="sample_resume_john_doe.pdf"):
    doc = fitz.open()
    page = doc.new_page()

    resume_text = """
JOHN DOE
Email: john.doe@example.com | Phone: +1 555-0199 | Location: New York, NY
LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 3+ years of experience developing robust web applications
and backend systems. Skilled in Python, Django, REST APIs, and modern frontend technologies.

TECHNICAL SKILLS
• Programming Languages: Python, JavaScript, TypeScript, SQL, HTML5, CSS3
• Frameworks & Libraries: Django, Django REST Framework, React, React.js, Express.js, Tailwind CSS
• Databases: MySQL, PostgreSQL, SQLite, MongoDB
• Tools & DevOps: Git, GitHub, Docker, Postman, Linux, VS Code
• Concepts: RESTful APIs, OOP, MVC Architecture, Database Normalization, Agile/Scrum

PROFESSIONAL EXPERIENCE
Software Developer | TechSolutions Inc. | 2022 - Present
• Designed and developed scalable RESTful APIs using Python, Django, and Django REST Framework.
• Integrated PostgreSQL databases, improving query response time by 28% through indexing and caching.
• Built interactive client-facing dashboards using React, JavaScript, and Tailwind CSS.
• Containerized services using Docker and automated version control workflows with Git.

Junior Web Developer | Innovate Soft | 2021 - 2022
• Developed backend endpoints using Python and Flask.
• Implemented relational database schemas in MySQL.
• Collaborated in an Agile team to deliver client requirements on schedule.

EDUCATION
Bachelor of Technology in Computer Science & Engineering
Apex Institute of Technology | 2017 - 2021 | GPA: 3.8/4.0
    """

    # Insert text into page
    rect = fitz.Rect(50, 50, 550, 800)
    page.insert_textbox(rect, resume_text, fontsize=10.5, fontname="helv", color=(0.1, 0.1, 0.1))

    doc.save(output_path)
    doc.close()
    print(f"Sample resume created successfully at: {output_path}")

if __name__ == "__main__":
    generate_sample_resume()
