import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type FirmaTur = "GercekKisi" | "TuzelKisi";

export interface IFirma extends Document {
  siteId: Types.ObjectId;
  ad: string;
  tur: FirmaTur;
  hizmet?: string;
  adres?: string;
  iletisim?: string;
  vergiDairesi?: string;
  vergiNoTckn?: string;
  iban?: string;
  yetkili?: string;
  ekIrtibat?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FirmaSchema = new Schema<IFirma>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ad: { type: String, required: true, trim: true },
    tur: { type: String, enum: ["GercekKisi", "TuzelKisi"], required: true },
    hizmet: { type: String, trim: true },
    adres: { type: String, trim: true },
    iletisim: { type: String, trim: true },
    vergiDairesi: { type: String, trim: true },
    vergiNoTckn: { type: String, trim: true },
    iban: { type: String, trim: true },
    yetkili: { type: String, trim: true },
    ekIrtibat: { type: String, trim: true },
  },
  { timestamps: true },
);

FirmaSchema.index({ siteId: 1, ad: 1 }, { unique: true });

export default (models.Firma as Model<IFirma>) || model<IFirma>("Firma", FirmaSchema);
