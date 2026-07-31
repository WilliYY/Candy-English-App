import { z } from "zod";

const nonNegativeInteger = z.number().int().nonnegative();
const percentage = z.number().min(0).max(100);

const candyXpSubmissionSchema = z
  .object({
    autoScorePercent: percentage.nullable(),
    awardedXp: nonNegativeInteger.nullable(),
    feedback: z.string().nullable(),
    id: z.string().min(1),
    status: z.enum(["DRAFT", "RETURNED", "REVIEWED", "SUBMITTED"]),
    submittedAt: z.string().datetime().nullable(),
  })
  .strict();

export const candyXpAnswerSchema = z
  .object({
    questionId: z.string().min(1),
    value: z.string().max(20_000),
  })
  .strict();

const candyXpActivitySchema = z
  .object({
    assetKind: z.enum(["IMAGE", "PDF"]).nullable(),
    assetPageCount: nonNegativeInteger.nullable(),
    category: z.string(),
    description: z.string().nullable(),
    id: z.string().min(1),
    interactiveFieldCount: nonNegativeInteger,
    level: z.string(),
    questionCount: nonNegativeInteger,
    submission: candyXpSubmissionSchema.nullable(),
    title: z.string().min(1),
    xpReward: nonNegativeInteger,
  })
  .strict();

const candyXpProfileSchema = z
  .object({
    badgeCount: nonNegativeInteger,
    level: z.number().int().positive(),
    longestStreakDays: nonNegativeInteger,
    progressPercent: percentage,
    progressXp: nonNegativeInteger,
    requiredXp: z.number().int().positive(),
    streakDays: nonNegativeInteger,
    totalXp: nonNegativeInteger,
    xpToNextLevel: nonNegativeInteger,
  })
  .strict();

const candyXpRankingEntrySchema = z
  .object({
    isCurrentUser: z.boolean(),
    level: z.number().int().positive(),
    name: z.string().min(1),
    position: z.number().int().positive(),
    progressPercent: percentage,
    totalXp: nonNegativeInteger,
    xpToNextLevel: nonNegativeInteger,
  })
  .strict();

const candyXpRankingSchema = z
  .object({
    currentUser: z
      .object({
        hasXp: z.boolean(),
        position: z.number().int().positive().nullable(),
        totalInCategory: nonNegativeInteger,
        totalXp: nonNegativeInteger,
        xpToNextLevel: nonNegativeInteger,
      })
      .strict()
      .nullable(),
    generatedAt: z.string().datetime(),
    topEntries: z.array(candyXpRankingEntrySchema),
    totalRanked: nonNegativeInteger,
  })
  .strict();

export const candyXpResponseSchema = z
  .object({
    candyXp: z
      .object({
        activities: z.array(candyXpActivitySchema),
        profile: candyXpProfileSchema,
        ranking: candyXpRankingSchema,
        recentEvents: z.array(
          z
            .object({
              occurredAt: z.string().datetime(),
              sourceLabel: z.string().min(1),
              xp: nonNegativeInteger,
            })
            .strict(),
        ),
        sources: z.array(
          z
            .object({
              label: z.string().min(1),
              value: nonNegativeInteger,
              xp: nonNegativeInteger,
            })
            .strict(),
        ),
      })
      .strict(),
    ok: z.literal(true),
  })
  .strict();

export type MobileStudentCandyXp = z.infer<
  typeof candyXpResponseSchema
>["candyXp"];

const candyXpActivitySubmissionDetailSchema = candyXpSubmissionSchema
  .extend({
    answers: z.array(candyXpAnswerSchema).max(140),
  })
  .strict();

const candyXpQuestionOptionSchema = z
  .object({
    match: z.string().optional(),
    text: z.string().min(1),
  })
  .strict();

const candyXpQuestionSchema = z
  .object({
    id: z.string().min(1),
    options: z.array(candyXpQuestionOptionSchema),
    prompt: z.string().min(1),
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

const candyXpInteractiveFieldSchema = z
  .object({
    height: z.number().positive().max(100),
    id: z.string().min(1),
    label: z.string().nullable(),
    page: z.number().int().positive(),
    placeholder: z.string().nullable(),
    required: z.boolean(),
    sortOrder: nonNegativeInteger,
    type: z.enum([
      "CHECKBOX",
      "DRAWING",
      "LONG_TEXT",
      "SHORT_TEXT",
      "TINY_TEXT",
    ]),
    width: z.number().positive().max(100),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .strict();

const candyXpActivityDetailSchema = z
  .object({
    asset: z
      .object({
        fileName: z.string().min(1),
        kind: z.enum(["IMAGE", "PDF"]),
        mimeType: z.enum([
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
        ]),
        pageCount: z.number().int().positive(),
        sizeBytes: z.number().int().positive(),
      })
      .strict()
      .nullable(),
    canSubmit: z.boolean(),
    category: z.string(),
    description: z.string().nullable(),
    id: z.string().min(1),
    interactiveFields: z.array(candyXpInteractiveFieldSchema),
    level: z.string(),
    questions: z.array(candyXpQuestionSchema),
    submission: candyXpActivitySubmissionDetailSchema.nullable(),
    title: z.string().min(1),
    xpReward: nonNegativeInteger,
  })
  .strict();

export const candyXpActivityResponseSchema = z
  .object({
    activity: candyXpActivityDetailSchema,
    ok: z.literal(true),
  })
  .strict();

export const candyXpActivityActionResponseSchema = z
  .object({
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
    submission: candyXpActivitySubmissionDetailSchema,
  })
  .strict();

export type MobileCandyXpAnswer = z.infer<typeof candyXpAnswerSchema>;
export type MobileCandyXpActivity = z.infer<
  typeof candyXpActivityDetailSchema
>;
export type MobileCandyXpActivityAction = z.infer<
  typeof candyXpActivityActionResponseSchema
>;
