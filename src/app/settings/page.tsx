import Link from "next/link";
import { redirect } from "next/navigation";
import { FileLock2, UsersRound } from "lucide-react";

import { auth } from "@/auth";
import AccountSettings from "@/components/settings/account-settings";
import ProfileSettingsForm from "@/components/settings/profile-settings-form";
import SecuritySettingsForm from "@/components/settings/security-settings-form";
import SettingsNavigation, {
  type SettingsSection,
} from "@/components/settings/settings-navigation";
import { prisma } from "@/lib/prisma";

const validSections: SettingsSection[] = [
  "profile",
  "security",
  "privacy",
  "account",
];

const sectionHeadings: Record<
  SettingsSection,
  { title: string; description: string }
> = {
  profile: {
    title: "Profile",
    description: "Manage the personal details shown across your vault.",
  },
  security: {
    title: "Security",
    description: "Protect your account and manage this session.",
  },
  privacy: {
    title: "Privacy & sharing",
    description: "Understand which families can access shared health data.",
  },
  account: {
    title: "Account",
    description: "Review account information and account-level actions.",
  },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    section?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { section } = await searchParams;
  const activeSection: SettingsSection = validSections.includes(
    section as SettingsSection,
  )
    ? (section as SettingsSection)
    : "profile";

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
      createdAt: true,
      profile: {
        select: {
          name: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
        },
      },
      familyMemberships: {
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
      },
    },
  });

  if (!user) {
    redirect("/signin");
  }

  const heading = sectionHeadings[activeSection];
  const ownedFamilies = user.familyMemberships
    .filter((membership) => membership.role === "OWNER")
    .map((membership) => membership.family);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Account preferences
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Settings
          </h1>
          <p className="mt-2 text-slate-500">
            Manage your profile, security, sharing, and account.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:self-start">
            <SettingsNavigation activeSection={activeSection} />
          </aside>

          <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-950">
                {heading.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {heading.description}
              </p>
            </div>

            {activeSection === "profile" && (
              <ProfileSettingsForm
                email={user.email}
                initialValues={{
                  name: user.profile?.name ?? "",
                  dateOfBirth:
                    user.profile?.dateOfBirth
                      ?.toISOString()
                      .slice(0, 10) ?? "",
                  gender: user.profile?.gender ?? "",
                  phone: user.profile?.phone ?? "",
                }}
              />
            )}

            {activeSection === "security" && (
              <SecuritySettingsForm />
            )}

            {activeSection === "privacy" && (
              <section>
                <div className="border-b border-slate-200 pb-5">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Family access
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your records remain private unless you explicitly share
                    them with a family.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {user.familyMemberships.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
                      <UsersRound
                        className="mx-auto text-slate-400"
                        size={28}
                        aria-hidden="true"
                      />
                      <p className="mt-3 font-medium text-slate-800">
                        No family memberships
                      </p>
                      <Link
                        href="/family"
                        className="mt-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Start or join a family →
                      </Link>
                    </div>
                  ) : (
                    user.familyMemberships.map((membership) => (
                      <div
                        key={membership.family.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {membership.family.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {membership.role === "OWNER"
                              ? "You manage this family"
                              : "Family member"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                            {membership.role === "OWNER"
                              ? "Owner"
                              : "Member"}
                          </span>
                          <Link
                            href={`/family/${membership.family.id}`}
                            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex gap-3">
                    <FileLock2
                      className="mt-0.5 shrink-0 text-teal-700"
                      size={21}
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Explicit sharing only
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Medical records and health measurements are visible
                        to another family only when you grant that family
                        access. You remain the owner of your data.
                      </p>
                      <Link
                        href="/medical-record"
                        className="mt-3 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
                      >
                        Review medical records →
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeSection === "account" && (
              <AccountSettings
                email={user.email}
                memberSince={new Intl.DateTimeFormat("en-IN", {
                  dateStyle: "long",
                }).format(user.createdAt)}
                ownedFamilies={ownedFamilies}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
