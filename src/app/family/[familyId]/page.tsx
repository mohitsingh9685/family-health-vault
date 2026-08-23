import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// [Family Dashboard → Invitation UI]
// Client component used only for generating invitation codes.
import { InviteCode } from "./invite-code";

type FamilyPageProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export default async function FamilyPage({
  params,
}: FamilyPageProps) {
  // [Auth.js → Family Dashboard]
  // Only authenticated users can access family information.
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { familyId } = await params;

  // [Family Dashboard → Prisma]
  // Verify that the current user belongs to this family.
  // The URL familyId is never trusted without this membership check.
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId: session.user.id,
      familyId,
    },
    select: {
      role: true,

      family: {
        select: {
          id: true,
          name: true,

          members: {
            select: {
              id: true,
              role: true,
              createdAt: true,

              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  // [Authorization → Family Dashboard]
  // Do not expose family information to non-members.
  if (!membership) {
    notFound();
  }

  const { family } = membership;

  return (
    // [Family Dashboard UI]
    // Explicit light colors prevent globals.css from hiding content.
    <section className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        {/* [Family Dashboard → Family Information] */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Family Health Vault
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {family.name}
          </h1>

          <p className="mt-2 text-slate-600">
            Your role: {membership.role}
          </p>
        </div>

        {/* [Family Dashboard → Family Members]
            Display members from the authorized Prisma query. */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Family Members
          </h2>

          <div className="mt-4 divide-y divide-slate-100">
            {family.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-medium text-slate-950">
                    {member.user.email}
                  </p>

                  <p className="text-sm text-slate-500">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* [Family Dashboard → Owner Invitation]
            The component is hidden for normal members.
            The API independently verifies OWNER authorization. */}
        <InviteCode
          familyId={family.id}
          isOwner={membership.role === "OWNER"}
        />

        {/* [Family Dashboard → Future Medical Records]
            Medical-record functionality will be implemented later.
            No medical data is stored by this placeholder. */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Medical Records
          </h2>

          <p className="mt-2 text-slate-600">
            Medical records will appear here in a later issue.
          </p>
        </section>
      </div>
    </section>
  );
}