"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CalendarDays,
  ExternalLink,
  FilePlus2,
  FileText,
  HeartPulse,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

type FamilyOption = {
  id: string;
  name: string;
};

type FamilyMemberOption = {
  userId: string;
  name: string;
};

type MedicalRecordItem = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  processingStatus: string;
  createdAt: string;
  owner: {
    userId: string;
    name: string;
  };
};

type MedicalRecordWorkspaceProps = {
  familyId: string;
  familyName: string;
  userName: string;
  families: FamilyOption[];
  members: FamilyMemberOption[];
  records: MedicalRecordItem[];
};

const documentTypes = [
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "BLOOD_REPORT", label: "Blood report" },
  { value: "LAB_REPORT", label: "Lab report" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge summary" },
  { value: "XRAY", label: "X-Ray" },
  { value: "MRI", label: "MRI" },
  { value: "CT_SCAN", label: "CT scan" },
  { value: "OTHER", label: "Other" },
];

const measurementTypes = [
  { value: "BLOOD_SUGAR", label: "Blood sugar" },
  { value: "BLOOD_PRESSURE", label: "Blood pressure" },
  { value: "WEIGHT", label: "Weight" },
  { value: "TEMPERATURE", label: "Temperature" },
  { value: "HEART_RATE", label: "Heart rate" },
  { value: "OXYGEN_SATURATION", label: "Oxygen saturation" },
];

function typeLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function MedicalRecordWorkspace({
  familyId,
  familyName,
  userName,
  families,
  members,
  records,
}: MedicalRecordWorkspaceProps) {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<
    "document" | "measurement" | null
  >(null);
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [recordType, setRecordType] = useState("BLOOD_REPORT");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [measurementType, setMeasurementType] = useState("BLOOD_SUGAR");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const [uploading, setUploading] = useState(false);
  const [savingMeasurement, setSavingMeasurement] = useState(false);
  const [message, setMessage] = useState("");

  const availableTypes = Array.from(new Set(records.map((record) => record.type)))
    .sort((left, right) => left.localeCompare(right));

  const visibleRecords = records
    .filter(
      (record) =>
        (selectedMember === "all" || record.owner.userId === selectedMember) &&
        (selectedType === "all" || record.type === selectedType),
    )
    .sort((left, right) => {
      const difference =
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      return sortOrder === "newest" ? difference : -difference;
    });

  const membersWithRecords = new Set(records.map((record) => record.owner.userId))
    .size;

  function openForm(form: "document" | "measurement") {
    setMessage("");
    setActiveForm((current) => (current === form ? null : form));
  }

  async function handleUpload() {
    if (!file || !title.trim()) {
      setMessage("Please provide a title and select a medical file.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const prepareResponse = await fetch("/api/medical-records/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId,
          title: title.trim(),
          type: recordType,
          description: description.trim() || undefined,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });
      const prepareData = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(prepareData.error || "Unable to prepare upload");
      }

      const uploadResponse = await fetch(prepareData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("File upload to storage failed");
      }

      const completeResponse = await fetch(
        "/api/medical-records/upload/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            medicalRecordId: prepareData.medicalRecordId,
            familyId,
          }),
        },
      );
      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(completeData.error || "Unable to complete upload");
      }

      setTitle("");
      setDescription("");
      setFile(null);
      setFileInputKey((current) => current + 1);
      setActiveForm(null);
      setMessage("Medical record uploaded successfully.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleMeasurement() {
    const isBloodPressure = measurementType === "BLOOD_PRESSURE";

    if (
      (isBloodPressure && (!systolic || !diastolic)) ||
      (!isBloodPressure && !value)
    ) {
      setMessage("Please enter the required measurement values.");
      return;
    }

    try {
      setSavingMeasurement(true);
      setMessage("");

      const response = await fetch("/api/health-measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          familyId,
          type: measurementType,
          value: isBloodPressure ? undefined : Number(value),
          systolic: isBloodPressure ? Number(systolic) : undefined,
          diastolic: isBloodPressure ? Number(diastolic) : undefined,
          unit: unit.trim() || undefined,
          measuredAt: new Date().toISOString(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save measurement");
      }

      setValue("");
      setSystolic("");
      setDiastolic("");
      setUnit("");
      setNotes("");
      setActiveForm(null);
      setMessage("Health measurement saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save measurement",
      );
    } finally {
      setSavingMeasurement(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 lg:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {familyName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Medical records
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review authorized family documents or add data for {userName}.
            </p>
          </div>

          <label className="min-w-56 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Switch family
            <select
              value={familyId}
              onChange={(event) =>
                router.push(
                  `/medical-record?familyId=${encodeURIComponent(event.target.value)}`,
                )
              }
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </label>
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
          href={`/medical-record?familyId=${encodeURIComponent(familyId)}`}
          className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
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
          href={`/health-trends?familyId=${encodeURIComponent(familyId)}&range=30`}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Trends
        </Link>
      </nav>

      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-7">
        {message && (
          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
            {message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => openForm("document")}
            className={`flex items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
              activeForm === "document"
                ? "border-teal-600 bg-teal-50"
                : "border-slate-200 bg-white hover:border-teal-300"
            }`}
          >
            <span className="rounded-xl bg-teal-100 p-3 text-teal-700">
              <FilePlus2 size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-950">
                Upload medical record
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Add a prescription, report, scan, or discharge summary.
              </span>
            </span>
            <span className="text-xl text-slate-400" aria-hidden="true">
              {activeForm === "document" ? "−" : "+"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => openForm("measurement")}
            className={`flex items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
              activeForm === "measurement"
                ? "border-slate-700 bg-slate-100"
                : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            <span className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <HeartPulse size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-950">
                Add health measurement
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                Record a vital measurement for your account.
              </span>
            </span>
            <span className="text-xl text-slate-400" aria-hidden="true">
              {activeForm === "measurement" ? "−" : "+"}
            </span>
          </button>
        </section>

        {activeForm === "document" && (
          <section className="mt-5 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Upload medical record
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  The uploaded record belongs to your account and is shared with {familyName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close upload form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Record type
                <select
                  value={recordType}
                  onChange={(event) => setRecordType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                >
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Kidney function test – August 2026"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Description
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Medical file
                <input
                  key={fileInputKey}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 p-3 text-sm"
                />
                <span className="mt-2 block text-xs font-normal text-slate-500">
                  PDF, JPG, or PNG. Maximum size: 10 MB.
                </span>
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload record"}
              </button>
            </div>
          </section>
        )}

        {activeForm === "measurement" && (
          <section className="mt-5 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Add health measurement
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This measurement is saved for {userName} and shared with {familyName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveForm(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close measurement form"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Measurement
                <select
                  value={measurementType}
                  onChange={(event) => setMeasurementType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                >
                  {measurementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              {measurementType === "BLOOD_PRESSURE" ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-medium text-slate-700">
                    Systolic
                    <input
                      type="number"
                      value={systolic}
                      onChange={(event) => setSystolic(event.target.value)}
                      placeholder="120"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Diastolic
                    <input
                      type="number"
                      value={diastolic}
                      onChange={(event) => setDiastolic(event.target.value)}
                      placeholder="80"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                    />
                  </label>
                </div>
              ) : (
                <label className="text-sm font-medium text-slate-700">
                  Value
                  <input
                    type="number"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="Enter value"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                  />
                </label>
              )}

              <label className="text-sm font-medium text-slate-700">
                Unit
                <input
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="e.g. mg/dL, kg, °C"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Notes
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional notes"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-teal-600"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleMeasurement}
                disabled={savingMeasurement}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMeasurement ? "Saving…" : "Save measurement"}
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="text-teal-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">{records.length}</p>
            <p className="text-sm text-slate-500">Authorized records</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Users className="text-sky-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {membersWithRecords}
            </p>
            <p className="text-sm text-slate-500">Members with records</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CalendarDays className="text-slate-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {availableTypes.length}
            </p>
            <p className="text-sm text-slate-500">Record categories</p>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Family medical records
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your records and records explicitly shared with {familyName}.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {visibleRecords.length} shown
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Family member
                <select
                  value={selectedMember}
                  onChange={(event) => setSelectedMember(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="all">All family members</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Record type
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="all">All record types</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {typeLabel(type)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "newest" | "oldest")
                  }
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </label>
            </div>
          </div>

          {visibleRecords.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 font-medium text-slate-700">
                No matching medical records
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Change the filters or upload a record for your account.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Record</th>
                    <th className="px-6 py-3 font-semibold">Family member</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Added</th>
                    <th className="px-6 py-3 text-right font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/70">
                      <td className="min-w-64 px-6 py-4">
                        <p className="font-semibold text-slate-900">{record.title}</p>
                        {record.description && (
                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {record.description}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                        {record.owner.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                          {typeLabel(record.type)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                        {new Intl.DateTimeFormat("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(record.createdAt))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`/api/medical-records/${record.id}/view`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          View <ExternalLink size={13} aria-hidden="true" />
                        </a>
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
  );
}
