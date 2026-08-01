import { z } from "zod";

const statusSchema = z.enum([
  "PENDING",
  "CONTACTED",
  "WAITING_PAYMENT",
  "READY_TO_CONVERT",
  "APPROVED",
  "REJECTED",
]);
const unitSchema = z.enum(["IVATE", "DOURADINA"]);
const nullableText = (maximum: number) =>
  z.string().min(1).max(maximum).nullable();

const listItemSchema = z
  .object({
    assignedTeacherName: nullableText(120),
    converted: z.boolean(),
    createdAt: z.string().datetime(),
    email: nullableText(254),
    fullName: z.string().min(1).max(120),
    id: z.string().min(1).max(200),
    phone: z.string().max(40),
    status: statusSchema,
    statusNote: nullableText(500),
    unit: unitSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();

const detailSchema = listItemSchema
  .omit({ converted: true })
  .extend({
    address: nullableText(240),
    agenda: z
      .object({
        complete: z.boolean(),
        days: z.array(z.string().min(1).max(8)).max(7),
        time: nullableText(5),
      })
      .strict(),
    birthDate: z.string().date().nullable(),
    canConvert: z.boolean(),
    city: nullableText(120),
    converted: z.boolean(),
    convertedUser: z
      .object({
        email: z.string().min(1).max(254),
        name: z.string().max(120),
      })
      .strict()
      .nullable(),
    createdBy: z
      .object({
        name: z.string().max(120),
        role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
      })
      .strict()
      .nullable(),
    englishGoal: z.string().max(1000),
    estimatedLevel: nullableText(80),
    finance: z.object({ complete: z.boolean() }).strict(),
    guardianDocument: nullableText(40),
    guardianName: nullableText(120),
    guardianPhone: nullableText(40),
    installmentsTotal: z.number().int().positive().nullable(),
    notes: nullableText(2000),
    paymentDay: z.number().int().min(1).max(31).nullable(),
    paymentMethod: nullableText(80),
    reviewedAt: z.string().datetime().nullable(),
    reviewedByName: nullableText(120),
    secondaryContact: nullableText(160),
    studentPhone: nullableText(40),
    tuitionCents: z.number().int().nonnegative().nullable(),
  })
  .strict();

const listSchema = z
  .object({
    generatedAt: z.string().datetime(),
    items: z.array(listItemSchema).max(50),
    nextCursor: z.string().min(1).max(200).nullable(),
    total: z.number().int().nonnegative(),
  })
  .strict();

export const adminPreRegistrationsResponseSchema = z
  .object({
    ok: z.literal(true),
    preRegistrations: listSchema,
  })
  .strict();

export const adminPreRegistrationResponseSchema = z
  .object({
    ok: z.literal(true),
    preRegistration: detailSchema,
  })
  .strict();

export const adminPreRegistrationConversionResponseSchema = z
  .object({
    message: z.string().min(1).max(500),
    ok: z.literal(true),
    preRegistration: detailSchema,
  })
  .strict();

export type MobileAdminPreRegistrationList = z.infer<typeof listSchema>;
export type MobileAdminPreRegistrationListItem = z.infer<
  typeof listItemSchema
>;
export type MobileAdminPreRegistration = z.infer<typeof detailSchema>;
export type MobileAdminPreRegistrationStatus = z.infer<typeof statusSchema>;
export type MobileAdminPreRegistrationUnit = z.infer<typeof unitSchema>;

export type AdminPreRegistrationsInput = {
  cursor?: string;
  limit?: number;
  query?: string;
  status?: MobileAdminPreRegistrationStatus | "ALL" | "OPEN";
  unit?: MobileAdminPreRegistrationUnit | "ALL";
};

export type AdminPreRegistrationConversionInput = {
  confirmConversion: true;
  confirmMissingAgendaData: boolean;
  confirmMissingFinancialData: boolean;
  emailForLogin: string;
  expectedUpdatedAt: string;
  initialPassword: string;
  operationId: string;
};
