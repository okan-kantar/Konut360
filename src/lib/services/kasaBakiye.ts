import { connectDB } from "@/lib/db/connect";
import Kasa from "@/models/Kasa";

/** Tahsilat ekranlarında kasa seçilmediğinde kullanılacak varsayılan kasayı döner. */
export async function resolveDefaultKasaId(siteId: string): Promise<string | null> {
  await connectDB();
  const kasa = await Kasa.findOne({ siteId }).sort({ createdAt: 1 }).select("_id").lean();
  return kasa ? String(kasa._id) : null;
}
