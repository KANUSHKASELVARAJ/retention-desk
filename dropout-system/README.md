# Retention Desk
### AI-Powered Student Dropout Prediction & Intervention System

## 📌 Overview

Retention Desk is an AI-powered student support system designed to help educational institutions identify students who may be at risk of dropping out.

The system analyzes student academic and related information to predict risk levels and helps faculty take early action through counseling alerts, mentor notifications, and support plans.

## 🎯 Problem Statement

Educational institutions may struggle to identify students who need academic support early enough. Manual monitoring can delay intervention and make it difficult for faculty to prioritize students who need assistance.

Retention Desk aims to support early identification and organized follow-up using machine learning and a centralized dashboard.

## 💡 Key Features

- **Student Risk Prediction:** Predicts student outcomes using a machine learning model.
- **Faculty Dashboard:** Provides a centralized view of student risk information.
- **Risk Monitoring:** Helps faculty identify students who may need additional support.
- **Counseling Alerts:** Supports follow-up for at-risk students.
- **Mentor Notifications:** Helps organize student support activities.
- **Support Plans:** Assists faculty in planning interventions.
- **Authentication:** Provides protected access to the faculty/admin interface.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Machine Learning Service | Python, Flask |
| Authentication | JWT, bcryptjs |
| Machine Learning | Random Forest, XGBoost, Artificial Neural Network |

## 🧠 Dataset

The project uses the UCI Machine Learning Repository dataset **Predict Students' Dropout and Academic Success**.

The dataset contains approximately 4,424 student records and supports three outcome categories:

- Dropout
- Enrolled
- Graduate

The trained models use student-related features to estimate outcomes. Predictions are intended to support faculty decisions, not replace human judgment.

## 🏗️ System Architecture

1. Faculty accesses the React frontend.
2. The frontend sends requests to the Node.js/Express backend.
3. The backend handles authentication and database operations using MongoDB.
4. Prediction requests are forwarded to the Python/Flask machine learning service.
5. The prediction results are returned to the application for display.

## 🔐 Demo Login Credentials

These credentials are intended **only for project demonstration and evaluation**. They are not the original production/admin credentials.

- **Demo Email:** `admin@school.edu`
- **Demo Password:** `ChangeMe123!`

**Important:** These credentials work only if the corresponding demo account has been created in the deployed application's database and has the correct role and permissions. Please test the login before sharing the application with evaluators.

Use a restricted demo account containing no sensitive student or personal information. If this README is public, use a disposable demo account and rotate its password after evaluation.

## 🚀 Live Demo

**Application URL:** `YOUR_DEPLOYED_FRONTEND_URL`

Replace the placeholder above with your actual deployed frontend URL.

## ⚙️ Local Setup

### Prerequisites

- Node.js and npm
- Python
- MongoDB Atlas account or a local MongoDB instance
- Git

### 1. Clone the repository

```bash
git clone https://github.com/KANUSHKASELVARAJ/retention-desk.git
cd retention-desk
```

### 2. Configure environment variables

Create the required `.env` files for the frontend, backend, and machine learning service according to the environment variables used in the source code.

Typical configuration may include:

- MongoDB connection string
- JWT secret
- Backend API URL
- Machine learning service URL

Use your actual variable names from the code. **Never commit `.env` files, database credentials, JWT secrets, or other private keys.**

### 3. Install dependencies and start services

Open separate terminals and follow the commands for the actual project folders.

For a Node.js service:

```bash
npm install
npm run dev
```

For the Python machine learning service, activate the project's virtual environment, install its requirements, and run the Flask application using the entry point specified in the source code.

Refer to the project's deployment guide for the exact commands and service URLs.

## ☁️ Deployment

The application can be deployed using separate hosting services for the frontend, backend, and machine learning service, with MongoDB Atlas for database hosting.

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

Before deployment, verify that all API URLs, CORS settings, environment variables, and database permissions are configured correctly.

## 🔮 Future Enhancements

- Improved model evaluation and explainability
- Automated follow-up reminders
- More detailed student progress reports
- Additional intervention tracking
- Model monitoring and periodic retraining

## ⚠️ Responsible Use

Predictions are estimates and may contain errors or bias. They should not be used as the sole basis for decisions about students. Faculty should review relevant context and use predictions as one input when deciding what support to offer.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 👩‍💻 Author

**Kanushka Selvaraj**

GitHub: [KANUSHKASELVARAJ](https://github.com/KANUSHKASELVARAJ)

---

*Retention Desk — supporting early intervention through data-driven insights.*