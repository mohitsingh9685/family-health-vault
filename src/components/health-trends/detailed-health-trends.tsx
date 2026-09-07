import Link from "next/link";
import { Activity, Droplets, HeartPulse, Scale } from "lucide-react";

import Sidebar from "@/components/dashboard/sidebar";
import type {
  HealthTrendRange,
  HealthTrends,
} from "@/lib/dashboard/get-health-trends";

type DetailedHealthTrendsProps = {
  familyId: string;
  familyName: string;
  familyRole: "OWNER" | "MEMBER";
  memberCount: number;
  trends: HealthTrends;
};

type ChartPoint = {
  measuredAt: Date;
  value: number;
};

type ChartSeries = {
  label: string;
  color: string;
  points: ChartPoint[];
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

function chartPath(
  points: ChartPoint[],
  minimum: number,
  maximum: number,
  width = 720,
  height = 190,
) {
  if (points.length === 0) return "";

  const spread = Math.max(maximum - minimum, 1);

  if (points.length === 1) {
    const y = 14 + ((maximum - points[0].value) / spread) * (height - 28);
    return `M 16 ${y.toFixed(1)} L ${width - 16} ${y.toFixed(1)}`;
  }

  return points
    .map((point, index) => {
      const x = 16 + (index / (points.length - 1)) * (width - 32);
      const y = 14 + ((maximum - point.value) / spread) * (height - 28);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function TrendChart({
  series,
  emptyMessage,
}: {
  series: ChartSeries[];
  emptyMessage: string;
}) {
  const allPoints = series
    .flatMap((item) => item.points)
    .sort((left, right) => left.measuredAt.getTime() - right.measuredAt.getTime());

  if (allPoints.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const values = allPoints.map((point) => point.value);
  const rawMinimum = Math.min(...values);
  const rawMaximum = Math.max(...values);
  const padding = Math.max((rawMaximum - rawMinimum) * 0.12, 1);
  const minimum = rawMinimum - padding;
  const maximum = rawMaximum + padding;

  return (
    <div>
      <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600">
        {series.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </span>
        ))}
      </div>

      <svg
        viewBox="0 0 720 220"
        className="mt-4 h-56 w-full"
        role="img"
        aria-label={`${series.map((item) => item.label).join(" and ")} trend chart`}
      >
        {[30, 90, 150].map((y) => (
          <path
            key={y}
            d={`M16 ${y}H704`}
            stroke="#E2E8F0"
            strokeDasharray="5 6"
          />
        ))}
        {series.map((item) => (
          <path
            key={item.label}
            d={chartPath(item.points, minimum, maximum)}
            fill="none"
            stroke={item.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{shortDateFormatter.format(allPoints[0].measuredAt)}</span>
        <span>{shortDateFormatter.format(allPoints.at(-1)!.measuredAt)}</span>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  unit,
  count,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string;
  unit: string;
  count: number;
  icon: typeof HeartPulse;
  iconClassName: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {value}
            {value !== "--" && (
              <span className="ml-2 text-xs font-medium text-slate-500">
                {unit}
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {count} {count === 1 ? "reading" : "readings"} in this period
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconClassName}`}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

export default function DetailedHealthTrends({
  familyId,
  familyName,
  familyRole,
  memberCount,
  trends,
}: DetailedHealthTrendsProps) {
  const latestBloodPressure = trends.bloodPressure.at(-1);
  const latestWeight = trends.weight.at(-1);
  const latestBloodSugar = trends.bloodSugar.at(-1);

  const history = [
    ...trends.bloodPressure.map((measurement) => ({
      id: measurement.id,
      measuredAt: measurement.measuredAt,
      type: "Blood pressure",
      reading: `${measurement.systolic}/${measurement.diastolic} mmHg`,
    })),
    ...trends.weight.map((measurement) => ({
      id: measurement.id,
      measuredAt: measurement.measuredAt,
      type: "Weight",
      reading: `${measurement.value} kg`,
    })),
    ...trends.bloodSugar.map((measurement) => ({
      id: measurement.id,
      measuredAt: measurement.measuredAt,
      type: "Blood sugar",
      reading: `${measurement.value} mg/dL`,
    })),
  ].sort(
    (left, right) => right.measuredAt.getTime() - left.measuredAt.getTime(),
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <Sidebar
        familyId={familyId}
        familyName={familyName}
        familyRole={familyRole}
        memberCount={memberCount}
      />

      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 lg:px-9">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                {familyName}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Detailed health trends
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Only measurements recorded for your account are shown here.
              </p>
            </div>
            <Link
              href="/medical-record"
              className="rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
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
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
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
            className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
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
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                <Activity size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Measurement period</h2>
                <p className="text-sm text-slate-500">
                  Review changes without medical interpretation.
                </p>
              </div>
            </div>
            <div
              className="flex rounded-lg border border-slate-200 bg-slate-50 p-1"
              aria-label="Trend range"
            >
              {([7, 30, 90] as HealthTrendRange[]).map((range) => (
                <Link
                  key={range}
                  href={`/health-trends?familyId=${encodeURIComponent(familyId)}&range=${range}`}
                  className={`rounded-md px-4 py-2 text-xs font-semibold transition ${
                    trends.rangeDays === range
                      ? "bg-white text-teal-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {range} days
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-3">
            <SummaryCard
              title="Blood pressure"
              value={
                latestBloodPressure
                  ? `${latestBloodPressure.systolic}/${latestBloodPressure.diastolic}`
                  : "--"
              }
              unit="mmHg"
              count={trends.bloodPressure.length}
              icon={HeartPulse}
              iconClassName="bg-rose-50 text-rose-600"
            />
            <SummaryCard
              title="Weight"
              value={latestWeight ? String(latestWeight.value) : "--"}
              unit="kg"
              count={trends.weight.length}
              icon={Scale}
              iconClassName="bg-slate-100 text-slate-600"
            />
            <SummaryCard
              title="Blood sugar"
              value={latestBloodSugar ? String(latestBloodSugar.value) : "--"}
              unit="mg/dL"
              count={trends.bloodSugar.length}
              icon={Droplets}
              iconClassName="bg-sky-50 text-sky-600"
            />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Blood pressure</h2>
              <p className="mt-1 text-sm text-slate-500">
                Systolic and diastolic readings over time.
              </p>
              <div className="mt-5">
                <TrendChart
                  emptyMessage="No blood-pressure readings in this period"
                  series={[
                    {
                      label: "Systolic",
                      color: "#0F766E",
                      points: trends.bloodPressure.map((measurement) => ({
                        measuredAt: measurement.measuredAt,
                        value: measurement.systolic,
                      })),
                    },
                    {
                      label: "Diastolic",
                      color: "#38BDF8",
                      points: trends.bloodPressure.map((measurement) => ({
                        measuredAt: measurement.measuredAt,
                        value: measurement.diastolic,
                      })),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Weight</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recorded weight measurements over time.
              </p>
              <div className="mt-5">
                <TrendChart
                  emptyMessage="No weight readings in this period"
                  series={[
                    {
                      label: "Weight",
                      color: "#64748B",
                      points: trends.weight.map((measurement) => ({
                        measuredAt: measurement.measuredAt,
                        value: measurement.value,
                      })),
                    },
                  ]}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <h2 className="text-lg font-semibold text-slate-950">Blood sugar</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recorded blood-sugar measurements over time.
              </p>
              <div className="mt-5">
                <TrendChart
                  emptyMessage="No blood-sugar readings in this period"
                  series={[
                    {
                      label: "Blood sugar",
                      color: "#0EA5E9",
                      points: trends.bloodSugar.map((measurement) => ({
                        measuredAt: measurement.measuredAt,
                        value: measurement.value,
                      })),
                    },
                  ]}
                />
              </div>
            </section>
          </div>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Measurement history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Dated readings included in the selected period.
              </p>
            </div>

            {history.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No measurements were recorded in this period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Measurement</th>
                      <th className="px-6 py-3 font-semibold">Reading</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((measurement) => (
                      <tr key={measurement.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                          {dateFormatter.format(measurement.measuredAt)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {measurement.type}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {measurement.reading}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
