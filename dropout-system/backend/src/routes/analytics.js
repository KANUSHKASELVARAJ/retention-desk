import { Router } from 'express';
import Student from '../models/Student.js';
import Prediction from '../models/Prediction.js';
import Intervention from '../models/Intervention.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';
import { mlMetrics, mlSchema } from '../services/mlClient.js';

const router = Router();
router.use(protect);

router.get('/summary', asyncHandler(async (req, res) => {
  const [total, byLevel, openInterventions, unread, topRisk] = await Promise.all([
    Student.countDocuments(),
    Student.aggregate([{ $match: { 'risk.level': { $exists: true } } }, { $group: { _id: '$risk.level', n: { $sum: 1 } } }]),
    Intervention.countDocuments({ status: { $in: ['recommended', 'planned', 'in_progress'] } }),
    Notification.countDocuments({ user: req.user._id, read: false }),
    Student.find({ 'risk.level': 'high' }).select('name studentId risk').sort({ 'risk.score': -1 }).limit(6),
  ]);
  const c = Object.fromEntries(byLevel.map((x) => [x._id, x.n]));
  const low = c.low || 0, medium = c.medium || 0, high = c.high || 0;
  res.json({ total, low, medium, high, unassessed: total - low - medium - high, openInterventions, unread, topRisk });
}));

router.get('/overview', asyncHandler(async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  const latestIds = await Student.distinct('risk.predictionId', { 'risk.predictionId': { $exists: true } });
  const [byCourse, trend, factors, interventionStatus, classes] = await Promise.all([
    Student.aggregate([
      { $match: { 'risk.score': { $exists: true } } },
      { $group: { _id: '$features.course', students: { $sum: 1 }, avgRisk: { $avg: '$risk.score' }, high: { $sum: { $cond: [{ $eq: ['$risk.level', 'high'] }, 1, 0] } } } },
      { $sort: { avgRisk: -1 } }, { $limit: 20 },
    ]),
    Prediction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgRisk: { $avg: '$riskScore' }, predictions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Prediction.aggregate([
      { $match: { _id: { $in: latestIds } } }, { $unwind: '$riskFactors' },
      { $group: { _id: '$riskFactors.label', count: { $sum: 1 }, avgImpact: { $avg: '$riskFactors.impact' } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]),
    Intervention.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Student.aggregate([{ $match: { 'risk.predictedClass': { $exists: true } } }, { $group: { _id: '$risk.predictedClass', n: { $sum: 1 } } }]),
  ]);
  res.json({
    byCourse: byCourse.map((x) => ({ course: x._id, students: x.students, avgRisk: +x.avgRisk.toFixed(3), high: x.high })),
    trend: trend.map((x) => ({ date: x._id, avgRisk: +x.avgRisk.toFixed(3), predictions: x.predictions })),
    topFactors: factors.map((x) => ({ factor: x._id, count: x.count, avgImpact: +x.avgImpact.toFixed(3) })),
    interventionStatus: interventionStatus.map((x) => ({ status: x._id, count: x.n })),
    predictedClasses: classes.map((x) => ({ name: x._id, count: x.n })),
  });
}));

router.get('/ml/schema', asyncHandler(async (_req, res) => res.json(await mlSchema())));
router.get('/ml/metrics', asyncHandler(async (_req, res) => res.json(await mlMetrics())));

export default router;
