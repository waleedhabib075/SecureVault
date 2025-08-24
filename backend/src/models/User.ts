import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  avatar?: string;
  subscription: 'free' | 'pro' | 'business';
  biometricEnabled: boolean;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  subscription: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free',
  },
  biometricEnabled: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create compound index for better query performance
UserSchema.index({ firebaseUid: 1, email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
