"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // [Navbar → Dashboard]
  // The home/dashboard page is the main authenticated entry point,
  // so it must NOT have a Back button.
  const isHomePage = pathname === "/home";

  // [Navbar → Back Navigation]
  // Other internal pages can use the common Back button.
  const showBackButton = pathname !== "/" && !isHomePage;

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

        {/* --------------------------------------------------------
            [Navbar → Left Side]
            Back button appears on internal pages only.
            Home page intentionally has no Back button.
            -------------------------------------------------------- */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              <span className="text-lg">←</span>
              Back
            </button>
          )}

          {/* [Navbar → Application Identity] */}
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-950"
          >
            Family Health Vault
          </Link>
        </div>

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