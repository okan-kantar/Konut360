import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type SakinTuru = "EvSahibi" | "Kiraci";

export interface ISakin {
  _id: Types.ObjectId;
  tur: SakinTuru;
  adSoyad: string;
  telefon1?: string;
  telefon2?: string;
  eposta?: string;
  plakalar: string[];
  not?: string;
  aktif: boolean;
  createdAt: Date;
}

export interface IDaire extends Document {
  siteId: Types.ObjectId;
  blokId: Types.ObjectId;
  daireNo: string;
  daireTipi?: string;
  aidatGrubuId: Types.ObjectId;
  sakinler: ISakin[];
  createdAt: Date;
  updatedAt: Date;
}

const SakinSchema = new Schema<ISakin>(
  {
    tur: { type: String, enum: ["EvSahibi", "Kiraci"], required: true },
    adSoyad: { type: String, required: true, trim: true },
    telefon1: { type: String, trim: true },
    telefon2: { type: String, trim: true },
    eposta: { type: String, trim: true, lowercase: true },
    plakalar: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 3,
        message: "En fazla 3 araç plakası girilebilir.",
      },
    },
    not: { type: String, trim: true },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const DaireSchema = new Schema<IDaire>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    blokId: { type: Schema.Types.ObjectId, required: true, ref: "Blok" },
    daireNo: { type: String, required: true, trim: true },
    daireTipi: { type: String, trim: true },
    aidatGrubuId: { type: Schema.Types.ObjectId, required: true, ref: "AidatGrubu" },
    sakinler: { type: [SakinSchema], default: [] },
  },
  { timestamps: true },
);

DaireSchema.index({ siteId: 1, blokId: 1, daireNo: 1 }, { unique: true });

export function getAktifSakin(daire: Pick<IDaire, "sakinler">): ISakin | undefined {
  return daire.sakinler.find((s) => s.aktif);
}

export default (models.Daire as Model<IDaire>) || model<IDaire>("Daire", DaireSchema);
