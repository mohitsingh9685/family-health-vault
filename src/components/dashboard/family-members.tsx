type FamilyMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  isCurrentUser: boolean;

  // Dashboard → Latest health snapshot
  vitals: {
    bloodPressure: string;
    weight: string;
    sugar: string;
    spo2: string;
  };
};

type FamilyMembersProps = {
  members: FamilyMember[];
};

export default function FamilyMembers({
  members,
}: FamilyMembersProps) {
  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* FamilyMember records come from the selected Family in PostgreSQL. */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Family Members
        </h2>

        <span className="cursor-pointer text-sm font-medium text-teal-700">
          View all
        </span>
      </div>

      <div className="divide-y">
        {members.map((member) => (
         <div
  key={member.id}
  className="py-5"
>
  <div className="flex items-center gap-4">

    {/* Family member avatar */}
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
      {member.name.charAt(0).toUpperCase()}
    </div>


    <div className="flex-1">

      <div className="flex items-center gap-2">

        <p className="font-medium text-slate-900">
          {member.name}
        </p>

        {member.isCurrentUser && (
          <span className="rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700">
            You
          </span>
        )}

      </div>


      <p className="text-sm text-slate-500">
        {member.email}
      </p>

    </div>


    <div className="flex flex-col items-end gap-2">

  <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium">
    {member.role}
  </span>


  {/* Dashboard → Member Details Navigation */}
 {/* Dashboard → Member Details Navigation */}
<a
  href={`/family/member/${member.id}`}
  className="text-xs font-medium text-teal-700 hover:text-teal-900"
>
  View Details →
</a>

</div>

  </div>


  {/* Dashboard → Member latest vitals */}
  <div className="mt-4 grid grid-cols-4 gap-3">

    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        BP
      </p>
      <p className="font-semibold">
        {member.vitals.bloodPressure}
      </p>
    </div>


    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        Weight
      </p>
      <p className="font-semibold">
        {member.vitals.weight}
      </p>
    </div>


    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        Sugar
      </p>
      <p className="font-semibold">
        {member.vitals.sugar}
      </p>
    </div>


    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        SpO₂
      </p>
      <p className="font-semibold">
        {member.vitals.spo2}
      </p>
    </div>

  </div>

</div>
        ))}
      </div>
    </section>
  );
}