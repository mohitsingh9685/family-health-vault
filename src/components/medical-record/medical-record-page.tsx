"use client";

import { useEffect, useState } from "react";

type MedicalRecordPageProps = {
  familyId: string;
  familyName: string;
  userName: string;
};

type MedicalRecord = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  processingStatus: string;
  createdAt: string;
};

const documentTypes = [
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "BLOOD_REPORT", label: "Blood Report" },
  { value: "LAB_REPORT", label: "Lab Report" },
  { value: "DISCHARGE_SUMMARY", label: "Discharge Summary" },
  { value: "XRAY", label: "X-Ray" },
  { value: "MRI", label: "MRI" },
  { value: "CT_SCAN", label: "CT Scan" },
  { value: "OTHER", label: "Other" },
];

const measurementTypes = [
  { value: "BLOOD_SUGAR", label: "Blood Sugar" },
  { value: "BLOOD_PRESSURE", label: "Blood Pressure" },
  { value: "WEIGHT", label: "Weight" },
  { value: "TEMPERATURE", label: "Temperature" },
  { value: "HEART_RATE", label: "Heart Rate" },
  { value: "OXYGEN_SATURATION", label: "Oxygen Saturation" },
];

export default function MedicalRecordPage({
  familyId,
  familyName,
  userName,
}: MedicalRecordPageProps) {
  const [recordType, setRecordType] = useState("BLOOD_REPORT");
  const [measurementType, setMeasurementType] =
    useState("BLOOD_SUGAR");

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [savingMeasurement, setSavingMeasurement] = useState(false);

  const [message, setMessage] = useState("");

  // [Medical Records → API]
  // Load the authenticated user's medical records.
  async function loadRecords() {
    try {
      setLoadingRecords(true);

      const response = await fetch("/api/medical-records");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load medical records"
        );
      }

      setRecords(data.medicalRecords);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load medical records"
      );
    } finally {
      setLoadingRecords(false);
    }
  }

  // [Medical Records → Page Load]
  useEffect(() => {
    loadRecords();
  }, []);

  async function handleUpload() {
    if (!file || !title.trim()) {
      setMessage("Please provide a title and select a file.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      // [Frontend → Upload API]
      const prepareResponse = await fetch(
        "/api/medical-records/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            familyId,
            title,
            type: recordType,
            description: description || undefined,
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        }
      );

      const prepareData = await prepareResponse.json();

      if (!prepareResponse.ok) {
        throw new Error(
          prepareData.error || "Unable to prepare upload"
        );
      }

      // [Frontend → AWS S3]
      const uploadResponse = await fetch(
        prepareData.uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("File upload to S3 failed");
      }

      // [Frontend → Upload Complete API]
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
        }
      );

      const completeData = await completeResponse.json();

      if (!completeResponse.ok) {
        throw new Error(
          completeData.error || "Unable to complete upload"
        );
      }

      setMessage("Medical record uploaded successfully.");

      setFile(null);
      setTitle("");
      setDescription("");

      // [Upload Complete → Records]
      // Refresh the list immediately after successful upload.
      await loadRecords();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleMeasurement() {
    try {
      setSavingMeasurement(true);
      setMessage("");

      // [Frontend → Health Measurement API]
      const response = await fetch(
        "/api/health-measurements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
             familyId,
            type: measurementType,
            value:
              measurementType === "BLOOD_PRESSURE"
                ? undefined
                : Number(value),
            systolic:
              measurementType === "BLOOD_PRESSURE"
                ? Number(systolic)
                : undefined,
            diastolic:
              measurementType === "BLOOD_PRESSURE"
                ? Number(diastolic)
                : undefined,
            unit: unit || undefined,
            measuredAt: new Date().toISOString(),
            notes: notes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save measurement"
        );
      }

      setMessage("Health measurement saved successfully.");

      setValue("");
      setSystolic("");
      setDiastolic("");
      setUnit("");
      setNotes("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save measurement"
      );
    } finally {
      setSavingMeasurement(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      {/* [Medical Records → Header] */}
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          {familyName}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Medical Records
        </h1>

        <p className="mt-2 text-slate-500">
          Upload medical documents and record health measurements
          for {userName}.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl border bg-white px-5 py-4 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* [Medical Records → Document Upload] */}
        <section className="rounded-2xl border bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Upload Medical Document
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Store prescriptions, reports, scans and other medical
            documents securely.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Record type
              </label>

              <select
                value={recordType}
                onChange={(event) =>
                  setRecordType(event.target.value)
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Title
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Kidney Function Test - August 2026"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Optional description"
                rows={3}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Medical file
              </label>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                className="mt-2 block w-full rounded-xl border p-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                PDF, JPG or PNG. Maximum size: 10 MB.
              </p>
            </div>

            <button type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="w-full rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? "Uploading..." : "Upload Medical Record"}</button>
          </div>
        </section>

        {/* [Medical Records → Manual Health Entry] */}
        <section className="rounded-2xl border bg-white p-7 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            Add Health Measurement
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Enter health measurements manually without uploading
            a document.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Measurement
              </label>

              <select
                value={measurementType}
                onChange={(event) =>
                  setMeasurementType(event.target.value)
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
              >
                {measurementTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {measurementType === "BLOOD_PRESSURE" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Systolic
                  </label>

                  <input
                    type="number"
                    value={systolic}
                    onChange={(event) =>
                      setSystolic(event.target.value)
                    }
                    placeholder="120"
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Diastolic
                  </label>

                  <input
                    type="number"
                    value={diastolic}
                    onChange={(event) =>
                      setDiastolic(event.target.value)
                    }
                    placeholder="80"
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Value
                </label>

                <input
                  type="number"
                  value={value}
                  onChange={(event) =>
                    setValue(event.target.value)
                  }
                  placeholder="Enter value"
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-700">
                Unit
              </label>

              <input
                value={unit}
                onChange={(event) =>
                  setUnit(event.target.value)
                }
                placeholder="e.g. mg/dL, kg, °C"
                className="mt-2 w-full rounded-xl border px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Optional notes"
                rows={3}
                className="mt-2 w-full rounded-xl border px-4 py-3"
              />
            </div>

            <button type="button"
            onClick={handleMeasurement}
            disabled={savingMeasurement}
            className="w-full rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{savingMeasurement ? "Saving..." : "Save Measurement"}</button>
          </div>
        </section>
      </div>

      {/* [Medical Records → Existing Records] */}
      <section className="mt-6 rounded-2xl border bg-white p-7 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">
          Your Medical Records
        </h2>

        {loadingRecords ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading medical records...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium text-slate-700">
              No medical records yet
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Upload a document above to start building your
              medical history.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {record.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {record.type.replaceAll("_", " ")}
                  </p>

                  {record.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {record.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
                    {record.processingStatus}
                  </span>

                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(
                      record.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}