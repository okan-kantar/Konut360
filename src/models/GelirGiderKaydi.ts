import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type GelirGiderTip = "Gelir" | "Gider";
export type GelirGiderKaynak = "aidat-tahsilat" | "ek-odenek-tahsilat" | "manuel";

export interface IGelirGiderKaydi extends Document {
  siteId: Types.ObjectId;
  kasaId: Types.ObjectId;
  tip: GelirGiderTip;
  kategori: string;
  tutar: number;
  tarih: Date;
  odemeYontemi: string;
  aciklama?: string;
  firmaId?: Types.ObjectId;
  kaynak: GelirGiderKaynak;
  kaynakRefId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GelirGiderKaydiSchema = new Schema<IGelirGiderKaydi>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    kasaId: { type: Schema.Types.ObjectId, required: true, ref: "Kasa" },
    tip: { type: String, enum: ["Gelir", "Gider"], required: true },
    kategori: { type: String, required: true, trim: true },
    tutar: { type: Number, required: true },
    tarih: { type: Date, required: true },
    odemeYontemi: { type: String, required: true, trim: true },
    aciklama: { type: String, trim: true },
    firmaId: { type: Schema.Types.ObjectId, ref: "Firma" },
    kaynak: { type: String, enum: ["aidat-tahsilat", "ek-odenek-tahsilat", "manuel"], default: "manuel" },
    kaynakRefId: { type: Schema.Types.ObjectId },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);

GelirGiderKaydiSchema.index({ siteId: 1, kasaId: 1 });
GelirGiderKaydiSchema.index({ siteId: 1, tarih: -1 });
GelirGiderKaydiSchema.index({ siteId: 1, kaynakRefId: 1 });

export default (models.GelirGiderKaydi as Model<IGelirGiderKaydi>) ||
  model<IGelirGiderKaydi>("GelirGiderKaydi", GelirGiderKaydiSchema);
