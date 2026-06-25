import { Schema, model, models, Types, type Document, type Model } from "mongoose";
import type { AidatDurum } from "./AidatKaydi";

export interface IEkOdenekBorcu extends Document {
  siteId: Types.ObjectId;
  ekOdenekId: Types.ObjectId;
  daireId: Types.ObjectId;
  tutar: number;
  sonOdemeTarihi: Date;
  faizOraniYuzde: number;
  durum: AidatDurum;
  odemeTarihi?: Date;
  hesaplananFaiz: number;
  gelirKaydiId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EkOdenekBorcuSchema = new Schema<IEkOdenekBorcu>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ekOdenekId: { type: Schema.Types.ObjectId, required: true, ref: "EkOdenek" },
    daireId: { type: Schema.Types.ObjectId, required: true, ref: "Daire" },
    tutar: { type: Number, required: true },
    sonOdemeTarihi: { type: Date, required: true },
    faizOraniYuzde: { type: Number, default: 0 },
    durum: { type: String, enum: ["Bekliyor", "Gecikti", "Odendi"], default: "Bekliyor" },
    odemeTarihi: { type: Date },
    hesaplananFaiz: { type: Number, default: 0 },
    gelirKaydiId: { type: Schema.Types.ObjectId, ref: "GelirGiderKaydi" },
  },
  { timestamps: true },
);

EkOdenekBorcuSchema.index({ siteId: 1, ekOdenekId: 1, daireId: 1 }, { unique: true });
EkOdenekBorcuSchema.index({ siteId: 1, durum: 1, sonOdemeTarihi: 1 });

export default (models.EkOdenekBorcu as Model<IEkOdenekBorcu>) ||
  model<IEkOdenekBorcu>("EkOdenekBorcu", EkOdenekBorcuSchema);
