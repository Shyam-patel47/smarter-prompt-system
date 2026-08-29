import mongoose, { Schema, Document } from 'mongoose';

export interface IPromptVariable {
  key: string;
  label: string;
  defaultValue?: string;
  orderIndex: number;
}

export interface IPrompt extends Document {
  userId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId | null;
  title: string;
  taskType?: string;
  detailsInput?: string;
  tone?: string;
  outputFormat?: string;
  targetModel?: string;
  generatedBody?: string;
  isTemplate: boolean;
  isFavorite: boolean;
  deletedAt?: Date | null;
  purgeAt?: Date | null;
  tagIds: mongoose.Types.ObjectId[];
  notes?: string;
  variables: IPromptVariable[];
  createdAt: Date;
  updatedAt: Date;
}

const PromptVariableSchema = new Schema<IPromptVariable>({
  key: { type: String, required: true },
  label: { type: String, required: true },
  defaultValue: { type: String },
  orderIndex: { type: Number, default: 0 },
});

const PromptSchema = new Schema<IPrompt>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  folderId: {
    type: Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true,
  },
  taskType: { type: String },
  detailsInput: { type: String, minlength: 10 },
  tone: { type: String },
  outputFormat: { type: String },
  targetModel: { type: String },
  generatedBody: { type: String },
  isTemplate: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  purgeAt: { type: Date, default: null },
  tagIds: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  notes: { type: String },
  variables: {
    type: [PromptVariableSchema],
    default: [],
  },
}, { timestamps: true });

PromptSchema.index({ title: 'text', generatedBody: 'text' });
// TTL index to automatically purge documents 0 seconds after the purgeAt date is reached
PromptSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPrompt>('Prompt', PromptSchema);
