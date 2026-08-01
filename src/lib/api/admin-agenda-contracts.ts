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

export const adminAgendaResponseSchema = z
  .object({ agenda: agendaSchema, ok: z.literal(true) })
  .strict();

export type MobileAdminAgenda = z.infer<typeof agendaSchema>;
export type MobileAdminAgendaDay = MobileAdminAgenda["days"][number];
export type MobileAdminAgendaLesson = z.infer<typeof lessonSchema>;
export type MobileAdminAgendaStatus = z.infer<typeof statusSchema>;
export type MobileAdminAgendaUnit = z.infer<typeof unitSchema>;

export type AdminAgendaInput = {
  date?: string;
  month?: number;
  query?: string;
  unit?: MobileAdminAgendaUnit | "ALL";
  year?: number;
};
