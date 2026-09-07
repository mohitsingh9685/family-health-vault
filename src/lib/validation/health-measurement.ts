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

const healthMeasurementSchema = z.object({
  type: measurementTypeSchema,
  value: z.number().finite().nullable().optional(),
  unit: z.string().trim().max(30).nullable().optional(),
  systolic: z.number().int().positive().nullable().optional(),
  diastolic: z.number().int().positive().nullable().optional(),
  context: z.string().trim().max(100).nullable().optional(),
  measuredAt: z.coerce.date(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

type HealthMeasurementShape = z.infer<typeof healthMeasurementSchema>;

function validateMeasurementShape(
  data: HealthMeasurementShape,
  ctx: z.RefinementCtx,
) {
  if (data.type === "BLOOD_PRESSURE") {
    if (data.systolic == null || data.diastolic == null) {
      ctx.addIssue({
        code: "custom",
        message: "Blood pressure requires systolic and diastolic values",
        path: ["systolic"],
      });
    } else if (data.systolic <= data.diastolic) {
      ctx.addIssue({
        code: "custom",
        message: "Systolic pressure must be greater than diastolic pressure",
        path: ["systolic"],
      });
    }

    if (data.value != null) {
      ctx.addIssue({
        code: "custom",
        message: "Blood pressure must not use a single value",
        path: ["value"],
      });
    }

    return;
  }

  if (data.value == null) {
    ctx.addIssue({
      code: "custom",
      message: "This measurement requires a value",
      path: ["value"],
    });
  }

  if (data.systolic != null || data.diastolic != null) {
    ctx.addIssue({
      code: "custom",
      message: "Only blood pressure can have systolic or diastolic values",
      path: ["systolic"],
    });
  }
}

export const createHealthMeasurementSchema =
  healthMeasurementSchema.superRefine(validateMeasurementShape);

// PATCH accepts null so changing measurement type can explicitly clear fields.
export const updateHealthMeasurementSchema = healthMeasurementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });

// PATCH routes validate the complete merged database state before persisting.
export const persistedHealthMeasurementSchema =
  healthMeasurementSchema.superRefine(validateMeasurementShape);

export const createHealthMeasurementAccessSchema = z.object({
  familyId: z.string().uuid(),
});