import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['high_risk', 'risk_escalation', 'intervention', 'system'], required: true },
    title: { type: String, required: true },
    message: String,
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
