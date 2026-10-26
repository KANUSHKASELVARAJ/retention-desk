import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../api.js';
import { Alert, Card } from '../components/ui.jsx';

export default function Model() {
  const [m, setM] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/analytics/ml/metrics').then((r) => setM(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (!m) return <><div className="page-head"><h1>Model</h1></div><Alert>{err}</Alert></>;
  const names = { random_forest: 'Random Forest', xgboost: 'XGBoost', ann: 'ANN (MLP)', ensemble: 'Ensemble' };

  return (
    <>
      <div className="page-head"><div><h1>Model</h1>
        <p className="muted">Trained {new Date(m.trainedAt).toLocaleString()} on {m.dataset.rows} rows ({m.dataset.file}); metrics are on a stratified {m.testRows}-row hold-out set.</p></div></div>
      <div className="grid-2">
        <Card title="Hold-out performance">
          <div className="table-wrap"><table><thead><tr><th>Model</th><th>Accuracy</th><th>Macro F1</th><th>Weighted F1</th></tr></thead>
            <tbody>{Object.entries(m.metrics).map(([k, v]) => <tr key={k} className={k === 'ensemble' ? 'hl' : ''}><td>{names[k]}</td><td>{v.accuracy}</td><td>{v.macro_f1}</td><td>{v.weighted_f1}</td></tr>)}</tbody></table></div>
          <p className="muted small">Ensemble: {m.ensemble}. Risk level = ensemble P(Dropout): low &lt; {m.thresholds.low}, high ≥ {m.thresholds.high}.</p>
        </Card>
        <Card title="Confusion matrix (ensemble)">
          <div className="table-wrap"><table><thead><tr><th>Actual ↓ / Predicted →</th>{m.classes.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{m.confusionMatrix.map((row, i) => <tr key={i}><td><b>{m.classes[i]}</b></td>{row.map((v, j) => <td key={j} className={i === j ? 'hl' : ''}>{v}</td>)}</tr>)}</tbody></table></div>
          <p className="muted small">Class distribution: {Object.entries(m.dataset.classDistribution).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
        </Card>
        <Card title="Top global features (Random Forest importance)" className="span-2">
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={m.rfTopImportances} layout="vertical" margin={{ left: 40 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" />
              <YAxis type="category" dataKey="label" width={220} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="importance" fill="#0f5c5c" radius={[0, 4, 4, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
