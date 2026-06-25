import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export type EkOdenekKapsam = "Tum" | "Blok" | "Secili";

export interface IEkOdenek extends Document {
  siteId: Types.ObjectId;
  ad: string;
  kapsam: EkOdenekKapsam;
  kapsamRefIds: Types.ObjectId[];
  tutar: number;
  sonOdemeTarihi: Date;
  faizOraniYuzde: number;
  createdAt: Date;
  updatedAt: Date;
}

const EkOdenekSchema = new Schema<IEkOdenek>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ad: { type: String, required: true, trim: true },
    kapsam: { type: String, enum: ["Tum", "Blok", "Secili"], required: true },
    kapsamRefIds: { type: [Schema.Types.ObjectId], default: [] },
    tutar: { type: Number, required: true, min: 0 },
    sonOdemeTarihi: { type: Date, required: true },
    faizOraniYuzde: { type: Number, default: 0 },
  },
  { timestamps: true },
);

EkOdenekSchema.index({ siteId: 1 });

export default (models.EkOdenek as Model<IEkOdenek>) || model<IEkOdenek>("EkOdenek", EkOdenekSchema);
