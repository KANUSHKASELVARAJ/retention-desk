import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

connectDB()
  .then(() => app.listen(env.port, () => console.log(`[api] http://localhost:${env.port}`)))
  .catch((err) => {
    console.error('[api] failed to start:', err.message);
    process.exit(1);
  });
