import mongoose, { Schema, Document } from 'mongoose';

export interface ITag extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
}

const TagSchema = new Schema<ITag>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true }
});

// Compound unique index
TagSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model<ITag>('Tag', TagSchema);
