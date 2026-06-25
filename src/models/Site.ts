import { Schema, model, models, type Document, type Model } from "mongoose";

export interface IFaizPolitikasi {
  faizBaslangicGunSayisi: number;
  gunlukFaizOraniYuzde: number;
}

export interface ISite extends Document {
  ad: string;
  slug: string;
  aktif: boolean;
  accentColor: string;
  faizPolitikasi: IFaizPolitikasi;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSchema = new Schema<ISite>(
  {
    ad: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    aktif: { type: Boolean, default: true },
    accentColor: { type: String, default: "#2D5BFF" },
    faizPolitikasi: {
      faizBaslangicGunSayisi: { type: Number, default: 0 },
      gunlukFaizOraniYuzde: { type: Number, default: 0.1 },
    },
  },
  { timestamps: true },
);

SiteSchema.index({ slug: 1 }, { unique: true });

export default (models.Site as Model<ISite>) || model<ISite>("Site", SiteSchema);
