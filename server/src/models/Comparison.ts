import mongoose, { Schema, Document } from 'mongoose';

export interface IComparison extends Document {
  userId: mongoose.Types.ObjectId;
  baseTaskDescription: string;
  promptABody: string;
  promptAScore?: number;
  promptBBody: string;
  promptBScore?: number;
  winner: 'a' | 'b' | 'tie' | 'none';
  createdAt: Date;
}

const ComparisonSchema = new Schema<IComparison>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  baseTaskDescription: { type: String },
  promptABody: { type: String },
  promptAScore: { type: Number, min: 0, max: 100 },
  promptBBody: { type: String },
  promptBScore: { type: Number, min: 0, max: 100 },
  winner: { type: String, enum: ['a', 'b', 'tie', 'none'], default: 'none' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IComparison>('Comparison', ComparisonSchema);
