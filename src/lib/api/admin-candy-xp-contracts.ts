import { z } from "zod";

const nonNegativeInteger = z.number().int().nonnegative();
const candyXpActivityStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
]);
const releaseModeSchema = z.enum(["ALL", "STUDENT"]);
const submissionStatusSchema = z.enum([
  "DRAFT",
  "RETURNED",
  "REVIEWED",
  "SUBMITTED",
]);

const studentOptionSchema = z
  .object({ id: z.string().min(1).max(200), name: z.string().min(1).max(120) })
  .strict();

const adminCandyXpActivitySchema = z
  .object({
    asset: z
      .object({
        fileName: z.string().min(1).max(180),
        mimeType: z.string().min(1).max(120).nullable(),
        pageCount: z.number().int().positive(),
        sizeBytes: nonNegativeInteger,
      })
      .strict()
      .nullable(),
    category: z.string().min(1).max(80),
    createdAt: z.string().datetime(),
    description: z.string().max(1600).nullable(),
    id: z.string().min(1).max(200),
    level: z.string().min(1).max(80),
    publishedAt: z.string().datetime().nullable(),
    release: z
      .object({
        mode: releaseModeSchema,
        students: z.array(studentOptionSchema).max(100),
      })
      .strict(),
    status: candyXpActivityStatusSchema,
    submissionCount: nonNegativeInteger,
    title: z.string().min(1).max(160),
    updatedAt: z.string().datetime(),
    xpReward: z.number().int().positive().max(500),
  })
  .strict();

const adminCandyXpQuestionSchema = z
  .object({
    correctAnswer: z.unknown(),
    id: z.string().min(1).max(200),
    options: z.unknown(),
    prompt: z.string().min(1).max(2_000),
    required: z.boolean(),
    sortOrder: nonNegativeInteger,
    type: z.enum([
      "CHECKBOX",
      "LONG_TEXT",
      "MATCHING",
      "MULTIPLE_CHOICE",
      "SHORT_TEXT",
    ]),
  })
  .strict();

const adminCandyXpInteractiveFieldSchema = z
  .object({
    height: z.number().positive().max(100),
    id: z.string().min(1).max(200),
    label: z.string().max(500).nullable(),
    page: z.number().int().positive(),
    placeholder: z.string().max(500).nullable(),
    required: z.boolean(),
    sortOrder: nonNegativeInteger,
    type: z.string().min(1).max(80),
    width: z.number().positive().max(100),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .strict();

const adminCandyXpSubmissionSchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            questionId: z.string().min(1).max(200),
            value: z.string().max(20_000),
          })
          .strict(),
      )
      .max(140),
    autoScorePercent: z.number().min(0).max(100).nullable(),
    awardedXp: nonNegativeInteger.nullable(),
    feedback: z.string().max(3_000).nullable(),
    id: z.string().min(1).max(200),
    reviewedAt: z.string().datetime().nullable(),
    reviewedByName: z.string().min(1).max(120).nullable(),
    status: submissionStatusSchema,
    studentName: z.string().min(1).max(120),
    submittedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const adminCandyXpActivityDetailSchema = adminCandyXpActivitySchema
  .extend({
    interactiveFields: z.array(adminCandyXpInteractiveFieldSchema).max(120),
    questions: z.array(adminCandyXpQuestionSchema).max(30),
    submissions: z.array(adminCandyXpSubmissionSchema).max(50),
  })
  .strict();

const adminCandyXpCatalogSchema = z
  .object({
    activities: z.array(adminCandyXpActivitySchema).max(50),
    generatedAt: z.string().datetime(),
    hasMore: z.boolean(),
    nextCursor: z.string().min(1).max(200).nullable(),
    ranking: z
      .object({
        generatedAt: z.string().datetime(),
        topEntries: z
          .array(
            z
              .object({
                level: z.number().int().positive(),
                name: z.string().min(1).max(120),
                position: z.number().int().positive(),
                role: z.enum(["STUDENT", "TEACHER"]),
                totalXp: nonNegativeInteger,
              })
              .strict(),
          )
          .max(10),
        totalRanked: nonNegativeInteger,
      })
      .strict(),
    summary: z
      .object({
        archived: nonNegativeInteger,
        draft: nonNegativeInteger,
        pendingReviews: nonNegativeInteger,
        published: nonNegativeInteger,
        total: nonNegativeInteger,
      })
      .strict(),
  })
  .strict();

const adminCandyXpDetailSchema = z
  .object({
    activity: adminCandyXpActivityDetailSchema,
    students: z.array(studentOptionSchema).max(500),
  })
  .strict();

export const adminCandyXpResponseSchema = z
  .object({ catalog: adminCandyXpCatalogSchema, ok: z.literal(true) })
  .strict();
export const adminCandyXpActivityResponseSchema = z
  .object({ detail: adminCandyXpDetailSchema, ok: z.literal(true) })
  .strict();
export const adminCandyXpActivityMutationResponseSchema = z
  .object({
    message: z.string().min(1).max(300),
    ok: z.literal(true),
    result: z
      .object({
        activity: adminCandyXpActivitySchema,
        replayed: z.boolean(),
      })
      .strict(),
  })
  .strict();
export const adminCandyXpReviewMutationResponseSchema = z
  .object({
    message: z.string().min(1).max(300),
    ok: z.literal(true),
    result: z
      .object({
        replayed: z.boolean(),
        submission: adminCandyXpSubmissionSchema,
      })
      .strict(),
  })
  .strict();

export type MobileAdminCandyXp = z.infer<typeof adminCandyXpCatalogSchema>;
export type MobileAdminCandyXpActivity = z.infer<
  typeof adminCandyXpActivitySchema
>;
export type MobileAdminCandyXpDetail = z.infer<
  typeof adminCandyXpDetailSchema
>;
export type MobileAdminCandyXpSubmission = z.infer<
  typeof adminCandyXpSubmissionSchema
>;
export type AdminCandyXpInput = {
  cursor?: string;
  limit?: number;
  query?: string;
  status?: z.infer<typeof candyXpActivityStatusSchema> | "ALL";
};
export type AdminCandyXpActivityUpdateInput = {
  category: string;
  confirmChange: true;
  description: string | null;
  expectedUpdatedAt: string;
  level: string;
  operationId: string;
  releaseMode: z.infer<typeof releaseModeSchema>;
  status: z.infer<typeof candyXpActivityStatusSchema>;
  studentProfileId: string | null;
  title: string;
  xpReward: number;
};
export type AdminCandyXpReviewInput = {
  confirmReview: true;
  expectedUpdatedAt: string;
  feedback: string | null;
  operationId: string;
  outcome: "APPROVE" | "RETURN";
};
export type AdminCandyXpActivityMutation = z.infer<
  typeof adminCandyXpActivityMutationResponseSchema
>["result"] & { message: string };
export type AdminCandyXpReviewMutation = z.infer<
  typeof adminCandyXpReviewMutationResponseSchema
>["result"] & { message: string };
