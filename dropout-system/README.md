# Retention Desk — AI-Powered Student Dropout Prediction & Intervention System

```
React (Vite) ──► Node/Express ──► MongoDB
                     │
                     └──► Flask ML API ──► Random Forest + XGBoost + ANN (MLP)
```

| Folder | What it is |
|---|---|
| `ml-service/` | `train.py` (inspects the CSV, trains + saves 3 models) and `app.py` (Flask: `/predict`, `/schema`, `/metrics`, `/health`) |
| `backend/` | Express API: JWT auth (bcrypt), students CRUD, predictions, interventions, notifications, analytics |
| `frontend/` | React + Recharts UI |

## How the ML works (nothing is mocked)
* `train.py` reads the real UCI CSV, detects the delimiter, derives every feature/ range/ type **from the file**, trains
  Random Forest, XGBoost and an MLP (sklearn ANN with scaling), reports hold-out metrics (20 % stratified split) and saves
  `models/*.joblib` + `models/meta.json`.
* **Ensemble** = mean of the three models' class probabilities. **Risk score** = ensemble P(Dropout).
  Level: `< 0.33` low, `≥ 0.66` high, else medium (env `RISK_LOW` / `RISK_HIGH`).
* **Risk factors** = per-student TreeSHAP contributions of the XGBoost model toward the Dropout class
  (`pred_contribs`), so they differ for every student.
* **Interventions** are chosen by rules keyed on those risk factors + the student's actual values
  (`backend/src/services/recommendations.js`), then tracked through
  recommended → planned → in progress → completed/dismissed with notes, assignee and due date.
* **Notifications**: raised for every user when a student first becomes high risk or escalates; on assignment; after batch runs.

## Prerequisites
Node 18+ (20/22 recommended), Python 3.10+, MongoDB 6/7 (local, Atlas, or `docker run -d --name mongo -p 27017:27017 mongo:7`).

## 1. Dataset
Download **data.csv** from https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success
(click *Download*, unzip) and save it as `ml-service/data/data.csv`. (It is `;`-delimited; the script handles both `;` and `,`.)

## 2. ML service — train, then serve
```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python train.py --data data/data.csv   # prints the columns it found + metrics, saves models/
cp .env.example .env                    # optional; export vars or just use defaults
python app.py                           # http://localhost:5001   (production: gunicorn -w 2 -b 0.0.0.0:5001 app:app)
```
Check: `curl localhost:5001/health` → `{"status":"ok"}`.

## 3. Backend
```bash
cd backend
npm install
cp .env.example .env        # set JWT_SECRET to a long random string
npm run create-admin -- "Admin User" admin@school.edu 'ChangeMe123!'
npm run dev                  # http://localhost:5000
```
Optional — load the real dataset rows as students (anonymised `UCI-00001…`) and score them:
```bash
npm run import-dataset -- ../ml-service/data/data.csv --limit 500 --predict
```
(Drop `--predict` to import only; use the dashboard's **Assess pending students** button — 100 per click — instead.)

## 4. Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173  (proxies /api → localhost:5000)
```
Sign in with the admin you created. Admins can add faculty accounts under **Staff accounts**.
For a deployed build: `npm run build`, serve `dist/`, and set `VITE_API_URL` + backend `CLIENT_ORIGIN`.

## API summary (all except login need `Authorization: Bearer <token>`)
`POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/register` (admin) ·
`GET/POST /api/students` · `GET/PUT/DELETE /api/students/:id` · `POST /api/students/:id/predict` ·
`GET /api/students/:id/predictions|interventions` · `POST /api/students/predict-pending` ·
`GET/POST /api/interventions` · `PATCH/DELETE /api/interventions/:id` ·
`GET /api/notifications` · `PATCH /api/notifications/read-all|:id/read` ·
`GET /api/analytics/summary|overview|ml/schema|ml/metrics`

## Notes & limits
* Passwords use `bcryptjs` (pure-JS bcrypt, same algorithm, no native build step).
* The dataset's categorical fields are numeric codes; the form asks for those codes (see the UCI data dictionary).
* The dataset includes first/second-semester results, so predictions are most meaningful after at least one semester.
  Risk scores support — not replace — human judgement; review fairness before using on real students.
* Set the same `ML_API_KEY` in both services to require an API key between Node and Flask.
