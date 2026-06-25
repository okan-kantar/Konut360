# Konut360 — Apartman / Site Yönetim Sistemi

Next.js (App Router, TypeScript) + MongoDB ile geliştirilmiş, çok kiracılı (multi-tenant) bir apartman/site yönetim sistemi. Aidat tahakkuk/tahsilat, gecikme faizi, ek ödenek, kasa/gelir-gider, firma yönetimi, raporlama ve sakin self-servis portalını kapsar.

Mimari plan ve gereksinim analizi için `analiz/` klasörüne bakın (`apartman_yonetim_analiz.docx` ve Claude Design çıktısı `claude_design/` — bu ikincisi gerçek kod değil, sadece görsel/UX referansıdır).

## Teknoloji Yığını

- **Next.js 16** (App Router, Turbopack, TypeScript) — bu sürüm `middleware.ts` yerine **`src/proxy.ts`** kullanır (`export function proxy(...)`), Edge runtime desteklemez (proxy her zaman Node.js runtime'da çalışır).
- **Tailwind CSS v4** — CSS-first config, tasarım tokenleri `src/app/globals.css` içinde `@theme inline` ile tanımlı.
- **MongoDB + Mongoose** — finansal işlemler (aidat tahsilatı, gelir-gider) `mongoose` transaction'ları kullanır, bu nedenle **replica set zorunludur** (standalone `mongod` çalışmaz).
- **jose** (JWT), **bcryptjs** (şifre hash), **zod** (validasyon).
- **vitest** (birim + entegrasyon testleri).

## Geliştirme Ortamı Kurulumu

### 1. MongoDB (replica set ile)

Transaction'lar (`session.withTransaction()`) MongoDB'nin kendi tasarımı gereği yalnızca bir **replica set**'te çalışır — standalone `mongod`'da çalışmaz. Bunun için ayrı bir sunucuya veya Docker'a gerek yok: zaten kurulu olan tek bir lokal `mongod`, kendi kendine "1 üyelik" bir replica set olabilir.

**Windows'ta mevcut native MongoDB servisini replica set'e çevirme:**

1. `mongod.cfg` dosyasını (örn. `C:\Program Files\MongoDB\Server\<sürüm>\bin\mongod.cfg`) **Yönetici olarak** açın, `#replication:` satırını şununla değiştirin:
   ```yaml
   replication:
     replSetName: rs0
   ```
2. `MongoDB` Windows servisini yeniden başlatın (`services.msc` veya yönetici terminalinde `net stop MongoDB && net start MongoDB`).
3. Bir kerelik şu komutu çalıştırın (mongosh veya MongoDB Node.js driver ile):
   ```js
   rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
   ```

Aynı port üzerinde Docker tabanlı bir MongoDB konteyneri (`docker run ... mongo:7 --replSet rs0`) çalıştırmak da alternatif bir yoldur, ama **iki yöntem aynı anda port 27017'yi dinleyemez** — Windows'ta bir konteynerin `0.0.0.0:27017` wildcard bind'i, native servisin `127.0.0.1:27017`'ye yeniden bağlanmasını engeller (`SocketException`). Hangi yöntemi seçtiyseniz diğerini durdurun (`docker stop <container>` veya native servisi durdurun).

**MongoDB Compass ile bağlanmak için:** `mongodb://127.0.0.1:27017/konut360?replicaSet=rs0` kullanın (`directConnection=true` ile `replicaSet`'in birlikte kullanımını Compass doğrulama hatası verip reddediyor — ikisine birden gerek yok).

### 2. Ortam değişkenleri

`.env.example` dosyasını `.env.local` olarak kopyalayın ve `JWT_SECRET` / `JWT_REFRESH_SECRET` değerlerini production'da güçlü, rastgele değerlerle değiştirin:

```
MONGODB_URI=mongodb://127.0.0.1:27017/konut360?replicaSet=rs0
JWT_SECRET=...
JWT_REFRESH_SECRET=...
COOKIE_SECURE=false
```

`127.0.0.1` kullanın, `localhost` değil: bu makinede `localhost`'un IPv6 (`::1`) çözümlemesi, eğer bir Docker konteyneri o adreste dinliyorsa sessizce ona yönlenebilir — bu da hangi MongoDB'ye bağlandığınız konusunda kafa karışıklığına yol açar.

### 3. Bağımlılıklar ve veri

```bash
npm install
npm run seed   # Sistem Yöneticisi + "Park Vadi Sitesi" demo verisini oluşturur
npm run dev
```

`npm run seed` idempotenttir (var olan kayıtları atlar); temiz bir veritabanında çalıştırıldığında tasarımdaki demo veriyle (Park Vadi Sitesi, A/B/C blok, 10 daire, 3 kasa, 7 kasa hareketi, 4 firma, 2 ek ödenek) birebir bir ortam kurar.

## Demo Giriş Bilgileri (seed sonrası)

| Rol | URL | Site | Kullanıcı Adı | Şifre |
|---|---|---|---|---|
| Sistem Yöneticisi | `/sistem-admin/giris` | — | `sistemadmin` | `konut360admin` |
| Site Yöneticisi | `/giris` (Site Yöneticisi sekmesi) | Park Vadi Sitesi | `yonetici` | `parkvadi2026` |
| Site Sakini | `/giris` (Site Sakini sekmesi) | — | Daire Detay ekranından "Sakin Portalı Girişi" ile oluşturulur | — |

`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` ortam değişkenleriyle Sistem Yöneticisi bilgileri özelleştirilebilir.

## Roller

Analiz dokümanındaki tam rol seti uygulanmıştır:

- **Sistem Yöneticisi (Süper Admin)** — `/sistem-admin`: site oluşturma/aktif-pasif yönetimi. Tasarımda bu role özel ekran yoktu, aynı görsel dille sıfırdan eklendi.
- **Site Yöneticisi** — sitenin tüm tanımlama, daire/sakin, aidat/ek ödenek, kasa/gelir-gider, firma ve raporlama işlemleri.
- **Muhasebe/Veznedar** — dokümanda opsiyonel işaretli; RBAC/permission modeli (`aidat:tahsilat`, `finans:manage`) hazır ama bu sürümde dedike bir login/ekranı yok. Eklemek için `src/lib/auth/permissions.ts`'teki rolü bir kullanıcıya atamak yeterli.
- **Site Sakini** — `/portal`: yalnızca kendi dairesinin borç/ödeme geçmişi, yıllık özeti ve iletişim bilgilerini görür; güncelleme talepleri Site Yöneticisi onayından geçer.

Site sakini hesapları Site Yöneticisi tarafından Daire Detay ekranından oluşturulur (analiz dokümanının açık noktası buna göre çözümlendi).

## Güvenlik Mimarisi

- JWT access token (15 dk, httpOnly cookie) + refresh token (7 gün, sadece `/api/auth/refresh`'e gönderilir); `SessionRefresher` bileşeni 10 dakikada bir sessiz yeniler.
- Permission-bazlı RBAC (`src/lib/auth/permissions.ts`) — rol kontrolü yerine permission kontrolü, yeni rol eklemek tek satır.
- `src/proxy.ts`: tüm route'larda auth + rol kontrolü, state-changing API isteklerinde Origin/host eşleşmesi (CSRF koruması), güvenlik header'ları (CSP, X-Frame-Options, vb.).
- Login endpoint'lerinde IP bazlı rate limiting (`src/lib/security/rateLimit.ts`, 10 deneme / 5 dk).
- Her finansal/kritik mutasyon `AuditLog` koleksiyonuna yazılır (`src/lib/audit/logAction.ts`) — before/after snapshot, IP, user agent.
- Multi-tenant izolasyon: her sorgu `siteId` ile scoped; sakin rolü ayrıca kendi `daireId`'siyle sınırlı.

## Kritik İş Mantığı

- **Gecikme faizi** (`src/lib/services/faizHesaplama.ts`): `birimTutar × (gunlukFaizOraniYuzde/100) × max(0, gecikenGün − faizBaşlangıçGünSayısı)`. Her zaman *fiili tarihe göre* canlı hesaplanır — kayıttaki `durum` alanına güvenilmez.
- **Bekliyor → Gecikti geçişi** lazy-write-on-read'dir (`aidatDurumGuncelle.ts`): cron'a bağımlı değildir, her liste/dashboard sorgusundan önce çalışır.
- **Ödeme ↔ gelir-gider senkronu** (`changeAidatStatus.ts`, `changeEkOdenekBorcuStatus.ts`): "Ödendi" işaretlenince kasaya otomatik gelir kaydı işlenir; geri alınırsa ilişkili gelir kaydı ve kasa bakiyesi de geri alınır. Mongoose transaction kullanır (replica set gerektirir).
- **Aidat tutar geçmişi** (`AidatGrubu.tutarGecmisi`): tutar güncellemesi yalnızca güncelleme tarihinden sonraki dönemleri etkiler, geçmiş tahakkuklar bozulmaz.

## Testler

```bash
npm test
```

- `faizHesaplama.test.ts`, `aidatGrubu.test.ts`: saf hesaplama fonksiyonları için birim testler.
- `changeAidatStatus.integration.test.ts`: gerçek bir MongoDB replica set'ine bağlanıp transaction'lı ödeme/geri-alma akışını uçtan uca doğrular. `TEST_MONGODB_URI` ortam değişkeniyle farklı bir test veritabanı belirtilebilir (varsayılan: `konut360_test`, geliştirme veritabanından ayrı).

## Kapsam Dışı / Bilinen Sınırlamalar

- Raporlar ekranındaki Excel/PDF butonları gerçek dosya üretir (`exceljs` ve `pdfkit` ile, `src/lib/excel/generateRaporExcel.ts` ve `src/lib/pdf/generateRaporPDF.ts`); her talep audit log'a kaydedilir. PDF'lerde Türkçe karakter desteği için Next.js'in zaten içerdiği Geist fontu (`node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf`) kullanılır.
- Online tahsilat/ödeme entegrasyonu, SMS/e-posta bildirimleri ve native mobil uygulama analiz dokümanında da kapsam dışı bırakılmıştır.
- Lazy-write-on-read yaklaşımı cron'a bağımlı değildir; istenirse `app/api/cron/route.ts` + Vercel Cron ile "kullanıcı hiç giriş yapmasa da arka planda güncel görünsün" senaryosu için opsiyonel bir günlük senkron job'u eklenebilir.
- Rate limiting in-memory'dir (tek instance için yeterli); çoklu instance deploy edilirse Redis/Upstash benzeri paylaşımlı bir store'a taşınmalıdır (`src/lib/security/rateLimit.ts` arkasındaki arayüz aynı kalır).

## Proje Yapısı (özet)

```
src/
  app/(auth)/giris            Site Yöneticisi / Site Sakini girişi
  app/(sistem-admin)          Süper Admin: site listesi/oluşturma (kendi login'i ayrı)
  app/(yonetici)              Sidebar+topbar shell: dashboard, aidat, ekodenek, finans,
                               daireler, bloklar, firmalar, tanimlar, raporlar
  app/(sakin)/portal          Sakin self-servis portalı
  app/api/...                 Route handler'lar (her biri auth+permission kontrollü)
  lib/auth                    JWT, şifre, permission, session yardımcıları
  lib/services                Faiz, tahakkuk, ödeme/gelir-gider senkronu, raporlar
  lib/security                Rate limit, IP yardımcıları
  lib/audit                   Audit log yazma helper'ı
  models/                     Mongoose şemaları (registerAll.ts hepsini side-effect import eder)
  scripts/seed.ts              Demo veri / Sistem Yöneticisi bootstrap
```
