import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type AidatDurum = "Bekliyor" | "Gecikti" | "Odendi";

export interface IAidatKaydi extends Document {
  siteId: Types.ObjectId;
  daireId: Types.ObjectId;
  donem: string; // 'YYYY-MM'
  birimTutar: number;
  vadeTarihi: Date;
  durum: AidatDurum;
  odemeTarihi?: Date;
  hesaplananFaiz: number;
  gelirKaydiId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AidatKaydiSchema = new Schema<IAidatKaydi>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    daireId: { type: Schema.Types.ObjectId, required: true, ref: "Daire" },
    donem: { type: String, required: true },
    birimTutar: { type: Number, required: true },
    vadeTarihi: { type: Date, required: true },
    durum: { type: String, enum: ["Bekliyor", "Gecikti", "Odendi"], default: "Bekliyor" },
    odemeTarihi: { type: Date },
    hesaplananFaiz: { type: Number, default: 0 },
    gelirKaydiId: { type: Schema.Types.ObjectId, ref: "GelirGiderKaydi" },
  },
  { timestamps: true },
);

AidatKaydiSchema.index({ siteId: 1, daireId: 1, donem: 1 }, { unique: true });
AidatKaydiSchema.index({ siteId: 1, durum: 1, vadeTarihi: 1 });

export default (models.AidatKaydi as Model<IAidatKaydi>) ||
  model<IAidatKaydi>("AidatKaydi", AidatKaydiSchema);
