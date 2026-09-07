"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  if (
    pathname === "/home" ||
    pathname === "/health-trends" ||
    pathname === "/medical-record" ||
    pathname === "/appointments" ||
    pathname === "/settings" ||
    pathname.startsWith("/family/")
  ) {
    return null;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* [Navbar → Application Identity] */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-950"
        >
          Family Health Vault
        </Link>

      </div>
    </header>
  );
}