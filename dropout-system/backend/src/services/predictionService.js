import Prediction from '../models/Prediction.js';
import Intervention from '../models/Intervention.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { mlPredict } from './mlClient.js';
import { recommend } from './recommendations.js';

const RANK = { low: 0, medium: 1, high: 2 };

export async function notifyAll(payload) {
  const users = await User.find().select('_id');
  if (users.length) await Notification.insertMany(users.map((u) => ({ ...payload, user: u._id })));
}

/** Calls Flask, stores the prediction, refreshes system recommendations, raises notifications. */
export async function runPrediction(student, { userId, notify = true } = {}) {
  const result = await mlPredict(student.features || {});
  const previousLevel = student.risk?.level;

  const prediction = await Prediction.create({
    student: student._id,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    predictedClass: result.predictedClass,
    classProbabilities: result.classProbabilities,
    modelOutputs: result.modelOutputs,
    riskFactors: result.riskFactors,
    protectiveFactors: result.protectiveFactors,
    modelVersion: result.modelVersion,
    featuresSnapshot: student.features,
    createdBy: userId,
  });

  student.risk = {
    score: result.riskScore,
    level: result.riskLevel,
    predictedClass: result.predictedClass,
    predictedAt: new Date(),
    predictionId: prediction._id,
  };
  await student.save();

  // Replace untouched system recommendations; keep anything staff already acted on.
  await Intervention.deleteMany({ student: student._id, source: 'system', status: 'recommended' });
  const drafts = recommend(result);
  const interventions = drafts.length
    ? await Intervention.insertMany(drafts.map((d) => ({ ...d, student: student._id, prediction: prediction._id, source: 'system', status: 'recommended' })))
    : [];

  if (notify) {
    const pct = Math.round(result.riskScore * 100);
    if (result.riskLevel === 'high' && previousLevel !== 'high') {
      await notifyAll({
        type: previousLevel ? 'risk_escalation' : 'high_risk',
        title: `High dropout risk: ${student.name}`,
        message: `${student.name} (${student.studentId}) scored ${pct}%${previousLevel ? ` (was ${previousLevel})` : ''}. ${interventions.length} interventions recommended.`,
        student: student._id,
      });
    } else if (previousLevel && RANK[result.riskLevel] > RANK[previousLevel]) {
      await notifyAll({
        type: 'risk_escalation',
        title: `Risk increased: ${student.name}`,
        message: `${student.name} moved from ${previousLevel} to ${result.riskLevel} risk (${pct}%).`,
        student: student._id,
      });
    }
  }
  return { prediction, interventions };
}
