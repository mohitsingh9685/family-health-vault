type FamilyMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  isCurrentUser: boolean;
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
            className="flex items-center gap-4 py-4"
          >
            {/* Simple avatar based on the member's name. */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">
                  {member.name}
                </p>

                {member.isCurrentUser && (
                  <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
                    You
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-500">
                {member.email}
              </p>
            </div>

            <span className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {member.role}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}