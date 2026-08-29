import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  mobileNumber?: string;
  passwordHash: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
  planTier: 'free' | 'pro';
  tokenVersion: number;
  themePreference: 'light' | 'dark' | 'system';
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  avatarUrl: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  planTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
  },
  resetTokenHash: {
    type: String,
    default: null,
  },
  resetTokenExpiry: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

UserSchema.pre('save', function (next) {
  if (!this.email && !this.mobileNumber) {
    next(new Error('At least one of email or mobileNumber must be provided'));
  } else {
    next();
  }
});

export default mongoose.model<IUser>('User', UserSchema);
