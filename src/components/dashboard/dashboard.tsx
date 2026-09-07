import Link from "next/link";
import {
  Activity,
  CalendarDays,
  Droplets,
  FileText,
  HeartPulse,
  Scale,
  Wind,
} from "lucide-react";

import DashboardHealthTrends from "@/components/dashboard/dashboard-health-trends";
import Sidebar from "@/components/dashboard/sidebar";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  type getUpcomingAppointments,
} from "@/lib/appointments";
import type { getFamilyOverview } from "@/lib/dashboard/get-family-overview";
import type { HealthTrends } from "@/lib/dashboard/get-health-trends";

type FamilyOverview = Awaited<ReturnType<typeof getFamilyOverview>>;
type UpcomingAppointments = Awaited<
  ReturnType<typeof getUpcomingAppointments>
>;

type RecentRecord = {
  id: string;
  title: string;
  type: string;
  createdAt: Date;
  user: {
    email: string;
    profile: {
      name: string;
    } | null;
  };
};

type DashboardProps = {
  familyId: string;
  familyName: string;
  familyRole: "OWNER" | "MEMBER";
  userName: string;
  latestVitals: {
    bloodPressure: string;
    weight: string;
    sugar: string;
    spo2: string;
  };
  familyOverview: FamilyOverview;
  trends: HealthTrends;
  upcomingAppointments: UpcomingAppointments;
  recentMedicalRecords: RecentRecord[];
};

function relativeUpdateLabel(date: Date | null) {
  if (!date) return "No shared data";

  const elapsedDays = Math.floor(
    (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (elapsedDays <= 0) return "Today";
  if (elapsedDays === 1) return "Yesterday";
  if (elapsedDays < 7) return `${elapsedDays} days ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function changeLabel(values: number[]) {
  if (values.length < 2) return "Latest reading";

  const difference = values.at(-1)! - values.at(-2)!;

  if (Math.abs(difference) < 0.01) return "No change";

  return `${difference > 0 ? "↑" : "↓"} ${Math.abs(difference).toFixed(1)} from previous`;
}

export default function Dashboard({
  familyId,
  familyName,
  familyRole,
  userName,
  latestVitals,
  familyOverview,
  trends,
  upcomingAppointments,
  recentMedicalRecords,
}: DashboardProps) {
  const latestBloodPressures = trends.bloodPressure.slice(-2);
  const bloodPressureNotice =
    latestBloodPressures.length === 2
      ? {
          title: "Latest blood pressure changed",
          detail: `${latestBloodPressures[0].systolic}/${latestBloodPressures[0].diastolic} → ${latestBloodPressures[1].systolic}/${latestBloodPressures[1].diastolic} mmHg`,
          href: `#health-trends`,
        }
      : null;
  const nextAppointment = upcomingAppointments[0];
  const notice = bloodPressureNotice ??
    (nextAppointment
      ? {
          title: "Next family appointment",
          detail: `${nextAppointment.hospitalName} · ${formatAppointmentDate(nextAppointment.appointmentDate, nextAppointment.timeZone)}`,
          href: `/appointments?familyId=${encodeURIComponent(familyId)}`,
        }
      : {
          title: "No dashboard actions pending",
          detail: "Add a measurement or appointment when something changes.",
          href: "/medical-record",
        });

  const vitalCards = [
    {
      title: "Blood pressure",
      value: latestVitals.bloodPressure,
      unit: "mmHg",
      note:
        trends.bloodPressure.length >= 2
          ? `${latestBloodPressures.length} recent readings`
          : "Latest reading",
      icon: HeartPulse,
      color: "text-rose-600",
      background: "bg-rose-50",
    },
    {
      title: "Weight",
      value: latestVitals.weight,
      unit: "kg",
      note: changeLabel(
        trends.weight.map((measurement) => measurement.value),
      ),
      icon: Scale,
      color: "text-slate-600",
      background: "bg-slate-100",
    },
    {
      title: "Blood sugar",
      value: latestVitals.sugar,
      unit: "mg/dL",
      note: changeLabel(
        trends.bloodSugar.map((measurement) => measurement.value),
      ),
      icon: Droplets,
      color: "text-sky-600",
      background: "bg-sky-50",
    },
    {
      title: "Oxygen saturation",
      value: latestVitals.spo2,
      unit: "%",
      note: "Latest reading",
      icon: Wind,
      color: "text-teal-700",
      background: "bg-teal-50",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <Sidebar
        familyId={familyId}
        familyName={familyName}
        familyRole={familyRole}
        memberCount={familyOverview.length}
      />

      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {new Intl.DateTimeFormat("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(new Date())}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
              Good to see you, {userName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/medical-record"
              className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
            >
              + Add health data
            </Link>
          </div>
        </header>

        <nav
          aria-label="Dashboard navigation"
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
        >
          <Link
            href={`/home?familyId=${encodeURIComponent(familyId)}`}
            className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
          >
            Overview
          </Link>
          <Link
            href={`/family/${familyId}`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Family
          </Link>
          <Link
            href="/medical-record"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Records
          </Link>
          <Link
            href={`/appointments?familyId=${encodeURIComponent(familyId)}`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Appointments
          </Link>
          <Link
            href={`/health-trends?familyId=${encodeURIComponent(familyId)}&range=${trends.rangeDays}`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Trends
          </Link>
          <Link
            href="/settings"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
          >
            Settings
          </Link>
        </nav>

        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-7">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-800 p-6 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">
                Family health summary
              </p>
              <div className="mt-2 flex items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {familyName} overview
                  </h2>
                  <p className="mt-2 text-sm text-teal-100">
                    {familyOverview.length}{" "}
                    {familyOverview.length === 1 ? "member" : "members"} ·{" "}
                    {upcomingAppointments.length}{" "}
                    {upcomingAppointments.length === 1
                      ? "upcoming appointment"
                      : "upcoming appointments"}{" "}
                    · {recentMedicalRecords.length} recent records
                  </p>
                </div>
                <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 md:flex">
                  <Activity size={34} aria-hidden="true" />
                </div>
              </div>
            </section>

            <Link
              href={notice.href}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-6 transition hover:border-amber-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Dashboard notice
              </p>
              <h2 className="mt-2 font-semibold text-slate-950">
                {notice.title}
              </h2>
              <p className="mt-2 text-sm text-amber-800">
                {notice.detail} <span aria-hidden="true">›</span>
              </p>
            </Link>
          </div>

          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">
                Your latest vitals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Most recent measurements recorded for your account.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {vitalCards.map((vital) => {
                const Icon = vital.icon;

                return (
                  <article
                    key={vital.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          {vital.title}
                        </p>
                        <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                          {vital.value}
                          {vital.value !== "--" && (
                            <span className="ml-2 text-xs font-medium text-slate-500">
                              {vital.unit}
                            </span>
                          )}
                        </p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${vital.background} ${vital.color}`}
                      >
                        <Icon size={20} aria-hidden="true" />
                      </div>
                    </div>
                    <p className="mt-4 text-xs font-medium text-slate-500">
                      {vital.note}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <DashboardHealthTrends
              familyId={familyId}
              trends={trends}
              latestVitals={latestVitals}
            />

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Upcoming appointments
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Your family&apos;s next visits.
                  </p>
                </div>
                <Link
                  href={`/appointments?familyId=${encodeURIComponent(familyId)}`}
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {upcomingAppointments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <CalendarDays
                      className="mx-auto text-slate-400"
                      size={26}
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No upcoming appointments
                    </p>
                  </div>
                ) : (
                  upcomingAppointments.map((appointment) => {
                    const patientName =
                      appointment.patient.profile?.name ||
                      appointment.patient.email.split("@")[0];

                    return (
                      <article
                        key={appointment.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                            <span className="text-[9px] font-bold uppercase">
                              {new Intl.DateTimeFormat("en-IN", {
                                month: "short",
                                timeZone: appointment.timeZone,
                              }).format(appointment.appointmentDate)}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {new Intl.DateTimeFormat("en-IN", {
                                day: "numeric",
                                timeZone: appointment.timeZone,
                              }).format(appointment.appointmentDate)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-900">
                              {appointment.hospitalName}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {patientName}
                              {appointment.doctorName
                                ? ` · ${appointment.doctorName}`
                                : ""}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-teal-700">
                              {formatAppointmentTime(
                                appointment.appointmentDate,
                                appointment.timeZone,
                              )}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Family health overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest data shared with {familyName}.
                  </p>
                </div>
                <Link
                  href={`/family/${familyId}`}
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  Open family
                </Link>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {familyOverview.map((member) => (
                  <div
                    key={member.id}
                    className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          BP {member.vitals.bloodPressure} · Weight{" "}
                          {member.vitals.weight} · SpO₂ {member.vitals.spo2}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        member.lastUpdatedAt
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {member.lastUpdatedAt ? "Data available" : "No shared data"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {relativeUpdateLabel(member.lastUpdatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Recent records
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest authorized documents.
                  </p>
                </div>
                <Link
                  href="/medical-record"
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {recentMedicalRecords.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <FileText
                      className="mx-auto text-slate-400"
                      size={26}
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No medical records yet
                    </p>
                  </div>
                ) : (
                  recentMedicalRecords.slice(0, 3).map((record) => (
                    <a
                      key={record.id}
                      href={`/api/medical-records/${record.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 transition hover:bg-slate-100"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                        <FileText size={17} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {record.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {record.user.profile?.name ||
                            record.user.email.split("@")[0]}{" "}
                          · {record.type.replaceAll("_", " ")} ·{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "numeric",
                            month: "short",
                          }).format(record.createdAt)}
                        </p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
