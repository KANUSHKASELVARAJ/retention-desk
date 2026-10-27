# Retention Desk — Deployment Instructions & Run Guide

**GitHub Repository:** https://github.com/KANUSHKASELVARAJ/retention-desk

## 1. Overview

Retention Desk consists of four components:

1. React and Vite frontend
2. Node.js and Express backend
3. MongoDB database
4. Python and Flask machine learning service

The backend handles application requests, database operations, authentication, and communication with the ML service.

## 2. Prerequisites

Install Node.js, npm, Python, and Git. Configure MongoDB Atlas or another supported MongoDB instance.

## 3. Clone the Repository

```bash
git clone https://github.com/KANUSHKASELVARAJ/retention-desk.git
cd retention-desk
```

## 4. Configure MongoDB

1. Create a MongoDB Atlas database deployment.
2. Create a database user with appropriate permissions.
3. Configure network access securely.
4. Copy the database connection string.
5. Store it in the backend environment configuration.

Never place your actual MongoDB connection string in this file or in a public repository.

## 5. Run the ML Service

Navigate to the directory containing the Flask service.

Create a Python virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask application using the entry point in your project. For example:

```bash
python app.py
```

Ensure the required trained model files are available and that the service port matches the backend configuration.

## 6. Run the Backend

Open a separate terminal in the backend directory:

```bash
npm install
```

Create a `.env` file with the variables expected by your backend.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
ML_SERVICE_URL=http://127.0.0.1:5001
```

Start the backend using the script in its `package.json`, for example:

```bash
npm run dev
```

## 7. Run the Frontend

Open another terminal in the frontend directory:

```bash
npm install
```

Configure the backend API URL in the frontend's environment file. For example:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL shown in the terminal, commonly `http://localhost:5173`.

**Important:** The folder names, ports, environment variables, entry points, and startup commands above are examples. Confirm them against the actual source code.

## 8. Production Deployment

### Frontend

1. Connect the repository to a Vite-compatible hosting platform.
2. Select the frontend directory.
3. Configure the production backend API URL.
4. Use the configured build command, commonly `npm run build`.
5. Deploy the generated build output.
6. Test the application in a browser.

### Backend

1. Create a Node.js web service.
2. Select the backend directory.
3. Install dependencies.
4. Configure the production start command.
5. Add the MongoDB connection string, JWT secret, and ML service URL through the hosting provider's environment settings.
6. Configure CORS for the deployed frontend.
7. Deploy and inspect service logs.

### ML Service

1. Create a Python web service.
2. Select the Flask service directory.
3. Install dependencies from `requirements.txt`.
4. Configure the appropriate startup command and port.
5. Ensure trained model files are available.
6. Configure the backend to use the deployed ML service URL.
7. Deploy and test prediction requests.

### Database

Use MongoDB Atlas or another supported hosted MongoDB service. Restrict access, use appropriate database permissions, and store credentials securely.

## 9. Verify the Deployment

- Confirm that the frontend loads.
- Confirm that the backend responds.
- Verify database connectivity.
- Test faculty authentication.
- Test a student prediction request.
- Confirm that prediction results appear in the dashboard.
- Test counseling and support-plan features where implemented.

## 10. Troubleshooting

**Frontend API errors:** Check the backend URL, CORS configuration, and backend status.

**HTTP 500 errors:** Inspect backend logs, environment variables, and database connectivity.

**Prediction errors:** Check the Flask service status, model files, input schema, and backend ML URL.

**Authentication errors:** Verify the account, password hashing, JWT configuration, and authentication request format.

**Deployment failures:** Review build commands, startup commands, environment variables, dependencies, and service logs.

## 11. Security

- Never commit `.env` files or production credentials.
- Do not expose private student information.
- Use HTTPS in production.
- Restrict access to authorized users.
- Treat model predictions as estimates to support human decisions.

## 12. Final Checklist

- [ ] Frontend builds and loads.
- [ ] Backend starts and responds.
- [ ] Database connection works.
- [ ] ML service returns predictions.
- [ ] Authentication works.
- [ ] Main dashboard and intervention workflows are tested.
- [ ] Production environment variables are configured.
- [ ] Secrets are excluded from GitHub.
- [ ] README and repository links are correct.

**Note:** This guide describes the expected deployment workflow. Verify the actual project directories, commands, and configuration before following the instructions.