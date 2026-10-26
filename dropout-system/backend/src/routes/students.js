import { Router } from 'express';
import { z } from 'zod';
import Student from '../models/Student.js';
import Prediction from '../models/Prediction.js';
import Intervention from '../models/Intervention.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler, escapeRegex } from '../utils.js';
import { runPrediction } from '../services/predictionService.js';
import { notifyAll } from '../services/predictionService.js';

const router = Router();
router.use(protect);

const featuresSchema = z.record(z.string().regex(/^[a-z0-9_]+$/), z.coerce.number().finite());
const baseStudent = z.object({
  studentId: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().optional().or(z.literal('')),
  features: featuresSchema,
});
const createSchema = baseStudent;
const updateSchema = baseStudent.partial();
const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().max(60).optional(),
  level: z.enum(['low', 'medium', 'high', 'unassessed']).optional(),
  sort: z.enum(['name', '-name', 'risk', '-risk', '-createdAt']).default('-risk'),
});

router.get('/', validate(listQuery, 'query'), asyncHandler(async (req, res) => {
  const { page, limit, search, level, sort } = req.validatedQuery;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { studentId: rx }, { email: rx }];
  }
  if (level === 'unassessed') filter['risk.level'] = { $exists: false };
  else if (level) filter['risk.level'] = level;
  const sortMap = { name: { name: 1 }, '-name': { name: -1 }, risk: { 'risk.score': 1 }, '-risk': { 'risk.score': -1, name: 1 }, '-createdAt': { createdAt: -1 } };
  const [items, total] = await Promise.all([
    Student.find(filter).select('-features').sort(sortMap[sort]).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const student = await Student.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ student });
}));

// Batch-assess students that have no prediction yet (max 100 per call)
router.post('/predict-pending', asyncHandler(async (req, res) => {
  const pending = await Student.find({ 'risk.level': { $exists: false } }).limit(100);
  let done = 0, high = 0;
  const failures = [];
  for (const s of pending) {
    try {
      const { prediction } = await runPrediction(s, { userId: req.user._id, notify: false });
      done += 1;
      if (prediction.riskLevel === 'high') high += 1;
    } catch (e) {
      failures.push({ studentId: s.studentId, error: e.message });
      if (e.status === 503) break; // ML down: stop early
    }
  }
  if (done) await notifyAll({ type: 'system', title: 'Batch assessment finished', message: `${done} students assessed, ${high} high risk.` });
  res.json({ assessed: done, highRisk: high, failures });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ student });
}));

router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  Object.assign(student, req.body);
  if (req.body.features) student.markModified('features');
  await student.save();
  res.json({ student });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await Promise.all([Prediction.deleteMany({ student: student._id }), Intervention.deleteMany({ student: student._id })]);
  res.json({ message: 'Student and related records deleted' });
}));

router.post('/:id/predict', asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  const { prediction, interventions } = await runPrediction(student, { userId: req.user._id });
  res.status(201).json({ prediction, interventions, student });
}));

router.get('/:id/predictions', asyncHandler(async (req, res) => {
  const predictions = await Prediction.find({ student: req.params.id }).select('-featuresSnapshot').sort('-createdAt').limit(50);
  res.json({ predictions });
}));

router.get('/:id/interventions', asyncHandler(async (req, res) => {
  const interventions = await Intervention.find({ student: req.params.id }).populate('assignedTo', 'name').sort('-createdAt');
  res.json({ interventions });
}));

export default router;
