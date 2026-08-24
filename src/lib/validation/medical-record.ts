import { z } from "zod";

export const medicalRecordTypeSchema = z.enum([
  "PRESCRIPTION",
  "BLOOD_REPORT",
  "DISCHARGE_SUMMARY",
  "XRAY",
  "MRI",
  "CT_SCAN",
  "LAB_REPORT",
  "OTHER",
]);

export const createMedicalRecordSchema = z.object({
  title: z.string().trim().min(1).max(200),
  type: medicalRecordTypeSchema,
  description: z.string().trim().max(2000).optional(),
});

export const updateMedicalRecordSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  type: medicalRecordTypeSchema.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

export const createMedicalRecordAccessSchema = z.object({
  familyId: z.string().uuid(),
});