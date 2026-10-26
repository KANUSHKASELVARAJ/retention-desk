import mongoose from 'mongoose';

export const STATUSES = ['recommended', 'planned', 'in_progress', 'completed', 'dismissed'];
export const CATEGORIES = ['academic', 'financial', 'counseling', 'engagement', 'administrative'];

const note = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorName: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const interventionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    prediction: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
    category: { type: String, enum: CATEGORIES, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: STATUSES, default: 'recommended', index: true },
    source: { type: String, enum: ['system', 'manual'], default: 'manual' },
    triggeredBy: String, // feature key that triggered a system recommendation
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: Date,
    completedAt: Date,
    notes: [note],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Intervention', interventionSchema);
