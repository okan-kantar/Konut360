export type Role = "sistem_admin" | "site_yoneticisi" | "muhasebe" | "site_sakini";

export type Permission =
  | "site:manage"
  | "tanim:manage"
  | "daire:manage"
  | "aidat:manage"
  | "aidat:tahsilat"
  | "finans:manage"
  | "firma:manage"
  | "rapor:view"
  | "sakin:self";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  sistem_admin: ["site:manage"],
  site_yoneticisi: [
    "tanim:manage",
    "daire:manage",
    "aidat:manage",
    "finans:manage",
    "firma:manage",
    "rapor:view",
  ],
  // Dokümanda opsiyonel işaretli rol: kasa/gelir-gider/tahsilat ile sınırlı.
  // Bu fazda dedike bir login/ekran yok, ama yetki seti hazır.
  muhasebe: ["aidat:tahsilat", "finans:manage"],
  site_sakini: ["sakin:self"],
};

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

export const ROLE_HOME_PATH: Record<Role, string> = {
  sistem_admin: "/sistem-admin",
  site_yoneticisi: "/dashboard",
  muhasebe: "/dashboard",
  site_sakini: "/portal",
};
