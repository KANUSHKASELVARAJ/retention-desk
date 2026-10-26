// Imports the REAL UCI dataset rows as students (anonymised: the dataset has no names).
// Usage: npm run import-dataset -- ../ml-service/data/data.csv [--limit 500] [--predict]
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Student from '../models/Student.js';
import { runPrediction } from '../services/predictionService.js';
import { snakeKey } from '../utils.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const doPredict = args.includes('--predict');
if (!file) { console.error('Usage: npm run import-dataset -- <data.csv> [--limit N] [--predict]'); process.exit(1); }

const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const delimiter = text.split('\n', 1)[0].split(';').length > text.split('\n', 1)[0].split(',').length ? ';' : ',';
const rows = parse(text, { columns: (h) => h.map(snakeKey), delimiter, skip_empty_lines: true, trim: true }).slice(0, limit);
console.log(`[import] ${rows.length} rows read (delimiter "${delimiter}")`);

await connectDB();
let created = 0;
for (const [i, row] of rows.entries()) {
  const { target, ...features } = row;
  const nums = Object.fromEntries(Object.entries(features).map(([k, v]) => [k, Number(v)]));
  if (Object.values(nums).some((v) => !Number.isFinite(v))) { console.warn(`[import] row ${i + 1} skipped (non-numeric)`); continue; }
  const studentId = `UCI-${String(i + 1).padStart(5, '0')}`;
  const doc = await Student.findOneAndUpdate(
    { studentId },
    { $setOnInsert: { studentId, name: `Dataset Student ${i + 1}`, features: nums, knownOutcome: target, source: 'dataset' } },
    { upsert: true, new: true, includeResultMetadata: true }
  );
  if (!doc.lastErrorObject.updatedExisting) created += 1;
  if (doPredict && !doc.value.risk?.level) {
    try { await runPrediction(doc.value, { notify: false }); } catch (e) { console.error('[import] predict failed:', e.message); break; }
    if ((i + 1) % 100 === 0) console.log(`[import] predicted ${i + 1}`);
  }
}
console.log(`[import] done. ${created} new students.`);
await mongoose.disconnect();
