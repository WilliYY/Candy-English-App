import { z } from "zod";

const maintenanceSchema = z
  .object({
    enabled: z.boolean(),
    updatedAt: z.string().datetime().nullable(),
  })
  .strict();

const operationsSchema = z
  .object({
    generatedAt: z.string().datetime(),
    maintenance: maintenanceSchema,
    storage: z
      .object({
        usageBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
      })
      .strict(),
  })
  .strict();

export const adminOperationsResponseSchema = z
  .object({ ok: z.literal(true), operations: operationsSchema })
  .strict();

export const adminMaintenanceMutationResponseSchema = z
  .object({
    message: z.string().min(1).max(300),
    ok: z.literal(true),
    result: z
      .object({
        changed: z.boolean(),
        maintenance: maintenanceSchema,
        replayed: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type MobileAdminOperations = z.infer<typeof operationsSchema>;
export type AdminMaintenanceInput = {
  confirmChange: true;
  enabled: boolean;
  expectedUpdatedAt: string | null;
  operationId: string;
};
export type AdminMaintenanceMutation = z.infer<
  typeof adminMaintenanceMutationResponseSchema
>["result"] & { message: string };
