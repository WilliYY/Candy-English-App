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
