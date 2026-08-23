import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function FamilyListPage() {
  // [Auth.js → Family List]
  // Only authenticated users can access their family list.
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  // [Family List → Prisma]
  // A user can belong to multiple families, so fetch all
  // memberships belonging to the authenticated user.
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
  // If the user does not belong to any family yet,
  // send them to the family setup flow.
  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  return (
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-4xl">
        {/* [Family List → Header] */}
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
          Your families
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Choose a family
        </h1>

        <p className="mt-2 text-slate-600">
          Select the family health vault you want to open.
        </p>

        {/* ----------------------------------------------------------
            [Family Switcher → Home Dashboard]

            A family is NOT opened as a separate dashboard anymore.

            Clicking a family sends the user to:
              /home?familyId=<family-id>

            The /home page then loads that selected family's data.
            ---------------------------------------------------------- */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {memberships.map((membership) => (
            <Link
              key={membership.family.id}
              href={`/home?familyId=${membership.family.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              {/* [Family Switcher → Family Name] */}
              <h2 className="text-xl font-semibold text-slate-950">
                {membership.family.name}
              </h2>

              {/* [Family Switcher → User Role] */}
              <p className="mt-2 text-sm text-slate-600">
                Role: {membership.role}
              </p>

              {/* [Family Switcher → Action] */}
              <span className="mt-5 inline-block text-sm font-semibold text-teal-700">
                Switch to family →
              </span>
            </Link>
          ))}
        </div>

        {/* [Family List → Onboarding]
            Users can create or join another family. */}
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