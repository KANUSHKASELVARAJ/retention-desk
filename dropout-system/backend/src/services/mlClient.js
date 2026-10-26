import { env } from '../config/env.js';
import { ApiError } from '../utils.js';

async function call(path, options = {}) {
  let res;
  try {
    res = await fetch(`${env.mlUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(env.mlKey ? { 'X-API-Key': env.mlKey } : {}) },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(503, `ML service unreachable at ${env.mlUrl}. Is the Flask service running?`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const status = res.status === 422 ? 422 : res.status === 503 ? 503 : 502;
    throw new ApiError(status, data.error || 'ML service error', data.details);
  }
  return data;
}

export const mlPredict = (features) => call('/predict', { method: 'POST', body: JSON.stringify({ features }) });
export const mlSchema = () => call('/schema');
export const mlMetrics = () => call('/metrics');
