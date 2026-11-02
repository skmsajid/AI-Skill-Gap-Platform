"""
AI/NLP Skill Extraction, Normalization, and Semantic Matching Module for SkillBridge.

This module provides:
1. PyMuPDF-based text extraction from PDF resumes with error handling for scanned/empty files.
2. Comprehensive technical skills database (excluding generic soft skills like communication, hardworking).
3. Canonical skill normalization and alias mapping.
4. Duplicate removal before and after processing.
5. Multi-tier semantic skill matching with strict domain isolation (MySQL != PostgreSQL, DevOps != OOP, Authentication != Communication).
6. Accurate match percentage calculation: (matched_unique / total_required_unique) * 100.
7. Targeted, practical 3-step learning recommendations for missing skills.
"""

import re
import os
import pymupdf as fitz  # PyMuPDF
from django.conf import settings

# ─────────────────────────────────────────────────────────────────────────────
# 1. CANONICAL SKILLS DEFINITION & DISPLAY NAMES
# ─────────────────────────────────────────────────────────────────────────────

CANONICAL_SKILLS = {
    # Programming Languages
    "python": "Python",
    "java": "Java",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "c": "C",
    "c++": "C++",
    "c#": "C#",
    "go": "Go",
    "rust": "Rust",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",
    "matlab": "MATLAB",
    "dart": "Dart",
    "bash": "Bash",
    "shell scripting": "Shell Scripting",
    "powershell": "PowerShell",
    "sql": "SQL",

    # Backend Frameworks & Technologies
    "django": "Django",
    "django rest framework": "Django REST Framework",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "node.js": "Node.js",
    "express.js": "Express.js",
    "spring boot": "Spring Boot",
    "spring": "Spring Framework",
    "asp.net": "ASP.NET",
    ".net core": ".NET Core",
    "ruby on rails": "Ruby on Rails",
    "laravel": "Laravel",
    "nest.js": "Nest.js",

    # Frontend Technologies
    "react": "React.js",
    "react.js": "React.js",
    "angular": "Angular",
    "vue.js": "Vue.js",
    "svelte": "Svelte",
    "next.js": "Next.js",
    "nuxt.js": "Nuxt.js",
    "html": "HTML",
    "css": "CSS",
    "tailwind css": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "sass": "Sass",
    "redux": "Redux",
    "jquery": "jQuery",
    "webpack": "Webpack",
    "vite": "Vite",

    # APIs & Web Services
    "rest api": "REST API",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "websockets": "WebSockets",
    "microservices": "Microservices",
    "postman": "Postman",

    # Databases
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "mongodb": "MongoDB",
    "sqlite": "SQLite",
    "redis": "Redis",
    "oracle": "Oracle DB",
    "sql server": "SQL Server",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "firebase": "Firebase",
    "elasticsearch": "Elasticsearch",

    # Cloud & DevOps
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "aws": "Amazon Web Services",
    "amazon web services": "Amazon Web Services",
    "azure": "Azure",
    "google cloud": "Google Cloud",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "ci/cd": "CI/CD",
    "jenkins": "Jenkins",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "linux": "Linux",
    "nginx": "Nginx",
    "devops": "DevOps",

    # Computer Science & Architecture Concepts
    "data structures & algorithms": "Data Structures & Algorithms",
    "oop": "OOP",
    "system design": "System Design",
    "software architecture": "Software Architecture",
    "design patterns": "Design Patterns",
    "authentication": "Authentication",
    "oauth": "OAuth",
    "jwt": "JWT",

    # Data Science, ML & AI
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "artificial intelligence": "Artificial Intelligence",
    "natural language processing": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "keras": "Keras",
    "data analysis": "Data Analysis",
    "data visualization": "Data Visualization",

    # Testing & QA
    "unit testing": "Unit Testing",
    "integration testing": "Integration Testing",
    "pytest": "PyTest",
    "jest": "Jest",
    "selenium": "Selenium",
    "cypress": "Cypress",
    "tdd": "TDD",
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. ALIAS MAPPINGS -> CANONICAL KEYS
# ─────────────────────────────────────────────────────────────────────────────

SKILL_ALIASES = {
    # Python & Backend aliases
    "python programming": "python",
    "python3": "python",
    "python 3": "python",
    "drf": "django rest framework",
    "djangorestframework": "django rest framework",
    "django-rest-framework": "django rest framework",
    "django rest": "django rest framework",
    "django framework": "django",
    "flask framework": "flask",
    "fastapi framework": "fastapi",
    "nodejs": "node.js",
    "node": "node.js",
    "node js": "node.js",
    "express": "express.js",
    "expressjs": "express.js",
    "express js": "express.js",
    "springboot": "spring boot",
    "spring framework": "spring",
    "rails": "ruby on rails",
    "nestjs": "nest.js",
    ".net": ".net core",
    "dotnet": ".net core",

    # Frontend aliases
    "reactjs": "react",
    "react.js": "react",
    "react js": "react",
    "angularjs": "angular",
    "angular.js": "angular",
    "vue": "vue.js",
    "vuejs": "vue.js",
    "nextjs": "next.js",
    "nuxtjs": "nuxt.js",
    "html5": "html",
    "css3": "css",
    "tailwind": "tailwind css",
    "tailwindcss": "tailwind css",
    "scss": "sass",

    # API aliases
    "rest": "rest api",
    "restful": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "rest apis": "rest api",
    "rest api development": "rest api",
    "restful web services": "rest api",
    "rest architecture": "rest api",
    "websocket": "websockets",

    # Database aliases
    "postgres": "postgresql",
    "postgresql database": "postgresql",
    "postgres database": "postgresql",
    "mysql database": "mysql",
    "mongo": "mongodb",
    "mongo db": "mongodb",
    "sqlite3": "sqlite",
    "mssql": "sql server",
    "microsoft sql server": "sql server",
    "oracle database": "oracle",

    # Cloud & DevOps aliases
    "amazon web services": "aws",
    "aws cloud": "aws",
    "google cloud platform": "google cloud",
    "gcp": "google cloud",
    "microsoft azure": "azure",
    "k8s": "kubernetes",
    "docker containers": "docker",
    "containerization": "docker",
    "git version control": "git",
    "version control": "git",
    "continuous integration": "ci/cd",
    "continuous deployment": "ci/cd",
    "ci / cd": "ci/cd",
    "cicd": "ci/cd",

    # Core CS aliases
    "dsa": "data structures & algorithms",
    "data structures and algorithms": "data structures & algorithms",
    "data structures": "data structures & algorithms",
    "algorithms": "data structures & algorithms",
    "algorithm design": "data structures & algorithms",
    "object oriented programming": "oop",
    "object-oriented programming": "oop",
    "oops": "oop",
    "object-oriented": "oop",
    "user authentication": "authentication",
    "auth": "authentication",
    "json web token": "jwt",
    "json web tokens": "jwt",
    "oauth 2.0": "oauth",
    "oauth2": "oauth",

    # AI / ML aliases
    "ml": "machine learning",
    "dl": "deep learning",
    "ai": "artificial intelligence",
    "nlp": "natural language processing",
    "cv": "computer vision",
    "sklearn": "scikit-learn",
    "test driven development": "tdd",
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. DOMAIN ISOLATION / INCOMPATIBLE TECHNOLOGY FAMILIES
# Distinct specific technologies in these families MUST NEVER be falsely matched.
# ─────────────────────────────────────────────────────────────────────────────

INCOMPATIBLE_FAMILIES = [
    # Distinct databases:
    {"mysql", "postgresql", "mongodb", "sqlite", "redis", "oracle", "sql server", "cassandra", "dynamodb"},
    # Distinct backend frameworks:
    {"django", "flask", "fastapi", "spring boot", "express.js", "nest.js", "ruby on rails", "laravel", "asp.net"},
    # Distinct frontend frameworks:
    {"react", "angular", "vue.js", "svelte"},
    # Distinct cloud providers:
    {"aws", "azure", "google cloud"},
    # Distinct programming languages:
    {"python", "java", "javascript", "typescript", "c", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "dart"},
    # Concept vs tool confusion:
    {"authentication", "communication"},
    {"devops", "oop"},
    {"docker", "kubernetes"},
]

# Words that MUST NOT be considered technical skills
DISALLOWED_GENERIC_WORDS = {
    "communication", "hardworking", "team player", "teamwork", "leadership",
    "problem solving", "critical thinking", "analytical skills", "motivated",
    "enthusiastic", "fast learner", "detail oriented", "time management",
    "interpersonal skills", "adaptability", "creativity", "work ethic"
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. NORMALIZATION & DEDUPLICATION FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────

def normalize_skill(skill_name):
    """
    Normalize a skill name to its canonical string key.
    Provided for backwards compatibility with tests and callers.
    """
    key = get_canonical_key(skill_name)
    return key if key else str(skill_name).lower().strip()


def get_canonical_key(skill_name):
    """
    Return the normalized lowercase canonical lookup key for any skill name or alias.
    Returns None if the skill is a disallowed generic word.
    """
    if not skill_name:
        return None
    raw = skill_name.strip().lower()
    
    # Check disallowed generic words
    if raw in DISALLOWED_GENERIC_WORDS:
        return None
        
    # Check alias dictionary
    if raw in SKILL_ALIASES:
        return SKILL_ALIASES[raw]
        
    # Check canonical dictionary
    if raw in CANONICAL_SKILLS:
        return raw

    # Fallback cleanup: remove common noise suffixes
    cleaned = re.sub(r'\s+(programming|developer|development|framework|technology|database|library)$', '', raw)
    if cleaned in SKILL_ALIASES:
        return SKILL_ALIASES[cleaned]
    if cleaned in CANONICAL_SKILLS:
        return cleaned

    return raw


def get_canonical_display_name(skill_name):
    """
    Return the professional display name for a skill (e.g., 'Django REST Framework').
    """
    key = get_canonical_key(skill_name)
    if not key:
        return skill_name.strip().title()
    return CANONICAL_SKILLS.get(key, key.title())


def deduplicate_skills(skills_list):
    """
    Given a list of skill strings or skill dicts, return a list of UNIQUE
    canonical skills.
    
    Ensures that duplicates like ['Python', 'python programming', 'PYTHON']
    collapse to a single ['Python'].
    """
    seen_keys = set()
    unique_skills = []

    for item in skills_list:
        name = item['skill'] if isinstance(item, dict) else str(item)
        canon_key = get_canonical_key(name)
        if not canon_key or canon_key in DISALLOWED_GENERIC_WORDS:
            continue
        if canon_key not in seen_keys:
            seen_keys.add(canon_key)
            display_name = get_canonical_display_name(canon_key)
            if isinstance(item, dict):
                unique_skills.append({
                    'skill': display_name,
                    'canonical_key': canon_key,
                    'confidence': item.get('confidence', 1.0)
                })
            else:
                unique_skills.append(display_name)

    return unique_skills


# ─────────────────────────────────────────────────────────────────────────────
# 5. PDF TEXT EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_path):
    """
    Extract readable text from a PDF file using PyMuPDF.
    
    Validates that:
    1. The file exists and is accessible.
    2. The PDF is not empty or image-only/scanned.
    
    Raises:
        ValueError: If file is missing, empty, or unreadable.
    """
    if not os.path.exists(file_path):
        raise ValueError(f"Resume file not found at path: {file_path}")

    try:
        doc = fitz.open(file_path)
        if len(doc) == 0:
            doc.close()
            raise ValueError("The uploaded PDF has 0 pages and is empty.")

        text_parts = []
        for page_idx, page in enumerate(doc):
            page_text = page.get_text()
            if page_text:
                text_parts.append(page_text)

        doc.close()
        full_text = "\n".join(text_parts).strip()

        if len(full_text) < 15:
            raise ValueError(
                "Could not extract readable text from the PDF. "
                "The file appears to be a scanned image or empty. "
                "Please upload a standard text-based PDF resume."
            )

        return full_text
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Failed to process PDF resume: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# 6. SKILL EXTRACTION FROM TEXT
# ─────────────────────────────────────────────────────────────────────────────

def extract_skills_from_text(text):
    """
    Extract technical skills from text using boundary-safe regex matching
    against the canonical skills and aliases catalog.
    
    Key rules:
    - Only technical skills are extracted (no soft skills).
    - Multi-word phrases match first (e.g. 'Django REST Framework' before 'Django').
    - Results are normalized and DEDUPLICATED immediately.
    
    Returns:
        List of dicts: [{'skill': 'Python', 'confidence': 1.0}, ...]
    """
    if not text or len(text.strip()) < 10:
        return []

    text_lower = text.lower()
    found_matches = {}

    # Build match candidate pool: all canonical names + all aliases
    all_patterns = []
    for alias, canon in SKILL_ALIASES.items():
        all_patterns.append((alias, canon))
    for canon in CANONICAL_SKILLS.keys():
        all_patterns.append((canon, canon))

    # Sort longest first to prioritize multi-word skills
    all_patterns.sort(key=lambda x: len(x[0]), reverse=True)

    for pattern_text, canonical_key in all_patterns:
        if pattern_text in DISALLOWED_GENERIC_WORDS:
            continue

        escaped = re.escape(pattern_text)
        # Handle special language symbols like C++ or C#
        if pattern_text in ("c++", "c#", "c"):
            pattern = r'(?<![a-zA-Z0-9])' + escaped + r'(?![a-zA-Z0-9+#])'
        else:
            pattern = r'(?<![a-zA-Z0-9])' + escaped + r'(?![a-zA-Z0-9])'

        matches = re.findall(pattern, text_lower)
        if matches:
            if canonical_key not in found_matches:
                confidence = min(1.0, 0.75 + (len(matches) * 0.05))
                found_matches[canonical_key] = confidence

    # Deduplicate and return standard dicts with professional display names
    results = []
    for canon_key, conf in found_matches.items():
        display_name = CANONICAL_SKILLS.get(canon_key, canon_key.title())
        results.append({
            'skill': display_name,
            'confidence': round(conf, 2)
        })

    # Sort alphabetically by skill name for consistent presentation
    results.sort(key=lambda x: x['skill'])
    return results


# ─────────────────────────────────────────────────────────────────────────────
# 7. RIGOROUS SEMANTIC SKILL SIMILARITY & MATCHING
# ─────────────────────────────────────────────────────────────────────────────

def are_incompatible_technologies(skill_key1, skill_key2):
    """
    Check if two skills belong to conflicting technology families.
    Returns True if they are completely distinct and must NEVER match.
    """
    if skill_key1 == skill_key2:
        return False

    for family in INCOMPATIBLE_FAMILIES:
        if skill_key1 in family and skill_key2 in family:
            return True

    return False


def compute_skill_similarity(skill1, skill2):
    """
    Compute semantic similarity between two technical skills.

    Rules applied in order:
    1. Exact canonical key equality -> 1.0
    2. Known incompatible technology family -> 0.0 (strict domain isolation)
    3. Curated graded relations table (covers known useful partial matches)
    4. Token-overlap Jaccard fallback for any remaining pairs.

    The function returns a RAW score in [0.0, 1.0] with NO internal threshold
    floor applied.  Callers (match_skills) are responsible for applying the
    user-supplied threshold to the returned score.

    Returns:
        float in [0.0, 1.0]
    """
    key1 = get_canonical_key(skill1)
    key2 = get_canonical_key(skill2)

    if not key1 or not key2:
        return 0.0

    # 1. Exact canonical match
    if key1 == key2:
        return 1.0

    # 2. Strict domain isolation — ALWAYS zero regardless of threshold
    if are_incompatible_technologies(key1, key2):
        return 0.0

    # 3. Curated graded relations table.
    #    Scores are intentionally spread across the 0.50-0.95 range so
    #    that changing the user threshold (0.50 / 0.70 / 0.85) produces
    #    observably different matched / missing classifications.
    #
    #    Score bands:
    #      >= 0.85 : near-identical skill (e.g. DRF satisfies REST API)
    #      0.65-0.84 : strongly related (e.g. PyTest satisfies Unit Testing)
    #      0.50-0.64 : related but partial overlap (e.g. GitHub implies Git)
    #      0.0       : explicitly distinct / incompatible
    GRADED_RELATIONS = {
        # ── REST / API ───────────────────────────────────────────────────────
        ("django rest framework", "rest api"):    0.90,
        ("rest api", "django rest framework"):    0.90,
        ("fastapi", "rest api"):                  0.78,
        ("rest api", "fastapi"):                  0.78,
        ("flask", "rest api"):                    0.65,
        ("rest api", "flask"):                    0.65,
        ("graphql", "rest api"):                  0.52,
        ("rest api", "graphql"):                  0.52,

        # ── Testing ──────────────────────────────────────────────────────────
        ("pytest", "unit testing"):               0.78,
        ("unit testing", "pytest"):               0.78,
        ("jest", "unit testing"):                 0.75,
        ("unit testing", "jest"):                 0.75,
        ("tdd", "unit testing"):                  0.70,
        ("unit testing", "tdd"):                  0.70,
        ("selenium", "integration testing"):      0.65,
        ("integration testing", "selenium"):      0.65,
        ("cypress", "integration testing"):       0.65,
        ("integration testing", "cypress"):       0.65,
        ("pytest", "tdd"):                        0.62,
        ("tdd", "pytest"):                        0.62,

        # ── Version control ──────────────────────────────────────────────────
        ("github", "git"):                        0.80,
        ("git", "github"):                        0.80,
        ("gitlab", "git"):                        0.78,
        ("git", "gitlab"):                        0.78,
        ("github", "gitlab"):                     0.65,
        ("gitlab", "github"):                     0.65,

        # ── ML / Data Science ────────────────────────────────────────────────
        ("scikit-learn", "machine learning"):     0.82,
        ("machine learning", "scikit-learn"):     0.82,
        ("tensorflow", "machine learning"):       0.80,
        ("machine learning", "tensorflow"):       0.80,
        ("pytorch", "machine learning"):          0.80,
        ("machine learning", "pytorch"):          0.80,
        ("keras", "deep learning"):               0.80,
        ("deep learning", "keras"):               0.80,
        ("tensorflow", "deep learning"):          0.78,
        ("deep learning", "tensorflow"):          0.78,
        ("pytorch", "deep learning"):             0.78,
        ("deep learning", "pytorch"):             0.78,
        ("pandas", "data analysis"):              0.75,
        ("data analysis", "pandas"):              0.75,
        ("numpy", "data analysis"):               0.62,
        ("data analysis", "numpy"):               0.62,
        ("pandas", "numpy"):                      0.68,
        ("numpy", "pandas"):                      0.68,
        ("scikit-learn", "data analysis"):        0.60,
        ("data analysis", "scikit-learn"):        0.60,
        ("natural language processing", "machine learning"): 0.65,
        ("machine learning", "natural language processing"): 0.65,

        # ── SQL / Databases ──────────────────────────────────────────────────
        ("mysql", "sql"):                         0.78,
        ("sql", "mysql"):                         0.78,
        ("postgresql", "sql"):                    0.78,
        ("sql", "postgresql"):                    0.78,
        ("sqlite", "sql"):                        0.75,
        ("sql", "sqlite"):                        0.75,

        # ── DevOps / Infra ───────────────────────────────────────────────────
        ("ci/cd", "devops"):                      0.70,
        ("devops", "ci/cd"):                      0.70,
        ("jenkins", "ci/cd"):                     0.72,
        ("ci/cd", "jenkins"):                     0.72,
        ("linux", "shell scripting"):             0.62,
        ("shell scripting", "linux"):             0.62,
        ("linux", "bash"):                        0.62,
        ("bash", "linux"):                        0.62,
        ("docker", "devops"):                     0.62,
        ("devops", "docker"):                     0.62,
        ("kubernetes", "devops"):                 0.65,
        ("devops", "kubernetes"):                 0.65,
        ("terraform", "devops"):                  0.62,
        ("devops", "terraform"):                  0.62,

        # ── Auth / Security ──────────────────────────────────────────────────
        ("jwt", "authentication"):                0.80,
        ("authentication", "jwt"):                0.80,
        ("oauth", "authentication"):              0.78,
        ("authentication", "oauth"):              0.78,
        ("jwt", "oauth"):                         0.65,
        ("oauth", "jwt"):                         0.65,

        # ── Architecture ─────────────────────────────────────────────────────
        ("design patterns", "oop"):               0.68,
        ("oop", "design patterns"):               0.68,
        ("system design", "software architecture"): 0.75,
        ("software architecture", "system design"): 0.75,
        ("microservices", "system design"):       0.62,
        ("system design", "microservices"):       0.62,
        ("microservices", "rest api"):            0.58,
        ("rest api", "microservices"):            0.58,

        # ── Frontend ─────────────────────────────────────────────────────────
        ("redux", "react"):                       0.65,
        ("react", "redux"):                       0.65,
        ("next.js", "react"):                     0.72,
        ("react", "next.js"):                     0.72,
        ("nuxt.js", "vue.js"):                    0.72,
        ("vue.js", "nuxt.js"):                    0.72,
        ("typescript", "javascript"):             0.58,
        ("javascript", "typescript"):             0.58,
        ("sass", "css"):                          0.68,
        ("css", "sass"):                          0.68,
        ("tailwind css", "css"):                  0.65,
        ("css", "tailwind css"):                  0.65,
        ("html", "css"):                          0.60,
        ("css", "html"):                          0.60,

        # ── Frameworks vs language ───────────────────────────────────────────
        ("django", "python"):                     0.58,
        ("python", "django"):                     0.58,
        ("flask", "python"):                      0.58,
        ("python", "flask"):                      0.58,
        ("fastapi", "python"):                    0.58,
        ("python", "fastapi"):                    0.58,
        ("spring boot", "java"):                  0.58,
        ("java", "spring boot"):                  0.58,
        ("express.js", "node.js"):                0.72,
        ("node.js", "express.js"):                0.72,
        ("nest.js", "node.js"):                   0.68,
        ("node.js", "nest.js"):                   0.68,

        # ── Explicitly incompatible (belt-and-suspenders) ────────────────────
        ("docker", "kubernetes"):                 0.0,
        ("mysql", "postgresql"):                  0.0,
        ("devops", "oop"):                        0.0,
        ("authentication", "communication"):      0.0,
    }

    pair = (key1, key2)
    if pair in GRADED_RELATIONS:
        return float(GRADED_RELATIONS[pair])

    # 4. Token-overlap Jaccard similarity as final fallback.
    #    Uses space-split tokens so "machine learning" and "deep learning" get
    #    some credit (shared token "learning"), whereas completely unrelated
    #    pairs score 0.  This produces scores in a useful (0.0-0.5) range.
    tokens1 = set(key1.replace("-", " ").replace(".", " ").split())
    tokens2 = set(key2.replace("-", " ").replace(".", " ").split())
    if tokens1 and tokens2:
        intersection = tokens1 & tokens2
        union = tokens1 | tokens2
        jaccard = len(intersection) / len(union) if union else 0.0
        # Scale: raw Jaccard for single shared token in two-word skills = 0.33
        # Multiply by 1.5 so a single strong shared token can reach ~0.50
        scaled = min(1.0, jaccard * 1.5)
        return float(scaled)

    return 0.0


def match_skills(resume_skills, job_skills, threshold=None):
    """
    Match unique required job skills against unique resume skills.
    
    Ensures:
    1. Both input lists are DEDUPLICATED before comparison.
    2. Threshold defaults to 0.70 for strict, reliable semantic matching.
    3. Every job skill is classified as EITHER matched OR missing (mutually exclusive).
    4. Match percentage is strictly: (total_matched / total_job_skills) * 100.
    
    Returns:
        Dict with:
            matched: list of dicts with job_skill, resume_skill, similarity
            missing: list of unique missing skill strings
            match_percentage: float (0.0 to 100.0)
            details: list of detailed evaluations
            total_job_skills: int
            total_matched: int
            total_missing: int
    """
    if threshold is None:
        if getattr(settings, 'configured', False):
            threshold = getattr(settings, 'SIMILARITY_THRESHOLD', 0.70)
        else:
            threshold = 0.70
        # Ensure threshold is sensible (at least 0.60 to prevent false positives)
        if threshold < 0.50:
            threshold = 0.65

    # Deduplicate both lists first
    deduped_resume = deduplicate_skills(resume_skills)
    deduped_job = deduplicate_skills(job_skills)

    if not deduped_job:
        return {
            'matched': [],
            'missing': [],
            'match_percentage': 0.0,
            'details': [],
            'total_job_skills': 0,
            'total_matched': 0,
            'total_missing': 0,
        }

    matched = []
    missing = []
    details = []

    for job_skill_item in deduped_job:
        job_display = job_skill_item if isinstance(job_skill_item, str) else job_skill_item['skill']
        job_key = get_canonical_key(job_display)

        best_score = 0.0
        best_resume_match = None

        for resume_skill_item in deduped_resume:
            res_display = resume_skill_item if isinstance(resume_skill_item, str) else resume_skill_item['skill']
            res_key = get_canonical_key(res_display)

            score = compute_skill_similarity(job_key, res_key)
            if score > best_score:
                best_score = score
                best_resume_match = res_display

        is_match = best_score >= threshold

        details.append({
            'job_skill': job_display,
            'best_match': best_resume_match if best_score > 0 else None,
            'similarity': round(best_score, 3),
            'is_match': is_match
        })

        if is_match and best_resume_match:
            matched.append({
                'job_skill': job_display,
                'resume_skill': best_resume_match,
                'similarity': round(best_score, 3),
            })
        else:
            missing.append(job_display)

    total_req = len(deduped_job)
    total_m = len(matched)
    total_miss = len(missing)
    pct = round((total_m / total_req) * 100, 1) if total_req > 0 else 0.0

    return {
        'matched': matched,
        'missing': missing,
        'match_percentage': pct,
        'details': details,
        'total_job_skills': total_req,
        'total_matched': total_m,
        'total_missing': total_miss,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 8. ACTIONABLE 3-STEP LEARNING RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────────────────────

RECOMMENDATION_CATALOG = {
    "django rest framework": {
        "description": "Master building RESTful APIs using Django REST Framework",
        "steps": [
            "Learn Serializers, ModelSerializers, and input validation",
            "Implement APIViews, ViewSets, and DefaultRouter for CRUD operations",
            "Configure authentication, permissions, and build a full REST API project"
        ],
        "priority": "high"
    },
    "django": {
        "description": "Learn Django web framework for Python backend development",
        "steps": [
            "Master Django MVT architecture, models, views, and URL routing",
            "Practice database migrations, queries with Django ORM, and admin panel",
            "Build a production-ready web application with session authentication"
        ],
        "priority": "high"
    },
    "docker": {
        "description": "Learn Docker containerization for reliable deployment",
        "steps": [
            "Understand container fundamentals, images, and layers",
            "Write production Dockerfiles and configure multi-stage builds",
            "Use Docker Compose to manage multi-container web apps with databases"
        ],
        "priority": "high"
    },
    "kubernetes": {
        "description": "Master container orchestration and scaling with Kubernetes",
        "steps": [
            "Learn Pods, Deployments, Services, and Ingress controllers",
            "Practice configuring ConfigMaps, Secrets, and persistent volumes",
            "Deploy and scale a containerized application on Minikube or cloud cluster"
        ],
        "priority": "medium"
    },
    "postgresql": {
        "description": "Master relational database modeling and optimization with PostgreSQL",
        "steps": [
            "Learn relational schema design, primary/foreign keys, and normalization",
            "Write complex SQL queries with JOINs, aggregations, and window functions",
            "Understand indexing strategies, transactions (ACID), and query EXPLAIN plans"
        ],
        "priority": "high"
    },
    "mysql": {
        "description": "Master MySQL database design and query optimization",
        "steps": [
            "Study relational database schemas, constraints, and data integrity",
            "Write optimized SQL queries, joins, indexes, and stored procedures",
            "Connect MySQL to backend applications using connection pools"
        ],
        "priority": "high"
    },
    "mongodb": {
        "description": "Learn MongoDB document database for flexible NoSQL storage",
        "steps": [
            "Understand document data models, BSON structure, and collections",
            "Master CRUD operations and complex MongoDB aggregation pipelines",
            "Practice schema design patterns and indexing for performant queries"
        ],
        "priority": "medium"
    },
    "redis": {
        "description": "Learn Redis for high-speed in-memory caching and session storage",
        "steps": [
            "Master Redis data structures (strings, hashes, lists, sets)",
            "Implement cache-aside pattern to speed up database query responses",
            "Use Redis for session storage and pub/sub message broadcasting"
        ],
        "priority": "medium"
    },
    "rest api": {
        "description": "Master RESTful API design principles and HTTP standards",
        "steps": [
            "Understand HTTP methods (GET, POST, PUT, PATCH, DELETE) and status codes",
            "Design clean, versioned resource endpoints following REST standards",
            "Document APIs using Swagger/OpenAPI and test endpoints with Postman"
        ],
        "priority": "high"
    },
    "react": {
        "description": "Learn modern React for building interactive single-page applications",
        "steps": [
            "Master functional components, JSX, props, and state management",
            "Utilize React Hooks (useState, useEffect, useMemo, useCallback)",
            "Build complete applications with React Router and external API integration"
        ],
        "priority": "high"
    },
    "typescript": {
        "description": "Master TypeScript for type-safe frontend and backend development",
        "steps": [
            "Learn static typing, interfaces, type aliases, and union types",
            "Practice generics, utility types, and strict compiler configurations",
            "Migrate JavaScript codebases to TypeScript with full typing coverage"
        ],
        "priority": "high"
    },
    "python": {
        "description": "Master Python core programming and advanced features",
        "steps": [
            "Solidify OOP principles, decorators, generators, and context managers",
            "Practice problem solving with standard data structures and collections",
            "Build automation scripts and real-world backend projects"
        ],
        "priority": "high"
    },
    "aws": {
        "description": "Learn core Amazon Web Services cloud infrastructure",
        "steps": [
            "Master compute and storage services (EC2, S3, IAM security)",
            "Configure managed databases (RDS) and serverless functions (Lambda)",
            "Deploy and network a full-stack web application behind an Application Load Balancer"
        ],
        "priority": "medium"
    },
    "ci/cd": {
        "description": "Implement automated testing and continuous deployment pipelines",
        "steps": [
            "Understand CI/CD principles and workflow automation",
            "Write GitHub Actions workflows to run test suites on pull requests",
            "Automate deployment pipelines to production environments"
        ],
        "priority": "medium"
    },
    "git": {
        "description": "Master Git version control and collaborative workflows",
        "steps": [
            "Learn branching, rebasing, stash, and cherry-pick operations",
            "Resolve merge conflicts and maintain a clean commit history",
            "Practice GitHub pull request workflows and code review standards"
        ],
        "priority": "high"
    },
    "oop": {
        "description": "Master Object-Oriented Programming and clean architecture",
        "steps": [
            "Learn Encapsulation, Inheritance, Polymorphism, and Abstraction in depth",
            "Apply SOLID design principles to write decoupled, maintainable code",
            "Study common creational, structural, and behavioral design patterns"
        ],
        "priority": "high"
    },
    "data structures & algorithms": {
        "description": "Strengthen technical interview readiness with DSA practice",
        "steps": [
            "Master arrays, linked lists, stacks, queues, hash maps, and trees",
            "Practice graph algorithms, dynamic programming, and binary search",
            "Solve coding problems regularly on LeetCode/HackerRank analyzing time/space complexity"
        ],
        "priority": "high"
    },
    "machine learning": {
        "description": "Master machine learning modeling and evaluation",
        "steps": [
            "Study supervised and unsupervised learning algorithms with Scikit-Learn",
            "Master feature engineering, cross-validation, and hyperparameter tuning",
            "Train and deploy predictive models using real-world datasets"
        ],
        "priority": "medium"
    },
    "authentication": {
        "description": "Master secure user authentication and authorization",
        "steps": [
            "Understand password hashing (bcrypt, PBKDF2) and session cookies",
            "Implement token-based authentication with JWT and refresh tokens",
            "Enforce role-based access control (RBAC) and CSRF protection"
        ],
        "priority": "high"
    },
}


def generate_recommendations(missing_skills):
    """
    Generate unique, actionable, 3-step learning recommendations
    for missing skills.
    
    Guarantees:
    - Every missing skill appears exactly once.
    - Tailored technical recommendations (no generic Anaconda advice).
    """
    recommendations = []
    seen = set()

    for skill in missing_skills:
        display_name = get_canonical_display_name(skill)
        canon_key = get_canonical_key(display_name)

        if canon_key in seen:
            continue
        seen.add(canon_key)

        if canon_key in RECOMMENDATION_CATALOG:
            rec = RECOMMENDATION_CATALOG[canon_key].copy()
            rec['skill'] = display_name
        else:
            rec = {
                'skill': display_name,
                'description': f"Master {display_name} fundamentals and best practices",
                'steps': [
                    f"Study core documentation and official guides for {display_name}",
                    f"Implement hands-on exercises and small utility modules using {display_name}",
                    f"Incorporate {display_name} into a portfolio project demonstrating practical proficiency"
                ],
                'priority': "medium"
            }
        recommendations.append(rec)

    priority_map = {'high': 0, 'medium': 1, 'low': 2}
    recommendations.sort(key=lambda x: priority_map.get(x.get('priority', 'medium'), 1))
    return recommendations
