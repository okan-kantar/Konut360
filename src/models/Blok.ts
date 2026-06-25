import { Schema, model, models, Types, type Document, type Model } from "mongoose";

export interface IBlok extends Document {
  siteId: Types.ObjectId;
  ad: string;
  katSayisi?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlokSchema = new Schema<IBlok>(
  {
    siteId: { type: Schema.Types.ObjectId, required: true, ref: "Site" },
    ad: { type: String, required: true, trim: true },
    katSayisi: { type: Number, min: 0 },
  },
  { timestamps: true },
);

BlokSchema.index({ siteId: 1, ad: 1 }, { unique: true });

export default (models.Blok as Model<IBlok>) || model<IBlok>("Blok", BlokSchema);
