import Link from "next/link";

import type {
  HealthTrendRange,
  HealthTrends,
} from "@/lib/dashboard/get-health-trends";

type DashboardHealthTrendsProps = {
  familyId: string;
  trends: HealthTrends;
  latestVitals: {
    bloodPressure: string;
    weight: string;
    sugar: string;
  };
};

function createSparklinePath(
  values: number[],
  width = 180,
  height = 44,
) {
  if (values.length === 0) return "";
  if (values.length === 1) {
    return `M 4 ${height / 2} L ${width - 4} ${height / 2}`;
  }

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = Math.max(maximum - minimum, 1);

  return values
    .map((value, index) => {
      const x = 4 + (index / (values.length - 1)) * (width - 8);
      const y =
        4 + ((maximum - value) / spread) * (height - 8);

      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function ReadingCount({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      {count} {count === 1 ? "reading" : "readings"}
    </span>
  );
}

function EmptyTrend() {
  return (
    <div className="flex h-14 items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
      No measurements in this period
    </div>
  );
}

export default function DashboardHealthTrends({
  familyId,
  trends,
  latestVitals,
}: DashboardHealthTrendsProps) {
  const systolic = trends.bloodPressure.map(
    (measurement) => measurement.systolic,
  );
  const diastolic = trends.bloodPressure.map(
    (measurement) => measurement.diastolic,
  );
  const weights = trends.weight.map((measurement) => measurement.value);
  const sugars = trends.bloodSugar.map(
    (measurement) => measurement.value,
  );

  return (
    <section
      id="health-trends"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Health trends
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your measurements from the last {trends.rangeDays} days.
          </p>
        </div>

        <div
          className="flex rounded-lg border border-slate-200 bg-slate-50 p-1"
          aria-label="Trend range"
        >
          {([7, 30, 90] as HealthTrendRange[]).map((range) => (
            <Link
              key={range}
              href={`/home?familyId=${encodeURIComponent(familyId)}&range=${range}#health-trends`}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                trends.rangeDays === range
                  ? "bg-white text-teal-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {range}d
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Blood pressure
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-950">
                {latestVitals.bloodPressure}
              </span>
              <span className="ml-2 text-xs text-slate-500">mmHg</span>
            </div>
            <ReadingCount count={trends.bloodPressure.length} />
          </div>

          <div className="mt-4">
            {systolic.length > 0 ? (
              <svg
                viewBox="0 0 180 54"
                className="h-14 w-full"
                role="img"
                aria-label="Blood-pressure trend"
              >
                <path d="M4 18H176M4 40H176" stroke="#E2E8F0" />
                <path
                  d={createSparklinePath(systolic, 180, 38)}
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={createSparklinePath(diastolic, 180, 38)}
                  transform="translate(0 14)"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <EmptyTrend />
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weight
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-950">
                {latestVitals.weight}
              </span>
              <span className="ml-2 text-xs text-slate-500">kg</span>
            </div>
            <ReadingCount count={trends.weight.length} />
          </div>

          <div className="mt-4">
            {weights.length > 0 ? (
              <svg
                viewBox="0 0 180 54"
                className="h-14 w-full"
                role="img"
                aria-label="Weight trend"
              >
                <path d="M4 18H176M4 40H176" stroke="#E2E8F0" />
                <path
                  d={createSparklinePath(weights, 180, 50)}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <EmptyTrend />
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Blood sugar
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <span className="text-2xl font-bold text-slate-950">
                {latestVitals.sugar}
              </span>
              <span className="ml-2 text-xs text-slate-500">mg/dL</span>
            </div>
            <ReadingCount count={trends.bloodSugar.length} />
          </div>

          <div className="mt-4">
            {sugars.length > 0 ? (
              <svg
                viewBox="0 0 180 54"
                className="h-14 w-full"
                role="img"
                aria-label="Blood-sugar trend"
              >
                <rect
                  x="4"
                  y="14"
                  width="172"
                  height="28"
                  rx="7"
                  fill="#DCFCE7"
                  opacity="0.65"
                />
                <path
                  d={createSparklinePath(sugars, 180, 50)}
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <EmptyTrend />
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
