// Usage: npm run create-admin -- "Name" email@school.edu 'Password123'
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password || password.length < 8) {
  console.error('Usage: npm run create-admin -- "Name" email password(min 8 chars)');
  process.exit(1);
}
await connectDB();
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) console.log('User already exists:', existing.email);
else {
  await User.create({ name, email, password, role: 'admin' });
  console.log('Admin created:', email);
}
await mongoose.disconnect();
