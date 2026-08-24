"use client";

type ViewMedicalRecordProps = {
  recordId: string;
};

export default function ViewMedicalRecord({
  recordId,
}: ViewMedicalRecordProps) {
  async function handleView() {
    try {
      const response = await fetch(
        `/api/medical-records/${recordId}/view`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to open medical record",
        );
      }

      window.open(data.viewUrl, "_blank");
    } catch (error) {
      console.error("Failed to open medical record:", error);
      alert("Unable to open medical record.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleView}
      className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      View
    </button>
  );
}