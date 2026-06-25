import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type TalepDurum = "Bekliyor" | "Onaylandi" | "Reddedildi";

export interface ITalepEdilenAlanlar {
  telefon1?: string;
  telefon2?: string;
  eposta?: string;
  plaka?: string;
}

export interface ISakinGuncellemeTalebi extends Document {
  siteId: Types.ObjectId;
  daireId: Types.ObjectId;
  sakinSubId: Types.ObjectId;
  talepEdilenAlanlar: ITalepEdilenAlanlar;
  durum: TalepDurum;
  createdAt: Date;
  updatedAt: Date;
}

const SakinGuncellemeTalebiSchema = new Schema<ISakinGuncellemeTalebi>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    daireId: { type: Schema.Types.ObjectId, required: true, ref: "Daire" },
    sakinSubId: { type: Schema.Types.ObjectId, required: true },
    talepEdilenAlanlar: {
      telefon1: String,
      telefon2: String,
      eposta: String,
      plaka: String,
    },
    durum: { type: String, enum: ["Bekliyor", "Onaylandi", "Reddedildi"], default: "Bekliyor" },
  },
  { timestamps: true },
);

SakinGuncellemeTalebiSchema.index({ siteId: 1, durum: 1 });
SakinGuncellemeTalebiSchema.index({ siteId: 1, daireId: 1 });

export default (models.SakinGuncellemeTalebi as Model<ISakinGuncellemeTalebi>) ||
  model<ISakinGuncellemeTalebi>("SakinGuncellemeTalebi", SakinGuncellemeTalebiSchema);
