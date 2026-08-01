import { z } from "zod";

const unitSchema = z.enum(["IVATE", "DOURADINA"]);
const statusSchema = z.enum([
  "SCHEDULED",
  "ATTENDED",
  "MISSED",
  "MAKEUP_SCHEDULED",
  "MAKEUP_ATTENDED",
]);
const countsSchema = z
  .object({
    attendedCount: z.number().int().nonnegative(),
    count: z.number().int().nonnegative(),
    makeupCount: z.number().int().nonnegative(),
    missedCount: z.number().int().nonnegative(),
    scheduledCount: z.number().int().nonnegative(),
  })
  .strict();
const lessonSchema = z
  .object({
    date: z.string().date(),
    id: z.string().min(1).max(200),
    isMakeup: z.boolean(),
    lessonNote: z.string().min(1).max(500).nullable(),
    status: statusSchema,
    studentId: z.string().min(1).max(200),
    studentName: z.string().min(1).max(120),
    studentNote: z.string().min(1).max(500).nullable(),
    studentPhone: z.string().min(1).max(40).nullable(),
    studentUnit: unitSchema,
    time: z.string().min(1).max(10),
    updatedAt: z.string().datetime(),
  })
  .strict();
const agendaSchema = z
  .object({
    dailyLessons: z.array(lessonSchema).max(2_000),
    days: z
      .array(countsSchema.extend({ date: z.string().date() }).strict())
      .min(1)
      .max(31),
    generatedAt: z.string().datetime(),
    period: z
      .object({
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2020).max(2100),
      })
      .strict(),
    selectedDate: z.string().date(),
    summary: countsSchema,
    unit: z.enum(["ALL", "IVATE", "DOURADINA"]),
  })
  .strict();
const historyItemSchema = z
  .object({
    action: z.string().min(1).max(80),
    actorName: z.string().min(1).max(120).nullable(),
    createdAt: z.string().datetime(),
    description: z.string().min(1).max(500),
    id: z.string().min(1).max(200),
    lessonId: z.string().min(1).max(200).nullable(),
  })
  .strict();
const lessonDetailSchema = z
  .object({
    history: z.array(historyItemSchema).max(100),
    lesson: lessonSchema,
  })
  .strict();
const attendanceMutationSchema = z
  .object({
    lesson: lessonSchema,
    message: z.string().min(1).max(300),
    replayed: z.boolean(),
  })
  .strict();
const makeupMutationSchema = z
  .object({
    makeupLesson: lessonSchema,
    message: z.string().min(1).max(300),
    replayed: z.boolean(),
  })
  .strict();

export const adminAgendaResponseSchema = z
  .object({ agenda: agendaSchema, ok: z.literal(true) })
  .strict();
export const adminAgendaLessonResponseSchema = z
  .object({ detail: lessonDetailSchema, ok: z.literal(true) })
  .strict();
export const adminAgendaAttendanceMutationResponseSchema = z
  .object({ ok: z.literal(true), result: attendanceMutationSchema })
  .strict();
export const adminAgendaMakeupMutationResponseSchema = z
  .object({ ok: z.literal(true), result: makeupMutationSchema })
  .strict();

export type MobileAdminAgenda = z.infer<typeof agendaSchema>;
export type MobileAdminAgendaDay = MobileAdminAgenda["days"][number];
export type MobileAdminAgendaLesson = z.infer<typeof lessonSchema>;
export type MobileAdminAgendaLessonDetail = z.infer<typeof lessonDetailSchema>;
export type MobileAdminAgendaHistoryItem = z.infer<typeof historyItemSchema>;
export type MobileAdminAgendaStatus = z.infer<typeof statusSchema>;
export type MobileAdminAgendaUnit = z.infer<typeof unitSchema>;
export type AdminAgendaAttendanceMutation = z.infer<
  typeof attendanceMutationSchema
>;
export type AdminAgendaMakeupMutation = z.infer<typeof makeupMutationSchema>;

export type AdminAgendaInput = {
  date?: string;
  month?: number;
  query?: string;
  unit?: MobileAdminAgendaUnit | "ALL";
  year?: number;
};
export type AdminAgendaAttendanceInput = {
  confirmChange: true;
  expectedUpdatedAt: string;
  operationId: string;
  status: "ATTENDED" | "MISSED" | "SCHEDULED";
};
export type AdminAgendaMakeupInput = {
  confirmCreate: true;
  date: string;
  expectedUpdatedAt: string;
  notes: string | null;
  operationId: string;
  time: string;
};
