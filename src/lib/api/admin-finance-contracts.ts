import { z } from "zod";

const unitSchema = z.enum(["IVATE", "DOURADINA"]);
const unitFilterSchema = z.enum(["ALL", "IVATE", "DOURADINA"]);
const statusSchema = z.enum(["PAID", "PENDING", "OVERDUE", "INCOMPLETE"]);
const summarySchema = z
  .object({
    incompleteCount: z.number().int().nonnegative(),
    overdueCents: z.number().int().nonnegative(),
    overdueCount: z.number().int().nonnegative(),
    paidCents: z.number().int().nonnegative(),
    paidCount: z.number().int().nonnegative(),
    pendingCents: z.number().int().nonnegative(),
    pendingCount: z.number().int().nonnegative(),
    studentsCount: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
  })
  .strict();
const itemSchema = z
  .object({
    amountCents: z.number().int().nonnegative(),
    id: z.string().min(1).max(200),
    installmentNumber: z.number().int().positive().nullable(),
    installmentsTotal: z.number().int().positive().nullable(),
    isPaid: z.boolean(),
    month: z.number().int().min(1).max(12),
    name: z.string().min(1).max(120),
    note: z.string().min(1).max(500).nullable(),
    paidAt: z.string().datetime().nullable(),
    paymentDay: z.number().int().min(1).max(31),
    paymentMethod: z.string().min(1).max(80),
    status: statusSchema,
    studentId: z.string().min(1).max(200),
    unit: unitSchema,
    updatedAt: z.string().datetime(),
    year: z.number().int().min(2020).max(2100),
  })
  .strict();
const financeSchema = z
  .object({
    generatedAt: z.string().datetime(),
    items: z.array(itemSchema).max(50),
    nextCursor: z.string().min(1).max(200).nullable(),
    period: z
      .object({
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2020).max(2100),
      })
      .strict(),
    scopeSummary: summarySchema,
    total: z.number().int().nonnegative(),
    unitSummaries: z
      .array(summarySchema.extend({ unit: unitSchema }).strict())
      .length(2),
  })
  .strict();

export const adminFinanceResponseSchema = z
  .object({ finance: financeSchema, ok: z.literal(true) })
  .strict();

const expenseSchema = z
  .object({
    actorName: z.string().min(1).max(120),
    amountCents: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    id: z.string().min(1).max(200),
    itemName: z.string().min(1).max(160),
    note: z.string().min(1).max(600).nullable(),
    purchasedAt: z.string().date(),
    unit: unitSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();
const logSchema = z
  .object({
    action: z.string().min(1).max(80),
    createdAt: z.string().datetime(),
    description: z.string().min(1).max(500),
    id: z.string().min(1).max(200),
    studentName: z.string().min(1).max(120).nullable(),
  })
  .strict();
const activitySchema = z
  .object({
    expenseSummary: z
      .object({
        count: z.number().int().nonnegative(),
        totalCents: z.number().int().nonnegative(),
      })
      .strict(),
    expenses: z.array(expenseSchema),
    generatedAt: z.string().datetime(),
    logs: z.array(logSchema).max(50),
    logsScope: z.literal("GLOBAL_RECENT"),
    period: z
      .object({
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2020).max(2100),
      })
      .strict(),
    unit: unitFilterSchema,
  })
  .strict();

export const adminFinanceActivityResponseSchema = z
  .object({ activity: activitySchema, ok: z.literal(true) })
  .strict();
export const adminFinancePaymentResponseSchema = z
  .object({ ok: z.literal(true), payment: itemSchema })
  .strict();
export const adminFinancePaymentMutationResponseSchema = z
  .object({
    message: z.string().min(1).max(240),
    ok: z.literal(true),
    payment: itemSchema,
    replayed: z.boolean(),
  })
  .strict();
export const adminFinanceExpenseMutationResponseSchema = z
  .object({
    expense: expenseSchema,
    message: z.string().min(1).max(240),
    ok: z.literal(true),
    replayed: z.boolean(),
  })
  .strict();

export type MobileAdminFinance = z.infer<typeof financeSchema>;
export type MobileAdminFinanceItem = z.infer<typeof itemSchema>;
export type MobileAdminFinanceStatus = z.infer<typeof statusSchema>;
export type MobileAdminFinanceSummary = z.infer<typeof summarySchema>;
export type MobileAdminFinanceUnit = z.infer<typeof unitSchema>;
export type MobileAdminFinanceActivity = z.infer<typeof activitySchema>;
export type MobileAdminFinanceExpense = z.infer<typeof expenseSchema>;
export type MobileAdminFinanceLog = z.infer<typeof logSchema>;
export type AdminFinancePaymentMutation = z.infer<
  typeof adminFinancePaymentMutationResponseSchema
>;
export type AdminFinanceExpenseMutation = z.infer<
  typeof adminFinanceExpenseMutationResponseSchema
>;

export type AdminFinanceInput = {
  cursor?: string;
  limit?: number;
  month?: number;
  query?: string;
  status?: MobileAdminFinanceStatus | "ALL";
  unit?: MobileAdminFinanceUnit | "ALL";
  year?: number;
};

export type AdminFinanceActivityInput = {
  month?: number;
  unit?: MobileAdminFinanceUnit | "ALL";
  year?: number;
};

export type AdminFinancePaymentUpdateInput = {
  amountCents?: number;
  confirmChange: true;
  expectedUpdatedAt: string;
  isPaid: boolean;
  note: string | null;
  operationId: string;
};

export type AdminFinanceExpenseCreateInput = {
  actorName: string;
  amountCents: number;
  confirmCreate: true;
  itemName: string;
  month: number;
  note: string | null;
  operationId: string;
  purchasedAt: string;
  unit: MobileAdminFinanceUnit;
  year: number;
};
