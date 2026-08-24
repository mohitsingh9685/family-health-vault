type RecentMedicalRecordCardProps = {
  title: string;
  type: string;
  userName: string;
  createdAt: string;
  recordId: string;
};


export default function RecentMedicalRecordCard({
  title,
  type,
  userName,
  createdAt,
  recordId,
}: RecentMedicalRecordCardProps) {


 return (
  <div className="flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">

    {/* Medical Record Information */}
    <div className="flex items-start gap-4">

      {/* Document Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-xl">
        📄
      </div>


      <div>

        <h3 className="font-semibold text-slate-900">
          {title}
        </h3>


        <p className="mt-1 text-sm text-slate-500">
          {type.replaceAll("_", " ")}
        </p>


        <p className="mt-1 text-sm text-slate-500">
          Uploaded by {userName}
        </p>


        <p className="mt-1 text-xs text-slate-400">
          {createdAt}
        </p>

      </div>

    </div>



    {/* Medical Record Action */}
    <a
      href={`/api/medical-records/${recordId}/view`}
      target="_blank"
      className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
    >
      Open PDF
    </a>


  </div>
);
}