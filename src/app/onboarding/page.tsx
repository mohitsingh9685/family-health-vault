import Link from "next/link";

export default function OnboardingPage() {
  return (
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-5xl">
        {/* [Onboarding → Family Selection] */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Family setup
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Set up your Family Health Vault
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Create a new family or join an existing family using an
            invitation code.
          </p>
        </div>

        {/* [Onboarding → Family Actions] */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* [Onboarding → Create Family] */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Start a Family
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create a new family space and become its owner.
            </p>

            {/* [Onboarding → Create Family API]
                This form is handled by the existing family creation flow. */}
            <Link
              href="/onboarding/start"
              className="mt-6 inline-block w-full rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create family
            </Link>
          </div>

          {/* [Onboarding → Join Family] */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Join a Family
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Have an invitation code from a family owner? Enter it
              to join their family.
            </p>

            {/* [Onboarding → Join Family UI]
                Opens the code-based joining page. */}
            <Link
              href="/onboarding/join"
              className="mt-6 inline-block w-full rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
            >
              Enter invitation code
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}