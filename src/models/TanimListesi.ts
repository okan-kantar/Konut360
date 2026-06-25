import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type TanimKategori = "DaireTipi" | "GelirTuru" | "GiderTuru" | "OdemeYontemi";

export const TANIM_KATEGORILERI: { kategori: TanimKategori; label: string }[] = [
  { kategori: "DaireTipi", label: "Daire Tipleri" },
  { kategori: "GelirTuru", label: "Gelir Türleri" },
  { kategori: "GiderTuru", label: "Gider Türleri" },
  { kategori: "OdemeYontemi", label: "Ödeme Yöntemleri" },
];

export interface ITanimListesi extends Document {
  siteId: Types.ObjectId;
  kategori: TanimKategori;
  deger: string;
  createdAt: Date;
}

const TanimListesiSchema = new Schema<ITanimListesi>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    kategori: {
      type: String,
      enum: ["DaireTipi", "GelirTuru", "GiderTuru", "OdemeYontemi"],
      required: true,
    },
    deger: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TanimListesiSchema.index({ siteId: 1, kategori: 1, deger: 1 }, { unique: true });

export default (models.TanimListesi as Model<ITanimListesi>) ||
  model<ITanimListesi>("TanimListesi", TanimListesiSchema);
