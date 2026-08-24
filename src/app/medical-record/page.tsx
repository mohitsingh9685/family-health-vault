import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import Sidebar from "@/components/dashboard/sidebar";
import MedicalRecordPage from "@/components/medical-record/medical-record-page";

export default async function MedicalRecordRoute() {
  // [Auth.js → Medical Records]
  // Only authenticated users can access medical records.
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  // [Auth.js → Prisma]
  // Find the user's current/default family.
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
    },
    include: {
      family: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    redirect("/onboarding");
  }

  const currentUserName =
    session.user.name ||
    session.user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* [Dashboard → Sidebar] */}
      <Sidebar
        userName={currentUserName}
        familyId={membership.familyId}
      />

      {/* [Medical Records → Main Workspace] */}
      <main className="flex-1 overflow-y-auto">
        <MedicalRecordPage
          familyId={membership.familyId}
          familyName={membership.family.name}
          userName={currentUserName}
        />
      </main>
    </div>
  );
}