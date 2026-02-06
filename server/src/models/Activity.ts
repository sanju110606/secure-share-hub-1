import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  fileId: mongoose.Types.ObjectId;
  timestamp: Date;
  eventType: 'download_success' | 'download_blocked' | 'link_regenerated' | 'link_revoked' | 'access_attempt';
  status: 'success' | 'blocked' | 'info';
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

const activitySchema = new Schema<IActivity>({
  fileId: {
    type: Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  eventType: {
    type: String,
    enum: ['download_success', 'download_blocked', 'link_regenerated', 'link_revoked', 'access_attempt'],
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'blocked', 'info'],
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
});

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
