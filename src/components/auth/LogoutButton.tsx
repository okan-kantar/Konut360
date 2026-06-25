"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton({
  loginPath = "/giris",
  className,
}: {
  loginPath?: string;
  className?: string;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(loginPath);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className ?? "text-sm font-semibold text-white/70 hover:text-white"}
    >
      Çıkış
    </button>
  );
}
