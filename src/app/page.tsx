import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* [Homepage → Hero]
          Main introduction and primary action. */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">

          {/* Product label */}
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">
            Family Health Vault
          </p>

          {/* Main heading */}
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            One organized place for your family&apos;s health records.
          </h1>

          {/* Supporting description */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Store, organize, and securely access important health
            information for your family — all in one place.
          </p>

          {/* [Homepage → Primary CTA]
              Authentication options already exist in the header,
              so the hero only needs one primary action. */}
          <div className="mt-9">
            <Link
              href="/signup"
              className="inline-flex rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>

        {/* [Homepage → Product Benefits] */}
        <div className="mt-20 grid gap-5 md:grid-cols-3">

          {/* Organized records */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">
              01
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              Organized records
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep important family health information organized
              instead of searching through scattered documents.
            </p>
          </div>

          {/* Family access */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">
              02
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              Family access
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Keep your family connected to the same health vault
              with controlled access.
            </p>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">
              03
            </div>

            <h2 className="mt-5 text-lg font-semibold">
              Security by design
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Authentication, authorization, and secure data
              handling are considered from the beginning.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}