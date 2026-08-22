export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-teal-700">
          FAMILY HEALTH VAULT
        </p>

        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
          One organized place for your family’s health records.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Family Health Vault will help families store, understand, and securely
          access important health information when it matters.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Building carefully</h2>
          <p className="mt-2 text-slate-600">
            We’ll add authentication, permissions, encryption, and health-record
            features step by step—before any real medical data is stored.
          </p>
        </div>
      </div>
    </main>
  );
}