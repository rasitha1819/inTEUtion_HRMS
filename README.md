# HRMS (Human Resource Management System)

A modern, production-grade **Human Resource Management System** web application focused on **Attendance Tracking, Employee Lifecycle, Leave Workflows, Role-Based Access Control (Admin, HR, Employee)**, and **Interactive Visual Dashboards**.

---

## 🛠 Tech Stack & Pinned Library Versions

### **Backend** (Python / Django REST Framework)
- **Django**: `5.1.4`
- **Django REST Framework**: `3.15.2`
- **Django REST Framework SimpleJWT**: `5.3.1`
- **Django CORS Headers**: `4.6.0`
- **drf-spectacular** (Swagger / OpenAPI 3.0): `0.27.2`
- **psycopg2-binary** (PostgreSQL): `2.9.10`
- **python-dotenv**: `1.0.1`

### **Frontend** (React / Vite)
- **React & React DOM**: `^18.3.1`
- **Vite**: `^5.4.11`
- **Tailwind CSS**: `^3.4.15`
- **React Router DOM**: `^6.28.0`
- **Axios**: `^1.7.9`
- **Lucide React** (Modern Icons): `^0.462.0`

---

## 📂 Project Architecture

```
Antigravity/
├── backend/
│   ├── apps/
│   │   ├── authentication/     # Custom User model, roles (ADMIN, HR, EMPLOYEE), JWT endpoints
│   │   │   └── management/commands/seed_data.py # Mock data generator
│   │   ├── departments/        # Department models, headcounts, managers
│   │   ├── employees/          # Employee profiles, designations, deactivation
│   │   ├── attendance/         # Check-in/out, late detection, working hours
│   │   ├── leaves/             # Entitlements, balance deduction, approve/reject
│   │   └── dashboard/          # Aggregated analytics and 7-day attendance trends
│   ├── hrms_core/              # Django settings, WSGI, ASGI, Swagger URLs
│   ├── manage.py
│   ├── requirements.txt        # Pinned backend dependencies
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios instance with JWT interceptors & token refresh
│   │   ├── context/            # AuthContext (user, roles, punch state)
│   │   ├── components/         # Layout (Sidebar, Navbar), Modals, Badges, StatCards
│   │   ├── pages/              # Auth, Dashboard, Attendance, Leaves, Employees, Departments
│   │   ├── utils/              # Helpers & formatters
│   │   ├── App.jsx             # React Router with ProtectedRoutes
│   │   ├── main.jsx
│   │   └── index.css           # Tailwind directives & glassmorphic styles
│   ├── index.html
│   ├── package.json            # Pinned frontend dependencies
│   ├── vite.config.js          # Vite config with backend proxy
│   └── tailwind.config.js
│
└── README.md
```

---

## 🚀 Quickstart & Local Setup Guide

### 1. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment (Optional - default falls back to SQLite)
cp .env.example .env

# 5. Run Database Migrations
python manage.py makemigrations authentication departments employees attendance leaves
python manage.py migrate

# 6. Seed Sample Data (Pre-populates mock staff, attendance logs & leaves)
python manage.py seed_data

# 7. Start Django Server
python manage.py runserver 8000
```

> **Backend API URL**: `http://127.0.0.1:8000/`  
> **Swagger Interactive Docs**: `http://127.0.0.1:8000/api/docs/`  
> **Redoc API Documentation**: `http://127.0.0.1:8000/api/redoc/`

---

### 2. Frontend Setup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite Development Server
npm run dev
```

> **Frontend Application URL**: `http://localhost:5173/`

---

## 🔑 Demo Login Credentials

The `python manage.py seed_data` command creates accounts for all 3 supported roles (Password for all: `Password@123`):

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@hrms.com` | `Password@123` | Full administrative access, department manager config, employee deactivation |
| **HR Manager** | `hr@hrms.com` | `Password@123` | Employee management, Leave approval inbox, company-wide punch logs |
| **Employee** | `emp@hrms.com` | `Password@123` | Daily punch in/out, personal leave applications & balance tracking |

*(You can also use the 1-Click Demo Fill buttons on the `/login` screen)*

---

## 📋 Core Modules & Key Features

### 1. 👥 Employee Management
- Complete employee directory with fast search, department filter, and Active/Inactive tabs.
- Add and Edit employee profiles with automatic user account creation.
- Deactivate / Reactivate employee access with immediate permission invalidation.
- Department and role assignments with supervisor associations.

### 2. ⏱️ Attendance Tracking & Punctuality
- Daily punch station with 1-click **Check-In** and **Check-Out** recording.
- Automatic **late arrival detection** (flagged if checked in past 09:15 AM threshold).
- Accurate **working hours computation** and half-day detection (< 4 hours).
- Monthly summary metrics: Total hours, daily average, present vs late days.
- Filterable attendance history logs by date, department, employee, and status.

### 3. 🏖️ Leave Management & Approvals
- Visual leave balance tracker (Annual, Casual, Sick, Maternity, Unpaid).
- Employee application form with automated remaining balance validation.
- HR/Manager **Leave Approval Inbox** with 1-click Approve or Reject (with feedback remarks).
- Atomic database transactions that deduct leave balances and auto-record `ON_LEAVE` attendance records upon approval.

### 4. 📊 Dynamic Dashboard & Analytics
- Personalized view adapted to user role (Admin, HR, Employee).
- 7-Day interactive SVG attendance activity trends.
- Department headcount distribution cards.
- Quick punch-in action button and real-time clock.

### 5. 🔐 Authentication & Role-Based Routing
- JWT authentication (`djangorestframework-simplejwt`) with automatic refresh interceptors.
- Role-based route guards (`<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />`).
- Password reset and profile self-service.
