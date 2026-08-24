type VitalCardProps = {
  title: string;
  value: string;
  unit?: string;
  icon?: string;
};


export default function VitalCard({
  title,
  value,
  unit,
  icon,
}: VitalCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">

      {/* Dashboard → Health Metric Card */}
      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <span className="text-xl">
          {icon}
        </span>

      </div>


      <div className="mt-4">

        <p className="text-3xl font-bold text-slate-900">
          {value}
        </p>


        {unit && (
          <p className="mt-1 text-sm text-slate-500">
            {unit}
          </p>
        )}

      </div>

    </div>
  );
}