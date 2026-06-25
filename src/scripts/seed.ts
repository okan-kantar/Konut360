/**
 * Park Vadi Sitesi için Claude Design demo verisiyle birebir tutarlı bir
 * örnek site oluşturur (idempotent — `slug`/`ad` üzerinden var olan kayıtları
 * atlar). Ayrıca ilk Sistem Yöneticisi (Süper Admin) hesabını oluşturur.
 *
 * Kullanım: `npm run seed` (temiz bir veritabanında çalıştırılması önerilir).
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

interface DaireSeed {
  blok: "A" | "B" | "C";
  no: string;
  ad: string;
  tur: "EvSahibi" | "Kiraci";
  telefon1: string;
  eposta?: string;
  plaka?: string;
  grup: "Normal" | "Üst Grup";
  durum: "Odendi" | "Bekliyor" | "Gecikti";
}

const DAIRELER: DaireSeed[] = [
  { blok: "A", no: "3", ad: "Mehmet Yılmaz", tur: "EvSahibi", telefon1: "0532 214 88 17", plaka: "34 ABC 112", grup: "Normal", durum: "Odendi" },
  { blok: "A", no: "7", ad: "Ayşe Demir", tur: "Kiraci", telefon1: "0541 663 20 04", eposta: "ayse.demir@gmail.com", plaka: "06 BK 4471", grup: "Normal", durum: "Gecikti" },
  { blok: "A", no: "12", ad: "Mustafa Kaya", tur: "EvSahibi", telefon1: "0533 119 76 50", eposta: "mkaya@hotmail.com", plaka: "34 KP 9023", grup: "Üst Grup", durum: "Odendi" },
  { blok: "B", no: "2", ad: "Zeynep Şahin", tur: "Kiraci", telefon1: "0535 442 18 90", eposta: "zsahin@gmail.com", plaka: "35 ET 220", grup: "Normal", durum: "Bekliyor" },
  { blok: "B", no: "5", ad: "Hüseyin Çelik", tur: "EvSahibi", telefon1: "0506 771 35 28", eposta: "h.celik@gmail.com", plaka: "34 VR 6612", grup: "Normal", durum: "Odendi" },
  { blok: "B", no: "9", ad: "Fatma Arslan", tur: "EvSahibi", telefon1: "0532 880 14 63", eposta: "fatma.arslan@gmail.com", grup: "Üst Grup", durum: "Gecikti" },
  { blok: "C", no: "1", ad: "Ahmet Öztürk", tur: "Kiraci", telefon1: "0542 305 99 71", eposta: "ahmet.ozturk@gmail.com", plaka: "16 AD 308", grup: "Normal", durum: "Bekliyor" },
  { blok: "C", no: "4", ad: "Elif Doğan", tur: "EvSahibi", telefon1: "0538 226 47 12", eposta: "elif.dogan@gmail.com", plaka: "34 LM 1180", grup: "Normal", durum: "Odendi" },
  { blok: "C", no: "8", ad: "Kemal Aydın", tur: "EvSahibi", telefon1: "0533 614 02 85", eposta: "kemal.aydin@gmail.com", plaka: "34 FF 770", grup: "Üst Grup", durum: "Odendi" },
  { blok: "C", no: "11", ad: "Selin Yıldız", tur: "Kiraci", telefon1: "0544 158 63 39", eposta: "selin.yildiz@gmail.com", plaka: "41 SY 55", grup: "Normal", durum: "Bekliyor" },
];

async function main() {
  const { connectDB } = await import("@/lib/db/connect");
  const { default: User } = await import("@/models/User");
  const { default: Site } = await import("@/models/Site");
  const { default: Blok } = await import("@/models/Blok");
  const { default: AidatGrubu } = await import("@/models/AidatGrubu");
  const { default: Daire } = await import("@/models/Daire");
  const { default: TanimListesi } = await import("@/models/TanimListesi");
  const { default: AidatKaydi } = await import("@/models/AidatKaydi");
  const { default: Kasa } = await import("@/models/Kasa");
  const { default: GelirGiderKaydi } = await import("@/models/GelirGiderKaydi");
  const { default: Firma } = await import("@/models/Firma");
  const { default: EkOdenek } = await import("@/models/EkOdenek");
  const { default: EkOdenekBorcu } = await import("@/models/EkOdenekBorcu");
  const { hashPassword } = await import("@/lib/auth/password");

  await connectDB();

  // --- Sistem Yöneticisi ---
  const adminKullaniciAdi = process.env.SEED_ADMIN_USERNAME ?? "sistemadmin";
  const adminSifre = process.env.SEED_ADMIN_PASSWORD ?? "konut360admin";
  const adminExisting = await User.findOne({ siteId: null, kullaniciAdi: adminKullaniciAdi, rol: "sistem_admin" });
  if (!adminExisting) {
    await User.create({
      siteId: null,
      kullaniciAdi: adminKullaniciAdi,
      sifreHash: await hashPassword(adminSifre),
      rol: "sistem_admin",
      adSoyad: "Sistem Yöneticisi",
    });
    console.log(`Sistem yöneticisi oluşturuldu → ${adminKullaniciAdi} / ${adminSifre}`);
  } else {
    console.log(`Sistem yöneticisi zaten var: ${adminKullaniciAdi}`);
  }

  // --- Site ---
  let site = await Site.findOne({ slug: "park-vadi-sitesi" });
  if (!site) {
    site = await Site.create({ ad: "Park Vadi Sitesi", slug: "park-vadi-sitesi" });
    console.log("Site oluşturuldu: Park Vadi Sitesi");
  } else {
    console.log("Site zaten var: Park Vadi Sitesi");
  }
  const siteId = site._id;

  const yoneticiKullaniciAdi = process.env.SEED_YONETICI_KULLANICI_ADI ?? "yonetici";
  const yoneticiSifre = process.env.SEED_YONETICI_SIFRE;
  if (!yoneticiSifre) {
    console.error("HATA: SEED_YONETICI_SIFRE ortam değişkeni tanımlı değil. .env.local dosyasına ekleyin.");
    process.exit(1);
  }
  const yoneticiExisting = await User.findOne({ siteId, kullaniciAdi: yoneticiKullaniciAdi, rol: "site_yoneticisi" });
  if (!yoneticiExisting) {
    await User.create({
      siteId,
      kullaniciAdi: yoneticiKullaniciAdi,
      sifreHash: await hashPassword(yoneticiSifre),
      rol: "site_yoneticisi",
      adSoyad: "Serkan Yöneten",
    });
    console.log(`Site yöneticisi oluşturuldu → ${yoneticiKullaniciAdi} / [SEED_YONETICI_SIFRE]`);
  }

  // --- Bloklar ---
  const blokAdMap = new Map<string, typeof site._id>();
  for (const [ad, katSayisi] of [["A", 8], ["B", 10], ["C", 9]] as const) {
    let blok = await Blok.findOne({ siteId, ad });
    if (!blok) blok = await Blok.create({ siteId, ad, katSayisi });
    blokAdMap.set(ad, blok._id);
  }

  // --- Aidat Grupları ---
  const gecerliTarih = new Date(new Date().getFullYear(), 0, 1);
  const grupAdMap = new Map<string, typeof site._id>();
  for (const [ad, tutar] of [["Normal", 1750], ["Üst Grup", 2400]] as const) {
    let grup = await AidatGrubu.findOne({ siteId, ad });
    if (!grup) grup = await AidatGrubu.create({ siteId, ad, tutarGecmisi: [{ tutar, gecerliTarih }] });
    grupAdMap.set(ad, grup._id);
  }

  // --- Tanımlar ---
  const tanimSeed: { kategori: "DaireTipi" | "GelirTuru" | "GiderTuru" | "OdemeYontemi"; degerler: string[] }[] = [
    { kategori: "DaireTipi", degerler: ["1+1", "2+1", "3+1", "Kapıcı Dairesi", "Dükkan"] },
    { kategori: "GelirTuru", degerler: ["Aidat", "Kira Geliri", "Demirbaş Satışı", "Ek Ödenek"] },
    { kategori: "GiderTuru", degerler: ["Asansör", "Temizlik", "Tamir-Tadilat", "Çatı", "Peyzaj", "Elektrik", "Personel"] },
    { kategori: "OdemeYontemi", degerler: ["Nakit", "Havale/EFT", "Kredi Kartı"] },
  ];
  for (const { kategori, degerler } of tanimSeed) {
    for (const deger of degerler) {
      await TanimListesi.updateOne({ siteId, kategori, deger }, { $setOnInsert: { siteId, kategori, deger } }, { upsert: true });
    }
  }

  // --- Daireler + cari dönem aidat kaydı ---
  const now = new Date();
  const donem = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const vadeBekliyor = new Date(now.getFullYear(), now.getMonth(), 28);
  const vadeGecikti = new Date(now.getFullYear(), now.getMonth(), 1);
  const daireIdMap = new Map<string, typeof site._id>();

  for (const d of DAIRELER) {
    const blokId = blokAdMap.get(d.blok)!;
    let daire = await Daire.findOne({ siteId, blokId, daireNo: d.no });
    if (!daire) {
      daire = await Daire.create({
        siteId,
        blokId,
        daireNo: d.no,
        aidatGrubuId: grupAdMap.get(d.grup)!,
        sakinler: [
          {
            tur: d.tur,
            adSoyad: d.ad,
            telefon1: d.telefon1,
            eposta: d.eposta,
            plakalar: d.plaka ? [d.plaka] : [],
            aktif: true,
          },
        ],
      });
    }
    daireIdMap.set(`${d.blok}-${d.no}`, daire._id);

    const tutar = d.grup === "Üst Grup" ? 2400 : 1750;
    const existing = await AidatKaydi.findOne({ siteId, daireId: daire._id, donem });
    if (!existing) {
      const ortak = { siteId, daireId: daire._id, donem, birimTutar: tutar };
      if (d.durum === "Odendi") {
        await AidatKaydi.create({
          ...ortak,
          vadeTarihi: vadeGecikti,
          durum: "Odendi",
          odemeTarihi: new Date(now.getFullYear(), now.getMonth(), 4),
          hesaplananFaiz: 0,
        });
      } else if (d.durum === "Bekliyor") {
        await AidatKaydi.create({ ...ortak, vadeTarihi: vadeBekliyor, durum: "Bekliyor" });
      } else {
        await AidatKaydi.create({ ...ortak, vadeTarihi: vadeGecikti, durum: "Gecikti" });
      }
    }
  }

  // --- Kasalar (hedef bakiyeler tasarımla birebir) ---
  const kasaHedef: { ad: string; tip: string; guncel: number }[] = [
    { ad: "Ziraat Bankası Kasası", tip: "Banka Hesabı", guncel: 184250 },
    { ad: "Enpara Kasası", tip: "Banka Hesabı", guncel: 96800 },
    { ad: "Nakit Kasa", tip: "Nakit", guncel: 12400 },
  ];
  const kasaIdMap = new Map<string, typeof site._id>();
  for (const k of kasaHedef) {
    let kasa = await Kasa.findOne({ siteId, ad: k.ad });
    if (!kasa) {
      kasa = await Kasa.create({ siteId, ad: k.ad, tip: k.tip, acilisBakiyesi: k.guncel, guncelBakiye: k.guncel });
    }
    kasaIdMap.set(k.ad, kasa._id);
  }

  // --- Firmalar ---
  const firmaSeed = [
    { ad: "Otis Asansör Bakım A.Ş.", tur: "TuzelKisi" as const, hizmet: "Asansör", yetkili: "Burak Şen", vergiDairesi: "Beşiktaş VD", vergiNoTckn: "6120384512", iban: "TR48 0006 2000 0000 0000 0000 01" },
    { ad: "Pırıl Temizlik Hizmetleri", tur: "TuzelKisi" as const, hizmet: "Temizlik", yetkili: "Nalan Kork", vergiDairesi: "Kadıköy VD", vergiNoTckn: "7340912233", iban: "TR33 0001 0021 0000 0000 0000 02" },
    { ad: "Mehmet Usta (Tesisat)", tur: "GercekKisi" as const, hizmet: "Tamir-Tadilat", yetkili: "Mehmet Acar", vergiNoTckn: "12345678901", iban: "TR62 0011 1000 0000 0000 0000 03" },
    { ad: "Yeşil Peyzaj Ltd. Şti.", tur: "TuzelKisi" as const, hizmet: "Peyzaj", yetkili: "Deniz Ova", vergiDairesi: "Maltepe VD", vergiNoTckn: "9981200345", iban: "TR91 0004 6007 0000 0000 0000 04" },
  ];
  const firmaAdMap = new Map<string, typeof site._id>();
  for (const f of firmaSeed) {
    let firma = await Firma.findOne({ siteId, ad: f.ad });
    if (!firma) firma = await Firma.create({ siteId, ...f });
    firmaAdMap.set(f.ad, firma._id);
  }

  // --- Kasa Hareketleri (tasarımdaki 7 kayıt) ---
  const yoneticiUser = await User.findOne({ siteId, rol: "site_yoneticisi" });
  const txSeed = [
    { gun: 20, tip: "Gider" as const, kategori: "Asansör", aciklama: "Otis Asansör — aylık bakım", kasa: "Ziraat Bankası Kasası", tutar: 3200, firma: "Otis Asansör Bakım A.Ş." },
    { gun: 18, tip: "Gelir" as const, kategori: "Kira Geliri", aciklama: "Kapıcı dairesi kira geliri", kasa: "Ziraat Bankası Kasası", tutar: 6500 },
    { gun: 15, tip: "Gider" as const, kategori: "Temizlik", aciklama: "Pırıl Temizlik — aylık hizmet", kasa: "Enpara Kasası", tutar: 8500, firma: "Pırıl Temizlik Hizmetleri" },
    { gun: 10, tip: "Gider" as const, kategori: "Personel", aciklama: "Kapıcı maaşı", kasa: "Ziraat Bankası Kasası", tutar: 22000 },
    { gun: 8, tip: "Gider" as const, kategori: "Peyzaj", aciklama: "Yeşil Peyzaj — bahçe bakımı", kasa: "Nakit Kasa", tutar: 2100, firma: "Yeşil Peyzaj Ltd. Şti." },
    { gun: 5, tip: "Gider" as const, kategori: "Elektrik", aciklama: "Ortak alan elektrik faturası", kasa: "Enpara Kasası", tutar: 4350 },
    { gun: 3, tip: "Gelir" as const, kategori: "Aidat", aciklama: "B-5 Hüseyin Çelik — aidat tahsilatı", kasa: "Nakit Kasa", tutar: 1750 },
  ];
  const existingTx = await GelirGiderKaydi.countDocuments({ siteId, kaynak: "manuel" });
  if (existingTx === 0 && yoneticiUser) {
    for (const t of txSeed) {
      await GelirGiderKaydi.create({
        siteId,
        kasaId: kasaIdMap.get(t.kasa),
        tip: t.tip,
        kategori: t.kategori,
        tutar: t.tutar,
        tarih: new Date(now.getFullYear(), now.getMonth(), t.gun),
        odemeYontemi: "Havale/EFT",
        aciklama: t.aciklama,
        firmaId: t.firma ? firmaAdMap.get(t.firma) : undefined,
        kaynak: "manuel",
        createdBy: yoneticiUser._id,
      });
    }
    console.log("Kasa hareketleri (7 kayıt) oluşturuldu");
  }

  // --- Ek Ödenekler ---
  const tumDaireIds = [...daireIdMap.values()];
  const aBlokDaireIds = [...daireIdMap.entries()].filter(([k]) => k.startsWith("A-")).map(([, v]) => v);

  const ekOdenekSeed = [
    { ad: "Cephe Yenileme Katkı Payı", kapsam: "Tum" as const, kapsamRefIds: [], tutar: 3500, son: new Date(now.getFullYear(), 6, 31), faiz: 5, odenenOran: 0.7, daireIds: tumDaireIds },
    { ad: "Otopark Düzenleme", kapsam: "Blok" as const, kapsamRefIds: [blokAdMap.get("A")!], tutar: 1200, son: new Date(now.getFullYear(), 7, 15), faiz: 0, odenenOran: 0.34, daireIds: aBlokDaireIds },
  ];
  for (const e of ekOdenekSeed) {
    let ekOdenek = await EkOdenek.findOne({ siteId, ad: e.ad });
    if (!ekOdenek) {
      ekOdenek = await EkOdenek.create({
        siteId,
        ad: e.ad,
        kapsam: e.kapsam,
        kapsamRefIds: e.kapsamRefIds,
        tutar: e.tutar,
        sonOdemeTarihi: e.son,
        faizOraniYuzde: e.faiz,
      });
      const odenenSayisi = Math.round(e.daireIds.length * e.odenenOran);
      for (const [i, daireId] of e.daireIds.entries()) {
        await EkOdenekBorcu.create({
          siteId,
          ekOdenekId: ekOdenek._id,
          daireId,
          tutar: e.tutar,
          sonOdemeTarihi: e.son,
          faizOraniYuzde: e.faiz,
          durum: i < odenenSayisi ? "Odendi" : "Bekliyor",
          odemeTarihi: i < odenenSayisi ? new Date() : undefined,
        });
      }
    }
  }

  console.log(`\nSeed tamamlandı. Giriş: site=Park Vadi Sitesi, kullanıcı=${yoneticiKullaniciAdi}, şifre=[SEED_YONETICI_SIFRE]`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
