type FamilyMemberSummaryProps = {
  name: string;
  role: string;

  bloodPressure?: string;
  weight?: string;
  sugar?: string;
  oxygen?: string;

  onClick?: () => void;
};


export default function FamilyMemberSummary({
  name,
  role,
  bloodPressure = "--",
  weight = "--",
  sugar = "--",
  oxygen = "--",
  onClick,
}: FamilyMemberSummaryProps) {

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
    >

      {/* Dashboard → Family Member Header */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="font-semibold text-slate-900">
            {name}
          </h3>

          <p className="text-sm text-slate-500">
            {role}
          </p>
        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
          {name.charAt(0).toUpperCase()}
        </div>

      </div>


      {/* Dashboard → Member Latest Health */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">


        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">
            BP
          </p>

          <p className="font-semibold text-slate-900">
            {bloodPressure}
          </p>
        </div>


        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">
            Weight
          </p>

          <p className="font-semibold text-slate-900">
            {weight}
          </p>
        </div>


        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">
            Sugar
          </p>

          <p className="font-semibold text-slate-900">
            {sugar}
          </p>
        </div>


        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-slate-500">
            SpO2
          </p>

          <p className="font-semibold text-slate-900">
            {oxygen}
          </p>
        </div>


      </div>

    </button>
  );
}