import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface IKasa extends Document {
  siteId: Types.ObjectId;
  ad: string;
  tip: string;
  acilisBakiyesi: number;
  guncelBakiye: number;
  createdAt: Date;
  updatedAt: Date;
}

const KasaSchema = new Schema<IKasa>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ad: { type: String, required: true, trim: true },
    tip: { type: String, required: true, trim: true, default: "Banka Hesabı" },
    acilisBakiyesi: { type: Number, default: 0 },
    guncelBakiye: { type: Number, default: 0 },
  },
  { timestamps: true },
);

KasaSchema.index({ siteId: 1, ad: 1 }, { unique: true });

export default (models.Kasa as Model<IKasa>) || model<IKasa>("Kasa", KasaSchema);
