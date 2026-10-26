import { Router } from 'express';
import { z } from 'zod';
import Intervention, { STATUSES, CATEGORIES } from '../models/Intervention.js';
import Student from '../models/Student.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError, asyncHandler } from '../utils.js';
import { notifyAll } from '../services/predictionService.js';
import Notification from '../models/Notification.js';

const router = Router();
router.use(protect);

const listQuery = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  mine: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const createSchema = z.object({
  student: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid student id'),
  category: z.enum(CATEGORIES),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  dueDate: z.coerce.date().optional(),
});
const updateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedTo: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  note: z.string().trim().min(1).max(1000).optional(),
});

router.get('/', validate(listQuery, 'query'), asyncHandler(async (req, res) => {
  const { status, priority, mine, page, limit } = req.validatedQuery;
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (mine === 'true') filter.assignedTo = req.user._id;
  const [items, total] = await Promise.all([
    Intervention.find(filter).populate('student', 'name studentId risk.level').populate('assignedTo', 'name')
      .sort({ status: 1, dueDate: 1 }).skip((page - 1) * limit).limit(limit),
    Intervention.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  if (!(await Student.exists({ _id: req.body.student }))) throw new ApiError(404, 'Student not found');
  const item = await Intervention.create({ ...req.body, source: 'manual', status: 'planned', createdBy: req.user._id });
  res.status(201).json({ intervention: item });
}));

router.patch('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const item = await Intervention.findById(req.params.id).populate('student', 'name studentId');
  if (!item) throw new ApiError(404, 'Intervention not found');
  const { note, ...changes } = req.body;
  const prevAssignee = String(item.assignedTo || '');
  Object.assign(item, changes);
  if (changes.status === 'completed') item.completedAt = new Date();
  if (changes.status && changes.status !== 'completed') item.completedAt = undefined;
  if (note) item.notes.push({ text: note, author: req.user._id, authorName: req.user.name });
  await item.save();

  if (changes.assignedTo && String(changes.assignedTo) !== prevAssignee && String(changes.assignedTo) !== String(req.user._id)) {
    await Notification.create({
      user: changes.assignedTo, type: 'intervention', student: item.student._id,
      title: `Intervention assigned: ${item.title}`,
      message: `${req.user.name} assigned you an intervention for ${item.student.name}.`,
    });
  }
  res.json({ intervention: item });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await Intervention.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Intervention not found');
  res.json({ message: 'Deleted' });
}));

export default router;
