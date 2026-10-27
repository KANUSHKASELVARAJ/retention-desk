# Retention Desk 🎓
### AI-Powered Student Dropout Prediction & Intervention System

Retention Desk is an AI-powered decision-support system designed to help educational institutions identify students who may be at risk of dropping out. It provides a centralized dashboard for student risk analysis, machine learning predictions, counseling alerts, and student support planning.

## Problem Statement

Educational institutions may struggle to identify students at risk of dropping out when student data must be analyzed manually. Delayed identification can make it harder for faculty to prioritize counseling and academic support.

Retention Desk aims to address this challenge through machine learning, interactive dashboards, and organized intervention workflows.

## Features

- Faculty authentication
- Student dashboard and data visualization
- Machine-learning-based student outcome predictions
- Student risk analysis
- Counseling alerts
- Student support-plan management

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Visualization | Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcryptjs |
| ML Service | Python, Flask |
| ML Models | Random Forest, XGBoost, Artificial Neural Network |

## System Architecture

```text
Faculty
   |
   v
React + Vite Frontend
   |
   v
Node.js + Express Backend
   |                 |
   v                 v
MongoDB Atlas     Flask ML Service
                       |
                       v
                Risk Predictions
```

## Dataset

The project uses the UCI Machine Learning Repository dataset, *Predict Students' Dropout and Academic Success*.

- Dataset source: https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success
- Approximate dataset size: 4,424 student records.
- Target outcomes: Dropout, Enrolled, and Graduate.

## Getting Started

### Prerequisites

- Node.js and npm
- Python
- Git
- MongoDB Atlas account or a compatible MongoDB instance

### Clone the repository

```bash
git clone https://github.com/KANUSHKASELVARAJ/retention-desk.git
cd retention-desk
```

### Configure environment variables

Create the environment files required by your frontend and backend.

Example backend configuration:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
ML_SERVICE_URL=http://127.0.0.1:5001
```

Example frontend configuration for Vite:

```env
VITE_API_URL=http://localhost:5000
```

These variable names and ports are examples. Use the actual configuration expected by your code. Never commit real credentials or `.env` files.

### Install dependencies

Install Node.js dependencies in the frontend and backend directories:

```bash
npm install
```

Install Python dependencies in the ML service directory:

```bash
pip install -r requirements.txt
```

Run these commands from the directories containing the corresponding dependency files.

### Run the application

Start the Flask ML service, Node.js backend, and React frontend in separate terminals using the commands configured in each component.

For example:

```bash
python app.py
```

```bash
npm run dev
```

Check the actual entry-point filename and `package.json` scripts before running these commands.

Open the frontend URL printed in your terminal. Vite commonly uses `http://localhost:5173`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed local setup and production deployment instructions.

## Deployment

The application can be deployed using separate services for the frontend, backend, and ML service, with MongoDB Atlas as the hosted database.

Production deployment requires correct API URLs, environment variables, CORS configuration, and secure database access.

## Security and Responsible Use

- Protect credentials and student data.
- Restrict access to authorized users.
- Treat predictions as estimates rather than definitive judgments.
- Evaluate model performance and potential bias before operational use.
- Use predictions to support, not replace, faculty judgment.

## Future Enhancements

- Improved model explainability
- Intervention outcome tracking
- Automated follow-up notifications
- Model monitoring and performance reporting

## Repository

GitHub: https://github.com/KANUSHKASELVARAJ/retention-desk

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.