import { z } from "zod";

export const teacherCattyLearningCategories = [
  "IDEAL_REPLY",
  "BAD_REPLY",
  "VOCABULARY",
  "COMMON_QUESTION",
  "HOMEWORK_EXAMPLE",
  "TEACHER_GUIDANCE",
  "STUDENT_GUIDANCE",
  "CATTY_PHRASE",
  "APPROVED_CORRECTION",
] as const;

const learningCategorySchema = z.enum(teacherCattyLearningCategories);
const learningStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
]);
const artifactStatusSchema = z.enum([
  "ACTIVE",
  "PENDING",
  "DISABLED",
  "ARCHIVED",
]);

const teacherCattyManagementSchema = z
  .object({
    approvedLearningCount: z.number().int().nonnegative(),
    artifacts: z
      .array(
        z
          .object({
            catchphrases: z.array(z.string().min(1).max(48)).max(8),
            emojis: z.array(z.string().min(1).max(16)).max(8),
            example: z.string().min(1).max(140).nullable(),
            id: z.string().min(1),
            isPrimary: z.boolean(),
            label: z.string().min(1).max(64),
            sounds: z.array(z.string().min(1).max(28)).max(6),
            status: artifactStatusSchema,
            studentId: z.string().min(1),
            themeId: z.string().min(1).max(48),
            toneRule: z.string().min(1).max(220).nullable(),
            updatedAt: z.string().datetime(),
          })
          .strict(),
      )
      .max(100),
    learningCategories: z
      .array(learningCategorySchema)
      .max(teacherCattyLearningCategories.length),
    learningItems: z
      .array(
        z
          .object({
            badReply: z.string().min(1).max(700).nullable(),
            category: learningCategorySchema,
            createdAt: z.string().datetime(),
            id: z.string().min(1),
            idealReply: z.string().min(1).max(1000).nullable(),
            intent: z.string().min(1).max(80).nullable(),
            notes: z.string().min(1).max(1000).nullable(),
            status: learningStatusSchema,
            tags: z.array(z.string().min(1).max(32)).max(8),
            title: z.string().min(1).max(120),
            updatedAt: z.string().datetime(),
            userPrompt: z.string().min(1).max(500).nullable(),
          })
          .strict(),
      )
      .max(50),
    students: z
      .array(
        z
          .object({
            id: z.string().min(1),
            name: z.string().min(1).max(120),
          })
          .strict(),
      )
      .max(100),
    themeOptions: z.array(
      z
        .object({
          catchphrases: z.array(z.string().min(1).max(48)).max(8),
          emojis: z.array(z.string().min(1).max(16)).max(8),
          id: z.string().min(1).max(48),
          label: z.string().min(1).max(64),
          sounds: z.array(z.string().min(1).max(28)).max(6),
        })
        .strict(),
    ),
  })
  .strict();

export const teacherCattyManagementResponseSchema = z
  .object({
    management: teacherCattyManagementSchema,
    ok: z.literal(true),
  })
  .strict();

export const teacherCattyMutationResponseSchema = z
  .object({
    message: z.string().min(1).max(300),
    ok: z.literal(true),
  })
  .strict();

export type MobileTeacherCattyManagement = z.infer<
  typeof teacherCattyManagementSchema
>;
export type MobileTeacherCattyArtifactStatus = z.infer<
  typeof artifactStatusSchema
>;
export type MobileTeacherCattyLearningCategory = z.infer<
  typeof learningCategorySchema
>;

export type TeacherCattyLearningInput = {
  badReply?: string;
  category: MobileTeacherCattyLearningCategory;
  idealReply?: string;
  intent?: string;
  notes?: string;
  tags?: string[];
  title: string;
  userPrompt?: string;
};

export type TeacherCattyArtifactInput = {
  blockedReason?: string;
  catchphrasesText?: string;
  emojisText?: string;
  example?: string;
  isPrimary?: boolean;
  label: string;
  soundsText?: string;
  status?: MobileTeacherCattyArtifactStatus;
  targetUserId: string;
  themeId: string;
  toneRule?: string;
};

export type TeacherCattyArtifactStatusInput = {
  blockedReason?: string;
  isPrimary?: boolean;
  status: MobileTeacherCattyArtifactStatus;
};
