"""
Train Random Forest + XGBoost + ANN (MLP) on the UCI
"Predict Students' Dropout and Academic Success" dataset (id 697).

Usage:
    python train.py --data data/data.csv

The script INSPECTS the CSV (delimiter, columns, dtypes, classes) and derives the
feature list/schema from the file itself. Nothing about columns is hard-coded
except that the label column is called "Target" (as in the UCI file).
"""
import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.utils.class_weight import compute_sample_weight
from xgboost import XGBClassifier

SEED = 42
MODEL_DIR = Path(__file__).parent / "models"


def snake(name: str) -> str:
    """Column name -> stable key. MUST match snakeKey() in backend/src/utils.js."""
    return re.sub(r"[^0-9a-z]+", "_", name.strip().lower()).strip("_")


def load_dataset(path: Path):
    if not path.exists():
        sys.exit(f"[train] CSV not found: {path}\n"
                 "Download data.csv from https://archive.ics.uci.edu/dataset/697 and place it there.")
    with open(path, encoding="utf-8-sig") as f:
        header = f.readline()
    sep = ";" if header.count(";") > header.count(",") else ","
    df = pd.read_csv(path, sep=sep, encoding="utf-8-sig")
    keys = [snake(c) for c in df.columns]
    if len(set(keys)) != len(keys):
        sys.exit("[train] Duplicate column keys after normalisation: " + str(keys))
    labels = {snake(c): c.strip() for c in df.columns}
    df.columns = keys
    print(f"[train] Loaded {path.name}: {df.shape[0]} rows x {df.shape[1]} cols (delimiter {sep!r})")
    print("[train] Columns found in file:")
    for c in df.columns:
        print(f"         - {c:55s} {str(df[c].dtype):8s} nunique={df[c].nunique()}")
    return df, labels


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/data.csv")
    ap.add_argument("--test-size", type=float, default=0.2)
    args = ap.parse_args()

    df, labels = load_dataset(Path(args.data))

    if "target" not in df.columns:
        sys.exit("[train] No 'Target' column found. Columns: " + ", ".join(df.columns))
    df["target"] = df["target"].astype(str).str.strip()
    classes_seen = sorted(df["target"].unique())
    print("[train] Target classes:", classes_seen, df["target"].value_counts().to_dict())
    if "Dropout" not in classes_seen:
        sys.exit("[train] Target has no 'Dropout' class; cannot compute dropout risk.")

    features = [c for c in df.columns if c != "target"]
    X = df[features].apply(pd.to_numeric, errors="coerce")
    bad = X.columns[X.isna().any()].tolist()
    if bad:
        sys.exit(f"[train] Non-numeric or missing values in: {bad}. Clean the CSV first.")
    X = X.astype(float)

    le = LabelEncoder()
    y = le.fit_transform(df["target"])
    classes = list(le.classes_)
    dropout_idx = classes.index("Dropout")

    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=args.test_size, stratify=y, random_state=SEED)
    print(f"[train] Train={len(Xtr)} Test={len(Xte)} (stratified, seed={SEED})")

    rf = RandomForestClassifier(
        n_estimators=500, class_weight="balanced", n_jobs=-1, random_state=SEED)
    xgb = XGBClassifier(
        n_estimators=400, max_depth=5, learning_rate=0.05, subsample=0.85,
        colsample_bytree=0.85, objective="multi:softprob", eval_metric="mlogloss",
        n_jobs=-1, random_state=SEED)
    ann = make_pipeline(
        StandardScaler(),
        MLPClassifier(hidden_layer_sizes=(128, 64, 32), activation="relu", alpha=1e-3,
                      early_stopping=True, validation_fraction=0.1, n_iter_no_change=20,
                      max_iter=500, random_state=SEED))

    print("[train] Fitting Random Forest ...")
    rf.fit(Xtr, ytr)
    print("[train] Fitting XGBoost ...")
    xgb.fit(Xtr, ytr, sample_weight=compute_sample_weight("balanced", ytr))
    print("[train] Fitting ANN (MLP) ...")
    ann.fit(Xtr, ytr)

    models = {"random_forest": rf, "xgboost": xgb, "ann": ann}
    probas = {n: m.predict_proba(Xte) for n, m in models.items()}
    probas["ensemble"] = np.mean([probas[n] for n in models], axis=0)  # soft voting

    metrics = {}
    for name, p in probas.items():
        pred = p.argmax(axis=1)
        metrics[name] = {
            "accuracy": round(float(accuracy_score(yte, pred)), 4),
            "macro_f1": round(float(f1_score(yte, pred, average="macro")), 4),
            "weighted_f1": round(float(f1_score(yte, pred, average="weighted")), 4),
        }
        print(f"[train] {name:14s} acc={metrics[name]['accuracy']:.4f} macroF1={metrics[name]['macro_f1']:.4f}")
    ens_pred = probas["ensemble"].argmax(axis=1)
    print(classification_report(yte, ens_pred, target_names=classes))
    confusion = confusion_matrix(yte, ens_pred).tolist()

    schema = []
    for c in features:
        col = X[c]
        schema.append({
            "key": c, "label": labels[c],
            "min": float(col.min()), "max": float(col.max()), "mean": round(float(col.mean()), 4),
            "isInteger": bool((col % 1 == 0).all()),
            "isBinary": bool(set(col.unique()) <= {0.0, 1.0}),
            "nUnique": int(col.nunique()),
        })

    imp = sorted(zip(features, rf.feature_importances_), key=lambda t: -t[1])[:15]
    meta = {
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "dataset": {"file": Path(args.data).name, "rows": int(len(df)),
                    "classDistribution": df["target"].value_counts().to_dict()},
        "features": features, "labels": labels, "schema": schema,
        "classes": classes, "dropoutIndex": dropout_idx,
        "metrics": metrics, "confusionMatrix": confusion,
        "testRows": int(len(Xte)), "ensemble": "equal-weight soft voting (mean of probabilities)",
        "rfTopImportances": [{"feature": k, "label": labels[k], "importance": round(float(v), 4)} for k, v in imp],
    }

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(rf, MODEL_DIR / "random_forest.joblib")
    joblib.dump(xgb, MODEL_DIR / "xgboost.joblib")
    joblib.dump(ann, MODEL_DIR / "ann.joblib")
    (MODEL_DIR / "meta.json").write_text(json.dumps(meta, indent=2))
    print(f"[train] Saved models + meta.json to {MODEL_DIR}")


if __name__ == "__main__":
    main()
