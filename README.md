# AI-Powered Skill Gap Analysis and Career Roadmap Platform (SkillBridge)
> **Major Project — Semester-1 Production Build**  
> A full-stack web application designed for job-specific skill gap analysis, semantic skill matching, and interactive career roadmapping.

---

## 1. Project Overview

**SkillBridge** is a job-specific skill gap analysis platform built for students and early-career developers. Instead of relying on rigid keyword lookups or arbitrary chatbot answers, the platform uses **PyMuPDF text extraction**, **NLP pattern recognition**, and **TF-IDF + Cosine Similarity semantic embeddings** to evaluate the compatibility between an uploaded resume and targeted job postings.

### Core User Journey
1. **User Authentication & Profile**: Register with target role and career goals.
2. **Resume Management**: Upload a PDF resume, extract text, and parse identified technical skills.
3. **Job Description Management**: Save target job postings across companies or enter new descriptions on the fly.
4. **Semantic Skill Matching**: Pretrained vector similarity pairs related technologies (e.g., *"Django REST Framework"* ↔ *"REST API development"*).
5. **Skill Gap Calculation**: Dynamically compute genuine match percentages (no hardcoded scores), distinguishing matched competencies from missing gaps.
6. **Actionable Recommendations**: Automatically generate learning steps and roadmap tasks for missing skills.
7. **Skill Progress Tracking**: Mark missing skills as *Not Started*, *In Progress*, or *Completed*.
8. **Analysis History**: Persist all completed analyses with dates, scores, and breakdowns for interview preparation.

---

## 2. Key Features

- **Session-Based Django Authentication**: Secure, simple, and clean Django authentication with CSRF protection (no JWT or third-party OAuth complexity).
- **Automated Resume Parsing**: Extract raw text and parse 300+ technical competencies from PDF resumes using PyMuPDF.
- **Saved Job Posting Repository**: Manage multiple target job postings with automatic requirement extraction.
- **Adjustable Semantic Threshold**: User-controlled similarity threshold slider (0.25 to 0.80) to tune strictness for synonymous and related technologies.
- **Authentic Match Percentage**: Calculated directly via `(total_matched / total_job_skills) * 100`.
- **Roadmap Tracker**: Progress tracking with status toggles directly on analysis results and a dedicated roadmap dashboard.
- **Auditable Historical Reports**: Permanent log of past analyses with detailed comparisons.
- **Professional Product Design**: Styled with a tailored palette, Inter typography, responsive layouts, and zero generic neon/flashy AI gimmicks.

---

## 3. Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, React Router v6, Lucide Icons, Axios, Modern Vanilla CSS Design Tokens |
| **Backend** | Python 3.10+, Django 5.x, Django REST Framework (DRF), django-cors-headers |
| **Database** | MySQL (with SQLite default fallback toggle in `.env`) |
| **AI / NLP** | PyMuPDF (`pymupdf`), Scikit-Learn (`TfidfVectorizer`, `cosine_similarity`), NumPy, Regular Expressions |
| **Build & Tooling** | Vite 5.x, Python `unittest` / Django `TestCase` |

---

## 4. Project Structure

```
AI-Skill-Gap-Platform/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── seed_data.py                    # One-command demo seeder
│   ├── generate_sample_resume.py       # Sample PDF generator
│   ├── sample_resume_john_doe.pdf      # Generated test PDF resume
│   ├── skillgap_project/               # Django root project configuration
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── accounts/                       # Authentication and User Profile
│   │   ├── models.py                   # Profile model
│   │   ├── serializers.py              # UserSerializer, ProfileSerializer
│   │   ├── views.py                    # Register, login, logout, profile
│   │   └── tests.py
│   ├── resumes/                        # Resume upload and PDF text parsing
│   │   ├── models.py                   # Resume, ResumeSkill models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── nlp_utils.py                # Core NLP & Semantic Matching engine
│   │   └── tests.py
│   ├── jobs/                           # Target job descriptions management
│   │   ├── models.py                   # JobDescription, JobSkill models
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── tests.py
│   └── analysis/                       # Gap analysis, calculations, roadmap
│       ├── models.py                   # Analysis, MatchedSkill, MissingSkill, SkillProgress
│       ├── serializers.py
│       ├── views.py                    # run_analysis, history, progress, dashboard
│       └── tests.py
└── frontend/
    ├── package.json
    ├── vite.config.js                  # Proxy configuration to Django (port 8000)
    ├── index.html
    └── src/
        ├── api.js                      # Axios instance with CSRF handling & endpoints
        ├── index.css                   # Complete design system tokens and component styles
        ├── main.jsx                    # React entry point
        ├── App.jsx                     # Route declarations
        ├── context/
        │   └── AuthContext.jsx         # User session provider
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── DashboardLayout.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── LandingPage.jsx         # Public landing with workflow & features
            ├── LoginPage.jsx           # Clean sign-in
            ├── RegisterPage.jsx        # Account registration
            ├── DashboardPage.jsx       # Readiness stats, recent analyses, resume badge
            ├── ProfilePage.jsx         # Profile view and update
            ├── ResumePage.jsx          # PDF resume upload, skills preview, text viewer
            ├── JobDescriptionsPage.jsx # Saved jobs list & new job creation modal
            ├── SkillAnalysisPage.jsx   # Interactive semantic analysis engine
            ├── AnalysisHistoryPage.jsx # Searchable past analyses archive
            ├── AnalysisDetailPage.jsx  # Detailed comparison and recommendation view
            └── SkillRoadmapPage.jsx    # Roadmap progress tracker
```

---

## 5. Database Design Overview

The database design uses clean relational normalization with Django ORM:

1. **`User`** *(Django Built-in)*: Core credentials (username, email, password hash).
2. **`Profile`** *(One-to-One with User)*: Personal details, education, target role, declared skills, and bio.
3. **`Resume`** *(Foreign Key to User)*: Uploaded PDF file path, original filename, full extracted text, active boolean flag.
4. **`ResumeSkill`** *(Foreign Key to Resume)*: Unique technical skills detected from the resume text with confidence scores.
5. **`JobDescription`** *(Foreign Key to User)*: Company name, job role, full description text.
6. **`JobSkill`** *(Foreign Key to JobDescription)*: Technical skills identified as required by the job posting.
7. **`Analysis`** *(Foreign Key to User, Resume, JobDescription)*: Job role, company, calculated match percentage, total job skills, total matched count, total missing count, JSON recommendations, timestamp.
8. **`AnalysisMatchedSkill`** *(Foreign Key to Analysis)*: Target job skill, matching resume skill, and semantic cosine similarity score.
9. **`AnalysisMissingSkill`** *(Foreign Key to Analysis)*: Unmatched job requirement with specific learning recommendation.
10. **`SkillProgress`** *(Foreign Key to User & Analysis)*: Tracks learning status (`not_started`, `in_progress`, `completed`) for missing competencies.

---

## 6. AI/NLP Implementation & Semantic Skill Matching

### How It Works

```
Resume PDF ───────► PyMuPDF ───────► Raw Text ───────► NLP Pattern Recognition ──────► Resume Skills
                                                                                           │
Job Description ─────────────────────────────────────► NLP Pattern Recognition ──────► Job Skills
                                                                                           │
                                  ┌────────────────────────────────────────────────────────┘
                                  ▼
                    Pretrained TF-IDF Character & Word N-Gram Embeddings
                                  │
                                  ▼
                    Pairwise Cosine Similarity Matrix:
                    Similarity(Skill_A, Skill_B) = (A · B) / (||A|| * ||B||)
                                  │
                                  ▼
                    Compare against Similarity Threshold (Default: 0.45)
                    ├── Score >= Threshold: Matched Skill (e.g. "Django REST" ↔ "REST API")
                    └── Score < Threshold:  Missing Skill (e.g. "Docker", "AWS")
                                  │
                                  ▼
                    Match Percentage = (Total Matched / Total Job Skills) * 100
```

- **No Arbitrary Guessing**: All match percentages are computed mathematically from identified skill vectors.
- **Synonym Recognition**: N-gram sub-word tokenization recognizes closely related framework terms (e.g., *React* and *React.js*, *Django REST Framework* and *REST API*).
- **Threshold Control**: Users can adjust the slider from 0.25 (lenient) to 0.80 (strict).

---

## 7. Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MySQL Server (optional; SQLite is enabled by default for zero-config startup)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd AI-Skill-Gap-Platform
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate   # Windows

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed database with sample user, jobs, resume, and initial analysis
python seed_data.py

# Run test suite to verify everything passes
python manage.py test
```

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Test production build
npm run build
```

---

## 8. Running the Application

### Start the Backend (Terminal 1)
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```

### Start the Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:3000`**

### Pre-configured Demo Credentials
- **Username**: `demo`
- **Password**: `DemoPassword123`
*(Or register a new account on the Register page)*

---

## 9. Database Configuration (MySQL vs SQLite)

In `backend/.env`:

```env
# Default: runs immediately on SQLite without external database service
USE_SQLITE=True

# To switch to MySQL:
# USE_SQLITE=False
# DB_NAME=skillgap_db
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_HOST=localhost
# DB_PORT=3306
```

If connecting to MySQL:
1. Create the database in MySQL: `CREATE DATABASE skillgap_db CHARACTER SET utf8mb4;`
2. Set `USE_SQLITE=False` in `backend/.env`.
3. Run `python manage.py migrate`.

---

## 10. API Endpoints Documentation

### Authentication & Profile (`/api/accounts/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/accounts/csrf/` | Retrieve CSRF cookie token |
| `POST` | `/api/accounts/register/` | Register new user and auto-login |
| `POST` | `/api/accounts/login/` | Session login with credentials |
| `POST` | `/api/accounts/logout/` | Terminate session |
| `GET` | `/api/accounts/profile/` | Fetch current user & profile details |
| `PUT` | `/api/accounts/profile/` | Update profile fields (target role, education, bio) |

### Resumes (`/api/resumes/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/resumes/current/` | Get active resume with extracted skills |
| `GET` | `/api/resumes/` | List all uploaded resumes |
| `POST` | `/api/resumes/upload/` | Upload PDF resume, extract text and parse skills |
| `DELETE` | `/api/resumes/<id>/` | Delete a specific resume |

### Target Jobs (`/api/jobs/`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs/` | List all saved job postings |
| `POST` | `/api/jobs/` | Save new job posting & extract required skills |
| `GET` | `/api/jobs/<id>/` | Get detailed job description & required skills |
| `DELETE` | `/api/jobs/<id>/` | Delete saved job posting |

### Skill Gap Analysis (`/api/analysis/`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analysis/run/` | Execute semantic AI skill gap analysis |
| `GET` | `/api/analysis/history/` | List all previous analyses |
| `GET` | `/api/analysis/history/<id>/` | Get full breakdown of a past analysis |
| `DELETE` | `/api/analysis/history/<id>/` | Delete historical analysis record |
| `GET` | `/api/analysis/dashboard/` | Get aggregate metrics for the dashboard |
| `GET` | `/api/analysis/progress/` | Get all roadmap skill progress items |
| `PUT/PATCH` | `/api/analysis/progress/<id>/` | Update skill status (`not_started`, `in_progress`, `completed`) |

---

## 11. Known Limitations & Semester-2 Roadmap

1. **Scanned PDF Resumes**: Current text extraction requires text-based PDFs. Image-based or scanned PDFs require OCR (planned for Semester-2).
2. **Deep Curriculum Roadmap**: Current recommendations provide structured 3-step action points per skill; Semester-2 can integrate curated external course links and video recommendations.
3. **Advanced LLM Feedback**: While local NLP handles embedding similarity reliably and deterministically, adding an optional external LLM API provides qualitative project critique.
