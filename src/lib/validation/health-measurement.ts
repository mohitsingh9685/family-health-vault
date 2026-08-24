import { z } from "zod";

const measurementTypeSchema = z.enum([
  "BLOOD_SUGAR",
  "BLOOD_PRESSURE",
  "WEIGHT",
  "TEMPERATURE",
  "HEART_RATE",
  "OXYGEN_SATURATION",
  "OTHER",
]);

const healthMeasurementFields = {
  type: measurementTypeSchema,
  value: z.number().finite().optional(),
  unit: z.string().trim().max(30).optional(),
  systolic: z.number().int().positive().optional(),
  diastolic: z.number().int().positive().optional(),
  context: z.string().trim().max(100).optional(),
  measuredAt: z.coerce.date(),
  notes: z.string().trim().max(2000).optional(),
};

export const createHealthMeasurementSchema = z
  .object(healthMeasurementFields)
  .superRefine((data, ctx) => {
    if (data.type === "BLOOD_PRESSURE") {
      if (data.systolic === undefined || data.diastolic === undefined) {
        ctx.addIssue({
          code: "custom",
          message:
            "Blood pressure requires systolic and diastolic values",
          path: ["systolic"],
        });
      }

      if (data.value !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: "Blood pressure should not use a single value",
          path: ["value"],
        });
      }
    } else if (data.value === undefined) {
      ctx.addIssue({
        code: "custom",
        message: "This measurement requires a value",
        path: ["value"],
      });
    }
  });

export const updateHealthMeasurementSchema = z.object({
  type: measurementTypeSchema.optional(),
  value: z.number().finite().optional(),
  unit: z.string().trim().max(30).optional(),
  systolic: z.number().int().positive().optional(),
  diastolic: z.number().int().positive().optional(),
  context: z.string().trim().max(100).optional(),
  measuredAt: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createHealthMeasurementAccessSchema = z.object({
  familyId: z.string().uuid(),
});