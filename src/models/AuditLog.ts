import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface IAuditLog extends Document {
  siteId: Types.ObjectId | null;
  userId: Types.ObjectId;
  rol: string;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    siteId: { type: Schema.Types.ObjectId, ref: "Site", default: null },
    userId: { type: Schema.Types.ObjectId, required: true },
    rol: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ siteId: 1, createdAt: -1 });

export default (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>("AuditLog", AuditLogSchema);
