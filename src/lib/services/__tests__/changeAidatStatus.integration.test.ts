// Bu test gerçek bir MongoDB replica set'ine bağlanır (transaction kullanır).
// `docker exec konut360-mongo ...` ile kurulan lokal replica set'in çalışır
// olması gerekir — bkz. README "Geliştirme Ortamı" bölümü.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";

process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI ?? "mongodb://127.0.0.1:27017/konut360_test?replicaSet=rs0";

const { connectDB } = await import("@/lib/db/connect");
const { default: Site } = await import("@/models/Site");
const { default: Kasa } = await import("@/models/Kasa");
const { default: AidatKaydi } = await import("@/models/AidatKaydi");
const { default: GelirGiderKaydi } = await import("@/models/GelirGiderKaydi");
const { default: AuditLog } = await import("@/models/AuditLog");
const { changeAidatStatus } = await import("@/lib/services/changeAidatStatus");

describe("changeAidatStatus (entegrasyon)", () => {
  let siteId: string;
  let kasaId: string;
  let aidatId: string;

  beforeAll(async () => {
    await connectDB();
    const site = await Site.create({ ad: "Test Sitesi", slug: `test-sitesi-${Date.now()}` });
    siteId = String(site._id);
    const kasa = await Kasa.create({ siteId, ad: "Test Kasası", tip: "Nakit", acilisBakiyesi: 0, guncelBakiye: 0 });
    kasaId = String(kasa._id);
    // Vade tarihi kasıtlı olarak gelecekte: bu test "vadesinde / zamanında ödeme"
    // senaryosunu doğruluyor, faiz hesabı ayrı bir senaryoda test ediliyor.
    const vadeTarihi = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const aidat = await AidatKaydi.create({
      siteId,
      daireId: new mongoose.Types.ObjectId(),
      donem: "2026-06",
      birimTutar: 1750,
      vadeTarihi,
      durum: "Bekliyor",
    });
    aidatId = String(aidat._id);
  });

  afterAll(async () => {
    await AidatKaydi.deleteMany({ siteId });
    await GelirGiderKaydi.deleteMany({ siteId });
    await Kasa.deleteMany({ siteId });
    await AuditLog.deleteMany({ siteId });
    await Site.deleteOne({ _id: siteId });
    await mongoose.connection.close();
  });

  it("Ödendi işaretlenince kasaya gelir kaydı işler ve bakiyeyi artırır", async () => {
    await changeAidatStatus({
      siteId,
      aidatId,
      yeniDurum: "Odendi",
      kasaId,
      userId: new mongoose.Types.ObjectId().toString(),
      rol: "site_yoneticisi",
    });

    const kayit = await AidatKaydi.findById(aidatId);
    expect(kayit?.durum).toBe("Odendi");

    const kasa = await Kasa.findById(kasaId);
    expect(kasa?.guncelBakiye).toBe(1750);

    const gelir = await GelirGiderKaydi.findOne({ siteId, kaynak: "aidat-tahsilat", kaynakRefId: aidatId });
    expect(gelir?.tutar).toBe(1750);
  });

  it("Ödendi'den geri alınınca gelir kaydı silinir ve bakiye geri düşer", async () => {
    await changeAidatStatus({
      siteId,
      aidatId,
      yeniDurum: "Bekliyor",
      userId: new mongoose.Types.ObjectId().toString(),
      rol: "site_yoneticisi",
    });

    const kayit = await AidatKaydi.findById(aidatId);
    expect(kayit?.durum).toBe("Bekliyor");

    const kasa = await Kasa.findById(kasaId);
    expect(kasa?.guncelBakiye).toBe(0);

    const gelir = await GelirGiderKaydi.findOne({ siteId, kaynak: "aidat-tahsilat", kaynakRefId: aidatId });
    expect(gelir).toBeNull();
  });

  it("vadesi geçmiş bir kayıt ödenince faiz dahil tutar kasaya işlenir", async () => {
    // vadeTarihi 10 gün öncesi: durum alanı hâlâ "Bekliyor" olsa da (henüz lazy-sync
    // okunmadı) faiz, fiili tarihe göre her zaman doğru hesaplanmalı.
    const vadeTarihi = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const gecikmisKayit = await AidatKaydi.create({
      siteId,
      daireId: new mongoose.Types.ObjectId(),
      donem: "2026-05",
      birimTutar: 1750,
      vadeTarihi,
      durum: "Bekliyor",
    });

    await changeAidatStatus({
      siteId,
      aidatId: String(gecikmisKayit._id),
      yeniDurum: "Odendi",
      kasaId,
      userId: new mongoose.Types.ObjectId().toString(),
      rol: "site_yoneticisi",
    });

    const kayit = await AidatKaydi.findById(gecikmisKayit._id);
    expect(kayit?.durum).toBe("Odendi");
    expect(kayit?.hesaplananFaiz).toBeGreaterThan(0);

    const gelir = await GelirGiderKaydi.findOne({ siteId, kaynak: "aidat-tahsilat", kaynakRefId: gecikmisKayit._id });
    expect(gelir?.tutar).toBe(1750 + (kayit?.hesaplananFaiz ?? 0));
  });
});
