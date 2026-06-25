import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface ITutarGecmisiItem {
  tutar: number;
  gecerliTarih: Date;
}

export interface IAidatGrubu extends Document {
  siteId: Types.ObjectId;
  ad: string;
  tutarGecmisi: ITutarGecmisiItem[];
  createdAt: Date;
  updatedAt: Date;
}

const TutarGecmisiSchema = new Schema<ITutarGecmisiItem>(
  {
    tutar: { type: Number, required: true, min: 0 },
    gecerliTarih: { type: Date, required: true },
  },
  { _id: false },
);

const AidatGrubuSchema = new Schema<IAidatGrubu>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ad: { type: String, required: true, trim: true },
    tutarGecmisi: { type: [TutarGecmisiSchema], default: [] },
  },
  { timestamps: true },
);

AidatGrubuSchema.index({ siteId: 1, ad: 1 }, { unique: true });

export default (models.AidatGrubu as Model<IAidatGrubu>) ||
  model<IAidatGrubu>("AidatGrubu", AidatGrubuSchema);
