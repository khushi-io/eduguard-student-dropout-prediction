# 🎓 EduGuard — AI-Powered Student Dropout Prediction System

<div align="center">

### Turning Educational Data into Meaningful Insights

An intelligent educational analytics platform that leverages Machine Learning to identify students at risk of dropping out, monitor academic performance, and support early intervention.

<br/>

![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Flask](https://img.shields.io/badge/Flask-Backend-black?style=for-the-badge&logo=flask)
![Machine Learning](https://img.shields.io/badge/Machine_Learning-XGBoost-orange?style=for-the-badge)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

![GitHub repo size](https://img.shields.io/github/repo-size/khushi-io/eduguard-student-dropout-prediction?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/khushi-io/eduguard-student-dropout-prediction?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/khushi-io/eduguard-student-dropout-prediction?style=flat-square)

</div>

---

## 📌 About The Project

**EduGuard** is an AI-powered Student Dropout Prediction and Educational Analytics System developed to help educational institutions identify students who may be at risk of dropping out.

The platform analyzes student-related information, including academic performance, attendance, and other relevant indicators, to generate insights that support early intervention.

EduGuard provides dedicated dashboards for five user roles — Admin, HOD, Faculty, Counselor, and Student — ensuring that each user can access relevant information and monitor student progress.

The system combines Full-Stack Web Development, Machine Learning, Data Analytics, and Explainable AI to transform educational data into actionable insights.

## 🎯 Project Objectives

- Identify students who may be at risk of dropping out.
- Analyze academic performance and attendance patterns.
- Provide role-based access to educational information.
- Support early identification and student intervention.
- Visualize student performance through interactive dashboards.
- Improve educational monitoring and data-driven decision-making.

---

## ✨ Key Features

<table align="center">
<tr>
<td align="center" width="50%">

### 👨‍💻 Admin Dashboard

Manage and monitor the platform, users, student information, and overall educational analytics.

</td>
<td align="center" width="50%">

### 🏫 HOD Dashboard

Monitor department-level student performance and access student risk information.

</td>
</tr>
<tr>
<td align="center" width="50%">

### 👩‍🏫 Faculty Dashboard

Monitor student academic progress and access attendance and performance information.

</td>
<td align="center" width="50%">

### 🤝 Counselor Dashboard

Identify students requiring attention and support counselling and intervention activities.

</td>
</tr>
<tr>
<td align="center" width="50%">

### 🎓 Student Dashboard

Access personal academic information and monitor individual progress.

</td>
<td align="center" width="50%">

### 🤖 ML-Based Prediction

Use student-related data and trained Machine Learning artifacts to support dropout risk prediction.

</td>
</tr>
</table>

### Additional Capabilities

- **Data Visualization:** Interactive charts and analytical dashboards using Chart.js and D3.js.
- **Explainable AI:** SHAP artifacts for understanding Machine Learning predictions.
- **Authentication:** JWT-based authentication.
- **Real-Time Communication:** Flask-SocketIO integration.
- **API Documentation:** Swagger-based API documentation.
- **Automated Scheduling:** APScheduler integration for periodic student summaries.

---

## 🛠️ Technology Stack

<div align="center">

| Category | Technologies |
|:---:|:---:|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Backend | Python, Flask |
| Database | SQLite, MySQL configuration support |
| Machine Learning | XGBoost, Scikit-learn |
| Explainable AI | SHAP |
| Data Processing | Pandas, NumPy |
| Visualization | Chart.js, D3.js |
| Authentication | Flask-JWT-Extended |
| Real-Time Communication | Flask-SocketIO |
| API Documentation | Flasgger / Swagger |
| Version Control | Git, GitHub |

</div>

---

## 🏗️ Project Architecture

```text
EduGuard/
│
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── models.py
│   ├── seed.py
│   ├── settings_helper.py
│   ├── requirements.txt
│   │
│   ├── ml/
│   │   ├── train_model.py
│   │   ├── model.pkl
│   │   └── shap_explainer.pkl
│   │
│   ├── routes/
│   │   ├── admin.py
│   │   ├── auth.py
│   │   ├── counselor.py
│   │   ├── faculty.py
│   │   ├── hod.py
│   │   ├── student.py
│   │   └── students.py
│   │
│   └── tests/
│       └── test_api.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── Login.jsx
│   │   │   ├── admin/
│   │   │   ├── counselor/
│   │   │   ├── faculty/
│   │   │   ├── hod/
│   │   │   └── student/
│   │   │
│   │   ├── components/
│   │   ├── AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following tools are installed:

- Python 3.11
- Node.js (compatible with Vite 8)
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/khushi-io/eduguard-student-dropout-prediction.git
```

Navigate into the project:

```bash
cd eduguard-student-dropout-prediction
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install the required dependencies:

```bash
python -m pip install -r requirements.txt
```

Configure your environment variables before starting Flask:

```cmd
set SECRET_KEY=your_random_secret_key
set JWT_SECRET_KEY=your_random_jwt_secret
```

Start the backend:

```bash
python app.py
```

The backend will be available at:

**http://localhost:5000**

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the application:

**http://localhost:5173**

### 4. API Documentation

EduGuard uses Swagger through Flasgger for API documentation.

Once the backend is running, visit:

**http://localhost:5000/apidocs**

---

## 🔐 Demo Login Credentials

The project includes demonstration accounts for different user roles.

<div align="center">

| User Role | Username | Password |
|:---:|:---:|:---:|
| 👨‍💻 Admin | `admin` | `admin123` |
| 🏫 HOD | `hod` | `hod123` |
| 👩‍🏫 Faculty | `faculty` | `faculty123` |
| 🤝 Counselor | `counselor` | `counselor123` |
| 🎓 Student | `student` | `student123` |

</div>

> **Note:** These are development/demo credentials. Change them before any public or production deployment. Never use these credentials in a production environment.

---

## 🤖 Machine Learning & Explainable AI

EduGuard integrates Machine Learning components to support student dropout risk analysis.

The backend includes:

- A model training script (`train_model.py`).
- A serialized trained model (`model.pkl`).
- A SHAP explainer artifact (`shap_explainer.pkl`).
- Data processing and prediction-related dependencies.

**Explainable AI with SHAP:** SHAP is included to help interpret Machine Learning predictions and understand the contribution of input features.

---

## 🔒 Security & Configuration

The application includes JWT authentication and configurable database settings.

For a secure deployment:

- Use strong, randomly generated secret keys.
- Store credentials in environment variables.
- Never upload `.env` files or private credentials.
- Change default demo account passwords.
- Configure appropriate CORS origins.
- Use HTTPS in production.
- Restrict access to sensitive student information.

---

## 🚀 Future Enhancements

- Improve prediction accuracy with larger and more diverse datasets.
- Introduce advanced student performance analytics.
- Add automated email and SMS notifications.
- Develop more detailed academic performance reports.
- Improve automated testing and test coverage.
- Deploy the application to a cloud platform.
- Enhance the user experience with additional dashboard features.

---

## 👩‍💻 Developer

<div align="center">

### Khushi Chile

Interested in building practical applications using software development, data analytics, and emerging technologies.

</div>

---

## ⭐ Show Your Support

<div align="center">
  
If you find EduGuard interesting, consider giving this repository a ⭐ on GitHub!

Your feedback and suggestions are always welcome.

</div>

---
 
<div align="center">

*Identify Early. Intervene Smartly. Improve Student Outcomes.*

</div>
