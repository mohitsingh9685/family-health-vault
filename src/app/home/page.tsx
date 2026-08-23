import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import Sidebar from "@/components/dashboard/sidebar";
import FamilyMembers from "@/components/dashboard/family-members";

export default async function HomePage({
  searchParams,
}: {
  // [URL → Home]
  // Next.js provides query parameters asynchronously.
  searchParams: Promise<{
    familyId?: string;
  }>;
}) {
  // ------------------------------------------------------------
  // [Auth.js → Home]
  // Only authenticated users can access the dashboard.
  // ------------------------------------------------------------
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  // ------------------------------------------------------------
  // [Family Switcher → Home]
  //
  // /family sends the selected family as:
  //
  // /home?familyId=<family-id>
  //
  // The value is NOT trusted by itself.
  // We verify membership against PostgreSQL below.
  // ------------------------------------------------------------
  const { familyId } = await searchParams;

  // ------------------------------------------------------------
  // [Home → Family Authorization]
  //
  // If familyId exists:
  //   Find that exact family membership.
  //
  // If familyId does not exist:
  //   Find the user's first family.
  //
  // This means a user can NEVER access another family's
  // dashboard simply by changing the URL.
  // ------------------------------------------------------------
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,

      ...(familyId
        ? {
            familyId,
          }
        : {}),
    },

    include: {
      family: true,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  // ------------------------------------------------------------
  // [Home → Family Setup]
  //
  // If the user has no family at all, send them to the
  // family selection/setup flow.
  //
  // If familyId was invalid or the user is not a member of
  // that family, membership will also be null.
  // ------------------------------------------------------------
  if (!membership) {
    const firstMembership = await prisma.familyMember.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!firstMembership) {
      redirect("/onboarding");
    }

    // The requested family exists but the user does not belong
    // to it. Redirect to the user's valid default family.
    redirect(`/home?familyId=${firstMembership.familyId}`);
  }

  // ------------------------------------------------------------
  // [Family → Family Members]
  //
  // IMPORTANT:
  // We query using familyId, NOT userId.
  //
  // Therefore every member of the same family sees the same
  // family members on their dashboard.
  // ------------------------------------------------------------
  const familyMembers = await prisma.familyMember.findMany({
    where: {
      familyId: membership.familyId,
    },

    include: {
      user: true,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  // ------------------------------------------------------------
  // [Auth.js → Dashboard Greeting]
  //
  // Profile name will eventually come from the user's profile
  // information. Until then, use the email username as fallback.
  // ------------------------------------------------------------
  const currentUserName =
    session.user.name ||
    session.user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* --------------------------------------------------------
          [Dashboard → Sidebar]

          Sidebar navigation is shared across the dashboard.
          -------------------------------------------------------- */}
      <Sidebar userName={currentUserName} />

      {/* --------------------------------------------------------
          [Dashboard → Main Workspace]
          -------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-8 py-10">

          {/* [Dashboard → Greeting] */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Good morning, {currentUserName} 👋
            </h1>

            <p className="mt-2 text-slate-500">
              Here&apos;s what&apos;s happening with your family.
            </p>
          </div>

          {/* ------------------------------------------------------
              [Dashboard → Current Family]

              This section now changes automatically when the
              user switches families from /family.
              ------------------------------------------------------ */}
          <div className="mb-7 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border bg-white p-7 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Your Family
              </p>

              <h2 className="mt-3 text-2xl font-bold text-slate-950">
                {membership.family.name}
              </h2>

              <p className="mt-2 text-slate-500">
                {familyMembers.length}{" "}
                {familyMembers.length === 1 ? "member" : "members"}
              </p>

              {/* [Dashboard → Family Switcher] */}
              <a
                href="/family"
                className="mt-6 inline-flex rounded-xl bg-teal-50 px-5 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-100"
              >
                Switch Family →
              </a>
            </section>

            {/* [Dashboard → Family Invitation]
                Existing invitation functionality can continue
                using the current family membership. */}
            <section className="rounded-2xl border bg-white p-7 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">
                Invite Family Members
              </h2>

              <p className="mt-2 max-w-md text-slate-500">
                Invite your loved ones to manage health records
                together.
              </p>

            <a
  href={`/family/${membership.familyId}`}
  className="mt-6 inline-flex rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
>
                Invite Members
              </a>
            </section>
          </div>

          {/* ------------------------------------------------------
              [Dashboard → Family Members]

              These are members of the CURRENTLY SELECTED family.
              ------------------------------------------------------ */}
          <FamilyMembers
            members={familyMembers.map((member) => ({
              id: member.id,

              name:
                member.user.email === session.user?.email
                  ? currentUserName
                  : member.user.email.split("@")[0],

              email: member.user.email,

              role: member.role,

              isCurrentUser: member.userId === userId,
            }))}
          />
        </div>
      </main>
    </div>
  );
}