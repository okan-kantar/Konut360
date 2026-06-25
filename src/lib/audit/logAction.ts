import { connectDB } from "@/lib/db/connect";
import AuditLog from "@/models/AuditLog";

export interface LogActionParams {
  siteId?: string | null;
  userId: string;
  rol: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({
      siteId: params.siteId ?? null,
      userId: params.userId,
      rol: params.rol,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  } catch (err) {
    // Audit log hatası asıl işlemi bloklamasın; hata konsola yazılır.
    console.error("[logAction] Audit log yazılamadı:", params.action, err);
  }
}
