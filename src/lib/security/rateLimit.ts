interface Bucket {
  count: number;
  resetAt: number;
}

// Tek instance için yeterli, basit in-memory sliding window.
// Çoklu instance'a geçilirse bu Map'in yerine Redis/Upstash benzeri paylaşımlı bir
// store kullanılmalı; arayüz (checkRateLimit) aynı kalacağı için değişiklik izole olur.
const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}
