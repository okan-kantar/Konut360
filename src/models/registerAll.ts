/**
 * Mongoose, `populate()` ile cross-model referansları çözebilmek için ilgili
 * şemanın bir kere `mongoose.model(...)` ile kayıtlı olmasını gerektirir.
 * Bu dosya tüm modelleri side-effect olarak import eder; `connectDB()` içinden
 * çağrılır ki hangi route'un hangi modeli ilk kullandığı sıralamasına bağlı
 * "Schema hasn't been registered" hatası asla oluşmasın.
 */
import "./Site";
import "./User";
import "./Blok";
import "./Daire";
import "./AidatGrubu";
import "./TanimListesi";
import "./AidatKaydi";
import "./EkOdenek";
import "./EkOdenekBorcu";
import "./Kasa";
import "./GelirGiderKaydi";
import "./Firma";
import "./SakinGuncellemeTalebi";
import "./AuditLog";
