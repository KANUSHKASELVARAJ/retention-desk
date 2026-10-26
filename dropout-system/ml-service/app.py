"""Flask ML service: loads the trained models and exposes /predict."""
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from flask import Flask, jsonify, request

MODEL_DIR = Path(__file__).parent / "models"
API_KEY = os.getenv("ML_API_KEY", "")
RISK_LOW = float(os.getenv("RISK_LOW", "0.33"))
RISK_HIGH = float(os.getenv("RISK_HIGH", "0.66"))

app = Flask(__name__)
STATE = {"ready": False, "error": None}


def load_models():
    try:
        STATE["meta"] = json.loads((MODEL_DIR / "meta.json").read_text())
        STATE["models"] = {
            "random_forest": joblib.load(MODEL_DIR / "random_forest.joblib"),
            "xgboost": joblib.load(MODEL_DIR / "xgboost.joblib"),
            "ann": joblib.load(MODEL_DIR / "ann.joblib"),
        }
        STATE["ready"], STATE["error"] = True, None
    except Exception as exc:  # noqa: BLE001
        STATE["ready"] = False
        STATE["error"] = f"Models not loaded ({exc}). Run `python train.py --data data/data.csv` first."


load_models()


@app.before_request
def check_key():
    if API_KEY and request.endpoint != "health" and request.headers.get("X-API-Key") != API_KEY:
        return jsonify(error="Invalid or missing API key"), 401


def need_models():
    if not STATE["ready"]:
        return jsonify(error=STATE["error"]), 503
    return None


def risk_level(score: float) -> str:
    return "low" if score < RISK_LOW else ("high" if score >= RISK_HIGH else "medium")


@app.get("/health")
def health():
    return jsonify(status="ok" if STATE["ready"] else "models_missing", error=STATE["error"])


@app.get("/schema")
def schema():
    if (r := need_models()):
        return r
    m = STATE["meta"]
    return jsonify(features=m["schema"], classes=m["classes"])


@app.get("/metrics")
def metrics():
    if (r := need_models()):
        return r
    m = STATE["meta"]
    keys = ["trainedAt", "dataset", "classes", "metrics", "confusionMatrix", "testRows", "ensemble", "rfTopImportances"]
    return jsonify({k: m[k] for k in keys} | {"thresholds": {"low": RISK_LOW, "high": RISK_HIGH}})


def to_frame(features: dict) -> pd.DataFrame:
    keys = STATE["meta"]["features"]
    missing = [k for k in keys if features.get(k) in (None, "")]
    if missing:
        raise ValueError({"message": "Missing feature values", "missing": missing})
    try:
        row = [float(features[k]) for k in keys]
    except (TypeError, ValueError):
        invalid = [k for k in keys if not _is_num(features[k])]
        raise ValueError({"message": "Non-numeric feature values", "invalid": invalid})
    if not np.isfinite(row).all():
        raise ValueError({"message": "Feature values must be finite numbers"})
    return pd.DataFrame([row], columns=keys)


def _is_num(v):
    try:
        float(v)
        return True
    except (TypeError, ValueError):
        return False


def explain(X: pd.DataFrame, idx: int):
    """Per-student explanation from XGBoost TreeSHAP contributions for the Dropout class."""
    meta = STATE["meta"]
    booster = STATE["models"]["xgboost"].get_booster()
    contribs = booster.predict(xgb.DMatrix(X), pred_contribs=True)  # (1, n_classes, n_features+1)
    c = contribs[0][idx][:-1]
    items = [{"feature": k, "label": meta["labels"][k], "value": float(X.iloc[0][k]), "impact": round(float(v), 4)}
             for k, v in zip(meta["features"], c)]
    items.sort(key=lambda d: -d["impact"])
    risk = [d for d in items if d["impact"] > 0][:6]
    protective = [d for d in reversed(items) if d["impact"] < 0][:3]
    return risk, protective


@app.post("/predict")
def predict():
    if (r := need_models()):
        return r
    body = request.get_json(silent=True) or {}
    if not isinstance(body.get("features"), dict):
        return jsonify(error="Body must be JSON: {\"features\": {...}}"), 400
    try:
        X = to_frame(body["features"])
    except ValueError as exc:
        return jsonify(error="Invalid features", details=exc.args[0]), 422

    meta, classes, idx = STATE["meta"], STATE["meta"]["classes"], STATE["meta"]["dropoutIndex"]
    per_model = {n: m.predict_proba(X)[0] for n, m in STATE["models"].items()}
    ensemble = np.mean(list(per_model.values()), axis=0)
    score = float(ensemble[idx])
    risk, protective = explain(X, idx)

    return jsonify(
        riskScore=round(score, 4),
        riskLevel=risk_level(score),
        predictedClass=classes[int(ensemble.argmax())],
        classProbabilities={c: round(float(p), 4) for c, p in zip(classes, ensemble)},
        modelOutputs={n: {c: round(float(p), 4) for c, p in zip(classes, probs)} for n, probs in per_model.items()},
        riskFactors=risk,
        protectiveFactors=protective,
        modelVersion=meta["trainedAt"],
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5001")))
