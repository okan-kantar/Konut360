import { connectDB } from "@/lib/db/connect";
import AidatKaydi from "@/models/AidatKaydi";
import EkOdenekBorcu from "@/models/EkOdenekBorcu";

/**
 * Lazy-write-on-read: vadesi geçmiş "Bekliyor" kayıtlarını "Gecikti"ye çevirir.
 * Cron'a bağımlı değildir — her liste/dashboard sorgusundan önce çağrılır.
 */
export async function senkronizeGecikenDurumlar(siteId: string): Promise<void> {
  await connectDB();
  const now = new Date();
  await Promise.all([
    AidatKaydi.updateMany(
      { siteId, durum: "Bekliyor", vadeTarihi: { $lt: now } },
      { $set: { durum: "Gecikti" } },
    ),
    EkOdenekBorcu.updateMany(
      { siteId, durum: "Bekliyor", sonOdemeTarihi: { $lt: now } },
      { $set: { durum: "Gecikti" } },
    ),
  ]);
}
