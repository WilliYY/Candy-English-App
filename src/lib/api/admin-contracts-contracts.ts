import { z } from "zod";

const contractSchema = z
  .object({
    createdAt: z.string().datetime(),
    fileName: z.string().min(1).max(160),
    id: z.string().min(1).max(200),
    mimeType: z.literal("application/pdf"),
    sizeBytes: z.number().int().positive().max(8 * 1024 * 1024),
    student: z
      .object({
        id: z.string().min(1).max(200),
        name: z.string().min(1).max(120),
      })
      .strict()
      .nullable(),
    title: z.string().min(1).max(160),
    uploadedByName: z.string().min(1).max(120),
  })
  .strict();
const catalogSchema = z
  .object({
    contracts: z.array(contractSchema).max(100),
    generatedAt: z.string().datetime(),
    hasMore: z.boolean(),
    nextCursor: z.string().min(1).max(200).nullable(),
    students: z
      .array(
        z
          .object({
            id: z.string().min(1).max(200),
            name: z.string().min(1).max(120),
          })
          .strict(),
      )
      .max(500),
    summary: z
      .object({
        general: z.number().int().nonnegative(),
        studentSpecific: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const adminContractsResponseSchema = z
  .object({ catalog: catalogSchema, ok: z.literal(true) })
  .strict();
export const adminContractResponseSchema = z
  .object({ contract: contractSchema, ok: z.literal(true) })
  .strict();
export const adminContractUploadResponseSchema = z
  .object({
    message: z.string().min(1).max(300),
    ok: z.literal(true),
    result: z
      .object({ contract: contractSchema, replayed: z.boolean() })
      .strict(),
  })
  .strict();

export type MobileAdminContract = z.infer<typeof contractSchema>;
export type MobileAdminContractCatalog = z.infer<typeof catalogSchema>;
export type AdminContractsInput = {
  assignment?: "ALL" | "GENERAL" | "STUDENT";
  cursor?: string;
  limit?: number;
  query?: string;
};
export type AdminContractUploadFile = {
  mimeType: "application/pdf";
  name: string;
  size: number;
  uri: string;
};
export type AdminContractUploadInput = {
  confirmUpload: true;
  file: AdminContractUploadFile;
  operationId: string;
  studentProfileId: string | null;
  title: string;
};
export type AdminContractUploadResult = {
  contract: MobileAdminContract;
  message: string;
  replayed: boolean;
};
