import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* [Header → Home]
            Keeps the application logo/name linked to the landing page. */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-950"
        >
          Family Health Vault
        </Link>

        {/* [Header → Family Navigation]
            Users can access their family list from anywhere in the app. */}
        <nav aria-label="Primary navigation">
          <Link
            href="/family"
            className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            My Families
          </Link>
        </nav>
      </div>
    </header>
  );
}