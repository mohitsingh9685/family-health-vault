import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function FamilyListPage() {
  // [Auth.js → Family List]
  // Only authenticated users can access their family list.
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // [Family List → Prisma]
  // A user can belong to multiple families, so fetch all memberships.
  const memberships = await prisma.familyMember.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      role: true,
      family: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // [Family List → Onboarding]
  // If the user has no family yet, send them to family setup.
  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  return (
    // [Family List UI]
    // Explicit light colors prevent global styles from hiding the content.
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        {/* [Family List → Header] */}
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Your families
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Choose a family
        </h1>

        <p className="mt-2 text-slate-600">
          Select the family health vault you want to open.
        </p>

        {/* [Family List → Family Dashboard]
            Each family opens through its authorized family route. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => (
            <Link
              key={membership.family.id}
              href={`/family/${membership.family.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-slate-950">
                {membership.family.name}
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Role: {membership.role}
              </p>

              <span className="mt-5 inline-block text-sm font-semibold text-teal-700">
                Open family →
              </span>
            </Link>
          ))}
        </div>

        {/* [Family List → Onboarding]
            Users can create or join another family because the
            application supports multiple family memberships. */}
        <Link
          href="/onboarding"
          className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Create or join another family
        </Link>
      </div>
    </section>
  );
}