import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    // Raw model inputs keyed exactly like the ML schema (snake_case of the CSV columns)
    features: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Only set for rows imported from the UCI dataset (ground truth label)
    knownOutcome: { type: String, enum: ['Dropout', 'Enrolled', 'Graduate'] },
    source: { type: String, enum: ['manual', 'dataset'], default: 'manual' },
    risk: {
      score: Number,
      level: { type: String, enum: ['low', 'medium', 'high'] },
      predictedClass: String,
      predictedAt: Date,
      predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

studentSchema.index({ 'risk.level': 1 });
studentSchema.index({ name: 1 });

export default mongoose.model('Student', studentSchema);
