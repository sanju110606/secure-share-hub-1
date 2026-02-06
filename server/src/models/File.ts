import mongoose, { Document, Schema } from 'mongoose';

export interface IFile extends Document {
  name: string;
  originalName: string;
  size: number;
  type: string;
  path: string;
  uploadedAt: Date;
  accessToken: string;
  expiryTimestamp: Date;
  maxDownloads: number;
  usedDownloads: number;
  status: 'active' | 'revoked';
  visibility: 'public' | 'private';
  uploadedBy: mongoose.Types.ObjectId;
}

const fileSchema = new Schema<IFile>({
  name: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  accessToken: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  expiryTimestamp: {
    type: Date,
    required: true,
  },
  maxDownloads: {
    type: Number,
    default: 0, // 0 means unlimited
  },
  usedDownloads: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active',
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private',
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export const File = mongoose.model<IFile>('File', fileSchema);
