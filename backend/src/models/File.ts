import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  firebaseUid: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'audio';
  size: number;
  encrypted: boolean;
  albumId?: string;
  thumbnail?: string;
  url?: string;
  uploadedAt: Date;
  lastModified: Date;
  // Encryption metadata
  encryption: {
    encryptedData: string;
    iv: string;
    salt: string;
  };
  // Original file info
  originalUri?: string;
  mimeType?: string;
  // File storage info
  storagePath?: string;
  checksum?: string;
}

const FileSchema = new Schema<IFile>({
  firebaseUid: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'audio'],
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  encrypted: {
    type: Boolean,
    default: true,
  },
  albumId: {
    type: String,
    default: null,
  },
  thumbnail: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  lastModified: {
    type: Date,
    default: Date.now,
  },
  encryption: {
    encryptedData: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
  },
  originalUri: {
    type: String,
    default: null,
  },
  mimeType: {
    type: String,
    default: null,
  },
  storagePath: {
    type: String,
    default: null,
  },
  checksum: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
FileSchema.index({ firebaseUid: 1, type: 1 });
FileSchema.index({ firebaseUid: 1, albumId: 1 });
FileSchema.index({ firebaseUid: 1, uploadedAt: -1 });

export const File = mongoose.model<IFile>('File', FileSchema);
