# Project Feature Summary – Internship Portal

## Overview

This project is a **full-stack internship management and AI career guidance system** built for **students** and **companies**.

It already supports:

- student and company account creation
- login and profile management
- internship posting and browsing
- internship applications with CV upload
- applicant filtering and shortlisting
- interview scheduling with selectable time slots
- AI-based skill gap analysis from CV PDFs
- AI-backed course recommendations
- a frontend career chatbot widget

The main active stack is a **React frontend** with a **Node.js/Express + MongoDB backend**, plus some **Python ML services**.

---

## Tech Stack

| Layer        | Technology                                                                              |
| ------------ | --------------------------------------------------------------------------------------- |
| Frontend     | `React`, `Vite`, `React Router`, `Axios`, `lucide-react`                                |
| Backend      | `Node.js`, `Express`, `MongoDB`, `Mongoose`, `JWT`, `Multer`, `Nodemailer`, `pdf-parse` |
| AI / ML      | `Python`, `pandas`, `scikit-learn`, `TF-IDF`, `cosine similarity`                       |
| File storage | Uploaded CVs and profile pictures in `backend/uploads/`                                 |
| Data assets  | `backend/data/courses.csv`, `backend/data/role_requirements.csv`                        |

---

## Main Features Already Implemented

### 1. Authentication and Account Management

Implemented in:

- `backend/routes/authRoutes.js`
- `backend/middleware/authMiddleware.js`
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/RegisterStudent.jsx`
- `frontend/src/pages/RegisterCompany.jsx`

Features:

- **Student registration**
- **Company registration**
- **Shared login for both roles**
- **JWT-based authentication**
- **Role-based access control**
- Student registration is restricted to **SLIIT email addresses** (`@my.sliit.lk` / `@sliit.lk`)
- Login session is stored in `localStorage`
- Logout is available from the navbar

---

### 2. Role-Based User Profiles

Implemented in:

- `backend/routes/userRoutes.js`
- `backend/models/User.js`
- `frontend/src/pages/Profile.jsx`

Features:

- View current profile
- Edit profile information
- Upload/change profile picture
- Save username
- Student-specific fields:
  - university
  - degree
  - GPA
  - skills
- Company-specific field:
  - company name display

User model currently includes:

- `name`
- `username`
- `email`
- `password`
- `role`
- `studentId`
- `companyName`
- `profilePicture`
- `university`
- `degree`
- `gpa`
- `skills`
- `cvUrl`

---

### 3. Internship Posting and Management

Implemented in:

- `backend/routes/internshipRoutes.js`
- `backend/models/Internship.js`
- `frontend/src/pages/AddInternship.jsx`
- `frontend/src/pages/InternshipList.jsx`
- `frontend/src/pages/InternshipDetails.jsx`

Features:

- Company can **create internships**
- Public can **view all internships**
- Public can view **single internship details**
- Backend supports:
  - create
  - list
  - get by ID
  - update
  - delete
  - get internships posted by the logged-in company

Internship fields already supported:

- `title`
- `companyName`
- `location`
- `type` (`Remote`, `On-site`, `Hybrid`)
- `description`
- `skills`
- `deadline`
- `postedBy`
- `requiredSkills`
- `requiredDegree`
- `minGpa`

Extra company screening fields are already present for later filtering:

- required skills
- required degree
- minimum GPA

---

### 4. Internship Listing, Search, Filter, and Sort

Implemented in:

- `frontend/src/pages/InternshipList.jsx`
- `backend/routes/internshipRoutes.js`

Features:

- Browse all available internships
- Search by:
  - internship title
  - company name
- Filter by:
  - internship type
  - location
- Sort by:
  - nearest deadline
  - latest deadline
  - title A-Z

This gives students a usable internship browsing experience already.

---

### 5. Internship Application Flow

Implemented in:

- `backend/routes/applicationRoutes.js`
- `backend/models/Application.js`
- `frontend/src/pages/ApplyForm.jsx`

Features:

- Students can apply to internships
- CV upload is supported
- CV must be a **PDF**
- File validation exists in frontend
- Application data is saved in MongoDB
- Uploaded files are stored in `backend/uploads/`

Application model includes:

- `internshipId`
- `studentId`
- `studentName`
- `email`
- `cvFile`
- `status`
- `skillMatchPercentage`
- `shortlistEmailSent`

Application statuses already used:

- `Pending`
- `Shortlisted`
- `Interview Scheduled`
- `Rejected`

---

### 6. Applicant Review and CV Filtering for Companies

Implemented in:

- `backend/controllers/applicationController.js`
- `backend/routes/applicationRoutes.js`
- `frontend/src/pages/CompanyApplicantsPage.jsx`
- `frontend/src/components/ApplicantCard.jsx`
- `frontend/src/components/FilterBar.jsx`

Features:

- Company can load applicants
- Company can load applicants for a specific internship
- Applicant list shows:
  - student name
  - email
  - university
  - degree
  - GPA
  - skills
  - current application status
  - calculated skill match %

Filtering options already available:

- skill
- degree
- minimum GPA
- university

Actions already available:

- **shortlist applicant**
- **reject applicant**

There is logic for:

- calculating skill match percentage against internship `requiredSkills`
- checking candidate qualification using degree / GPA / skill match rules

There is also email support for shortlisted students.

---

### 7. Interview Scheduling Workflow

Implemented in:

- `backend/controllers/interviewController.js`
- `backend/routes/interviewRoutes.js`
- `backend/models/Interview.js`
- `frontend/src/components/ScheduleInterviewForm.jsx`
- `frontend/src/pages/StudentInterviewPage.jsx`

Features:

- Company can propose **exactly 4 interview date/time options**
- Interview mode can be:
  - `Online`
  - `Physical`
- Additional fields:
  - meeting link
  - physical location
  - notes
- Student can choose one of the proposed slots
- Once selected, interview status becomes confirmed
- The linked application status becomes **Interview Scheduled**

Interview model includes:

- `application`
- `slotOptions`
- `selectedSlot`
- `interviewMode`
- `meetingLink`
- `location`
- `notes`
- `status`

Student interview portal already shows:

- shortlisted applications waiting for company invitation
- pending interview invitations
- confirmed interviews

---

### 8. Email Notifications

Implemented in:

- `backend/utils/sendEmail.js`
- `backend/controllers/applicationController.js`
- `backend/controllers/interviewController.js`

Email flows currently included:

- shortlist notification email
- interview slot invitation email
- interview confirmation email

The project uses `nodemailer` with Gmail credentials from:

- `EMAIL_USER`
- `EMAIL_PASS`

---

### 9. AI Skill Gap Analyzer

Implemented in:

- `backend/server.js`
- `frontend/src/pages/SkillGapAnalyzer.jsx`

Features:

- Student uploads a **CV PDF**
- Student selects a **target job role**
- Backend parses the PDF text using `pdf-parse`
- System compares detected skills with role requirements
- Returns:
  - target role
  - required skills
  - current skills found in CV
  - matched skills
  - missing skills
  - score
  - level (`Low`, `Medium`, `High`)
  - recommendations for improvement

Supported roles currently include:

- Frontend Developer
- Backend Developer
- Full Stack Developer
- QA Engineer
- UI/UX Designer
- Data Analyst
- Machine Learning Engineer

This is one of the main AI features already working in the project.

---

### 10. AI Course Recommendation Engine

Implemented in:

- `backend/services/course_recommender.py`
- `backend/server.js`
- `backend/data/courses.csv`
- `frontend/src/pages/SkillGapAnalyzer.jsx`

Features:

- After skill gap analysis, the user can request recommended courses
- Recommendations are based on:
  - missing skills
  - selected difficulty path (`low`, `medium`, `high`)
- The model uses **TF-IDF + cosine similarity**
- Returns up to 3 recommended courses with:
  - course name
  - skills covered
  - difficulty
  - link
  - match confidence %

This is already integrated into the frontend UI.

---

### 11. Career Chatbot UI

Implemented in:

- `frontend/src/components/CareerChatbot.jsx`
- `frontend/src/components/CareerChatbot.css`

Features:

- Floating chatbot launcher
- Expand/minimize chatbot panel
- Predefined quick prompts
- User message input and bot response display
- Retry handling for temporary server errors (`502`, `504`)
- Intended topics:
  - internships
  - interview preparation
  - resume strategy
  - job market trends

Important note:

- The **chatbot frontend UI exists**
- It expects an external chatbot backend at:
  - `VITE_CHATBOT_API_URL`
  - fallback: `http://localhost:5001/api/chat`

So the chatbot **interface is already built**, but the actual chatbot backend is not visible inside this repo.

---

## Main Frontend Pages Already Available

Defined in `frontend/src/App.jsx`:

| Route                 | Page                                       |
| --------------------- | ------------------------------------------ |
| `/`                   | Internship list                            |
| `/add`                | Add internship                             |
| `/internship/:id`     | Internship details                         |
| `/apply/:id`          | Internship application form                |
| `/login`              | Login                                      |
| `/register-student`   | Student registration                       |
| `/register-company`   | Company registration                       |
| `/profile`            | Profile page                               |
| `/company-applicants` | Company applicant management               |
| `/student-interviews` | Student interview portal                   |
| `/skill-gap-analyzer` | Skill gap analyzer + course recommendation |

Also:

- `Navbar` changes by user role
- `CareerChatbot` is shown globally

---

## Main Backend API Endpoints Already Available

### Auth

- `POST /api/auth/register/student`
- `POST /api/auth/register/company`
- `POST /api/auth/login`

### User

- `GET /api/users/profile`
- `PUT /api/users/profile`

### Internships

- `POST /api/internships`
- `GET /api/internships`
- `GET /api/internships/my-internships`
- `GET /api/internships/:id`
- `PUT /api/internships/:id`
- `DELETE /api/internships/:id`

### Applications

- `POST /api/applications`
- `GET /api/applications`
- `GET /api/applications/internship/:internshipId`
- `GET /api/applications/internship/:internshipId/filter`
- `PUT /api/applications/:applicationId/shortlist`
- `PUT /api/applications/:applicationId/reject`

### Interviews

- `POST /api/interviews/propose`
- `POST /api/interviews/:interviewId/select-slot`
- `GET /api/interviews/student/:studentId/shortlisted`
- `GET /api/interviews/student/:studentId`

### AI

- `GET /api/roles`
- `POST /api/skill-gap-ai`
- `POST /api/course-recommendations`

---

## Project Workflow Already Supported

### Student flow

1. Register with SLIIT email
2. Log in
3. Update profile with university / degree / GPA / skills / profile picture
4. Browse internships
5. Apply with CV
6. Wait for shortlist result
7. If shortlisted, review interview options
8. Select one interview slot
9. Use the skill gap analyzer and course recommender for career improvement

### Company flow

1. Register company account
2. Log in
3. Add internship posts
4. View applicants
5. Filter applicants by qualifications
6. Approve / reject candidates
7. Send 4 interview slot options to shortlisted candidates
8. Track confirmed interviews

---

## Data / AI Assets Already Included

Files already present:

- `backend/data/courses.csv`
- `backend/data/role_requirements.csv`
- `backend/notebooks/course_recommendation.ipynb`
- `backend/notebooks/skill_gap_analysis.ipynb`

This shows the project already has:

- ML experimentation notebooks
- CSV-based role and course datasets
- Python recommendation logic integrated with the Node backend

---

## Current Status Notes / Partially Completed Areas

These are important for understanding the real current state:

1. **Core internship portal features are already built**
   - auth
   - profiles
   - internships
   - applications
   - shortlisting
   - interview scheduling

2. **AI features are already partially integrated and usable**
   - skill gap analysis
   - course recommendations

3. **Chatbot UI is done, but chatbot backend is not shown in this repo**
   - frontend calls `http://localhost:5001/api/chat`

4. `backend/app.py` looks like an older or experimental Flask AI service
   - it contains alternate AI endpoints
   - it references `demand_predictor`, which is not defined there
   - so the main running backend appears to be `backend/server.js`

5. Backend supports internship update/delete, but the frontend mainly exposes create and browse flows
   - a full company dashboard for managing posted internships is not yet visible

6. There are testing utilities for PDF/CV analysis:
   - `backend/test_pdf.js`
   - `backend/test_upload.js`

---

## Short One-Paragraph Summary

This project is already a strong **internship recruitment and student career guidance platform**. It includes **student/company authentication, profile management, internship posting, internship browsing, CV-based applications, applicant filtering, shortlisting, interview scheduling, email notifications, AI skill gap analysis from uploaded CVs, course recommendations based on missing skills, and a chatbot-style career assistant UI**. The main missing or partially wired parts appear to be a fully integrated chatbot backend and some advanced company-side management screens.

---

## Best Short Feature List for ChatGPT Context

Use this short version if needed:

- Student and company registration/login
- JWT auth and role-based access
- Editable student/company profiles
- Profile picture upload
- Internship posting by companies
- Internship listing, search, filter, and sort
- Internship details page
- Student application submission with PDF CV upload
- Applicant review dashboard for companies
- Applicant filtering by skill, degree, GPA, university
- Shortlist / reject applicant actions
- Interview slot proposal (4 options) by company
- Student interview slot selection and confirmation
- Email notifications for shortlist and interview events
- AI skill gap analysis from CV PDFs
- AI course recommendations by difficulty path
- Career chatbot frontend widget
