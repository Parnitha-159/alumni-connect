# Alumni Connect (SIH25017)

Alumni Connect is a full-stack digital platform for Centralized Alumni Data Management and Engagement, customized with a premium theme (deep teal and warm gold) representing the VSB Engineering College (ECE Department).

## Technology Stack

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens) & Password Hashing with BcryptJS
- **Frontend**: Clean Vanilla HTML5, CSS3 (variables, animations, glassmorphism, responsive grids), and JavaScript

## Features Implemented

1. **Authentication & Roles**:
   - Sign up / Login for Alumni, Students, and Admins.
   - Password encryption using `bcryptjs`.
   - Role-based route access controls.
   - Alumni registrations start as pending until approved by the Admin.

2. **Alumni Profiles & Directory**:
   - Search/filter by batch, department, company, location, and mentor availability.
   - Custom profile pages displaying career roles, LinkedIn links, location, and contact information.
   - Base64-encoded profile photo uploads saved locally.

3. **Alumni-Student Mentorship**:
   - Alumni can volunteer as mentors, listing their domain expertise.
   - Students can browse mentors and send guidance requests.
   - Alumni manage incoming requests (Accept / Decline) on their dashboard.
   - Contact info (emails) is hidden until the mentor accepts the pairing.

4. **Job Board**:
   - Alumni and Admins can post job and internship vacancies.
   - Clean details view showing role description, type (Internship, Full-time, Remote, etc.), and poster details.

5. **Events & Reunions**:
   - Admin can announce webinars, campus reunions, and meets.
   - Integrated RSVP system tracking attendance count in real time.

6. **Spotlight & Success Stories**:
   - Alumni can submit a success story of their professional achievements.
   - Admin reviews and approves story submissions before publishing them.
   - Dynamic featured carousel on the home page highlighting approved stories.

7. **Announcements & Discussion Board**:
   - Combined community forum for QA, career queries, and placement resources.

8. **Admin Dashboard**:
   - View analytic SVGs representing department and batch year distributions.
   - Verify and approve pending alumni registrations.
   - Export the complete alumni directory database as a CSV file.

## Getting Started

### Prerequisites

- Node.js installed on your machine.

### Installation

1. Open your terminal and navigate to the project directory:
   ```bash
   cd C:\Users\bparn\.gemini\antigravity\scratch\alumni-connect
   ```
2. Install the required npm packages:
   ```bash
   npm install
   ```

### Seeding the Database

Populate the database with pre-configured VSB ECE alumni, jobs, mentorship requests, and events by running:
```bash
npm run seed
```

### Running the App

Start the backend server on `http://localhost:3000`:
```bash
npm start
```

## Demo Credentials (from Seed Script)

To help test the platform features:

| Role | Email | Password | Details |
|------|-------|----------|---------|
| **Admin** | `admin@vsb.edu` | `admin123` | Full dashboard management access |
| **Student** | `student@vsb.edu` | `student123` | Mock student (Anjali Devi, ECE) |
| **Alumni (Mentor)** | `priya.ramesh@zoho.com` | `alumni123` | Priya Ramesh (Zoho Software Engineer) |
| **Alumni (Mentor)** | `karthik.subramanian@bosch.com` | `alumni123` | Karthik Subramanian (Bosch Embedded Engineer) |
| **Alumni (Mentor)** | `divya.anand@tum.de` | `alumni123` | Divya Anand (MS student, Germany) |
