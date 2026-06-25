import { Schema, model, models, Types, type Document, type Model } from "mongoose";
import type { Role } from "@/lib/auth/permissions";

export interface IUser extends Document {
  siteId: Types.ObjectId | null;
  kullaniciAdi: string;
  sifreHash: string;
  rol: Role;
  adSoyad: string;
  daireId?: Types.ObjectId;
  sakinSubId?: Types.ObjectId;
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    siteId: { type: Schema.Types.ObjectId, ref: "Site", default: null },
    kullaniciAdi: { type: String, required: true, trim: true, lowercase: true },
    sifreHash: { type: String, required: true },
    rol: {
      type: String,
      enum: ["sistem_admin", "site_yoneticisi", "muhasebe", "site_sakini"],
      required: true,
    },
    adSoyad: { type: String, required: true, trim: true },
    daireId: { type: Schema.Types.ObjectId, ref: "Daire" },
    sakinSubId: { type: Schema.Types.ObjectId },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true },
);

UserSchema.index({ siteId: 1, kullaniciAdi: 1 }, { unique: true });

export default (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
