"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export function SiteHeader() {
  const pathname = usePathname();

  // [Navbar → Dashboard]
  // Logout remains available on the authenticated dashboard.
  const isHomePage = pathname === "/home";

  async function handleLogout() {
    // [Navbar → Auth.js]
    // Auth.js clears the authenticated session and returns the user
    // to the public landing page.
    await signOut({
      callbackUrl: "/",
    });
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

        {/* --------------------------------------------------------
            [Navbar → Dashboard]
            Logout is intentionally placed at the top-right
            of the authenticated home page.
            -------------------------------------------------------- */}
        {isHomePage && (
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}