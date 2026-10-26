import mongoose from 'mongoose';

const factor = new mongoose.Schema(
  { feature: String, label: String, value: Number, impact: Number },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
    predictedClass: String,
    classProbabilities: mongoose.Schema.Types.Mixed,
    modelOutputs: mongoose.Schema.Types.Mixed, // { random_forest, xgboost, ann }
    riskFactors: [factor],
    protectiveFactors: [factor],
    modelVersion: String,
    featuresSnapshot: mongoose.Schema.Types.Mixed,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Prediction', predictionSchema);
