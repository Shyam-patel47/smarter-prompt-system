import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptVersion extends Document {
  promptId: mongoose.Types.ObjectId;
  bodySnapshot: string;
  createdAt: Date;
}

const PromptVersionSchema = new Schema<IPromptVersion>({
  promptId: { type: Schema.Types.ObjectId, ref: 'Prompt', required: true },
  bodySnapshot: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPromptVersion>('PromptVersion', PromptVersionSchema);
