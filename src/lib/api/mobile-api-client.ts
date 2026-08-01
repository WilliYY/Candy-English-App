import { z } from "zod";

import {
  adminUserResponseSchema,
  adminUsersResponseSchema,
  type AdminUsersInput,
  type MobileAdminUserDetail,
  type MobileAdminUserList,
} from "@/lib/api/admin-users-contracts";
import {
  authSessionSchema,
  authUserSchema,
  type AuthSession,
  type AuthSessionStore,
  type AuthUser,
} from "@/lib/auth/auth-session";
import {
  avatarUploadResponseSchema,
  studentProfileResponseSchema,
  studentProfileUpdateResponseSchema,
  type MobileStudentProfile,
  type MobileStudentProfileUpdate,
} from "@/lib/api/profile-contracts";
import {
  candyXpActivityActionResponseSchema,
  candyXpActivityResponseSchema,
  candyXpResponseSchema,
  teacherCandyXpResponseSchema,
  type MobileCandyXpActivity,
  type MobileCandyXpAnswer,
  type MobileStudentCandyXp,
  type MobileTeacherCandyXp,
} from "@/lib/api/candy-xp-contracts";
import {
  teacherCattyManagementResponseSchema,
  teacherCattyMutationResponseSchema,
  type MobileTeacherCattyManagement,
  type TeacherCattyArtifactInput,
  type TeacherCattyArtifactStatusInput,
  type TeacherCattyLearningInput,
} from "@/lib/api/teacher-catty-contracts";

export type {
  AdminUsersInput,
  MobileAdminUserDetail,
  MobileAdminUserList,
  MobileAdminUserListItem,
  MobileAdminUserRole,
} from "@/lib/api/admin-users-contracts";
export type {
  MobileStudentProfile,
  MobileStudentProfileUpdate,
} from "@/lib/api/profile-contracts";
export type {
  MobileCandyXpActivity,
  MobileCandyXpActivityAction,
  MobileCandyXpAnswer,
  MobileStudentCandyXp,
  MobileTeacherCandyXp,
} from "@/lib/api/candy-xp-contracts";
export type {
  MobileTeacherCattyArtifactStatus,
  MobileTeacherCattyLearningCategory,
  MobileTeacherCattyManagement,
  TeacherCattyArtifactInput,
  TeacherCattyArtifactStatusInput,
  TeacherCattyLearningInput,
} from "@/lib/api/teacher-catty-contracts";

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

type DeviceIdentity = {
  appVersion?: string;
  installationId: string;
  name?: string;
  platform: "ANDROID" | "IOS" | "WEB";
};

type MobileApiClientOptions = {
  baseUrl: string;
  createRequestId?: () => string;
  fetcher?: Fetcher;
  getDeviceIdentity: () => Promise<DeviceIdentity>;
  onSessionCleared?: () => Promise<void>;
  sessionStore: AuthSessionStore;
  timeoutMs?: number;
};

const successSessionSchema = authSessionSchema.extend({
  ok: z.literal(true),
});

const meResponseSchema = z
  .object({
    ok: z.literal(true),
    user: authUserSchema,
  })
  .strict();

const overviewMetricSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    unit: z.enum(["CENTS", "COUNT", "XP"]),
    value: z.number().int().nonnegative(),
  })
  .strict();

const overviewSchema = z
  .object({
    generatedAt: z.string().datetime(),
    metrics: z.array(overviewMetricSchema),
    nextItem: z
      .object({
        at: z.string().datetime().nullable(),
        id: z.string().min(1),
        label: z.string().min(1),
        title: z.string().min(1),
      })
      .strict()
      .nullable(),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  })
  .strict();

const overviewResponseSchema = z
  .object({
    ok: z.literal(true),
    overview: overviewSchema,
  })
  .strict();

export type MobileOverview = z.infer<typeof overviewSchema>;

const moduleItemSchema = z
  .object({
    amountCents: z.number().int().nonnegative().optional(),
    detail: z.string().optional(),
    fileName: z.string().min(1).optional(),
    id: z.string().min(1),
    mimeType: z.string().min(1).optional(),
    occurredAt: z.string().datetime().optional(),
    sizeBytes: z.number().int().positive().optional(),
    status: z.string().optional(),
    subtitle: z.string().optional(),
    title: z.string().min(1),
  })
  .strict();

const moduleDataSchema = z
  .object({
    emptyMessage: z.string().min(1),
    items: z.array(moduleItemSchema),
    slug: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

const moduleResponseSchema = z
  .object({
    data: moduleDataSchema,
    ok: z.literal(true),
  })
  .strict();

export type MobileModuleData = z.infer<typeof moduleDataSchema>;

const lessonSchema = z
  .object({
    description: z.string().nullable(),
    homeworks: z.array(
      z
        .object({
          dueDate: z.string().datetime().nullable(),
          id: z.string().min(1),
          submissionStatus: z
            .enum(["DRAFT", "SUBMITTED", "RETURNED", "REVIEWED"])
            .nullable(),
          title: z.string().min(1),
        })
        .strict(),
    ),
    id: z.string().min(1),
    materials: z.array(
      z
        .object({
          content: z.string().nullable(),
          id: z.string().min(1),
          title: z.string().min(1),
          type: z.enum(["LINK", "TEXT"]),
          url: z.string().url().nullable(),
        })
        .strict(),
    ),
    scheduledAt: z.string().datetime().nullable(),
    teacherName: z.string().min(1),
    title: z.string().min(1),
    vocabularyItems: z.array(
      z
        .object({
          example: z.string().nullable(),
          id: z.string().min(1),
          term: z.string().min(1),
          translation: z.string().min(1),
        })
        .strict(),
    ),
  })
  .strict();

const lessonResponseSchema = z
  .object({
    lesson: lessonSchema,
    ok: z.literal(true),
  })
  .strict();

export type MobileLesson = z.infer<typeof lessonSchema>;

const teacherLessonSchema = z
  .object({
    description: z.string().nullable(),
    homeworks: z
      .array(
        z
          .object({
            dueDate: z.string().datetime().nullable(),
            id: z.string().min(1),
            status: z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]),
            title: z.string().min(1),
          })
          .strict(),
      )
      .max(100),
    id: z.string().min(1),
    materials: z
      .array(
        z
          .object({
            content: z.string().nullable(),
            id: z.string().min(1),
            title: z.string().min(1),
            type: z.enum(["LINK", "TEXT"]),
            url: z.string().url().nullable(),
          })
          .strict(),
      )
      .max(100),
    scheduledAt: z.string().datetime().nullable(),
    status: z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]),
    studentName: z.string().min(1).nullable(),
    teacherName: z.string().min(1),
    title: z.string().min(1),
    vocabularyItems: z
      .array(
        z
          .object({
            example: z.string().nullable(),
            id: z.string().min(1),
            term: z.string().min(1),
            translation: z.string().min(1),
          })
          .strict(),
      )
      .max(200),
  })
  .strict();

const teacherLessonResponseSchema = z
  .object({
    lesson: teacherLessonSchema,
    ok: z.literal(true),
  })
  .strict();

export type MobileTeacherLesson = z.infer<typeof teacherLessonSchema>;

const teacherLessonMaterialInputSchema = z
  .object({
    content: z.string().max(4000).nullable(),
    title: z.string().min(1).max(160),
    type: z.enum(["LINK", "TEXT"]),
    url: z.string().url().max(500).nullable(),
  })
  .strict();

const teacherLessonVocabularyInputSchema = z
  .object({
    example: z.string().max(500).nullable(),
    term: z.string().min(1).max(120),
    translation: z.string().min(1).max(160),
  })
  .strict();

const teacherLessonMutationInputSchema = z
  .object({
    description: z.string().max(1200).nullable(),
    materials: z.array(teacherLessonMaterialInputSchema).max(25),
    operationId: z.string().uuid(),
    scheduledAt: z.string().datetime().nullable(),
    status: z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]),
    studentProfileId: z.string().min(1).max(80).nullable(),
    title: z.string().min(3).max(160),
    vocabularyItems: z
      .array(teacherLessonVocabularyInputSchema)
      .max(100),
  })
  .strict();

const teacherLessonUpdateInputSchema = teacherLessonMutationInputSchema
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .strict();

const teacherLessonEditorSchema = teacherLessonMutationInputSchema
  .omit({ operationId: true })
  .extend({
    id: z.string().min(1),
    updatedAt: z.string().datetime(),
  })
  .strict();

const teacherLessonEditorResponseSchema = z
  .object({ lesson: teacherLessonEditorSchema, ok: z.literal(true) })
  .strict();

const teacherLessonOptionsSchema = z
  .object({
    students: z
      .array(
        z
          .object({
            id: z.string().min(1),
            level: z.string().nullable(),
            name: z.string().min(1),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

const teacherLessonOptionsResponseSchema = teacherLessonOptionsSchema
  .extend({ ok: z.literal(true) })
  .strict();

const teacherLessonMutationResponseSchema = z
  .object({
    lessonId: z.string().min(1),
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type MobileTeacherLessonEditor = z.infer<
  typeof teacherLessonEditorSchema
>;
export type MobileTeacherLessonMutationInput = z.infer<
  typeof teacherLessonMutationInputSchema
>;
export type MobileTeacherLessonMutationResult = z.infer<
  typeof teacherLessonMutationResponseSchema
>;
export type MobileTeacherLessonOptions = z.infer<
  typeof teacherLessonOptionsSchema
>;
export type MobileTeacherLessonUpdateInput = z.infer<
  typeof teacherLessonUpdateInputSchema
>;

const teacherHomeworkQuestionInputSchema = z
  .object({
    expectedAnswer: z.string().max(1000).nullable(),
    prompt: z.string().min(3).max(1000),
  })
  .strict();

const teacherHomeworkMutationInputSchema = z
  .object({
    dueDate: z.string().datetime().nullable(),
    instructions: z.string().max(2000).nullable(),
    lessonId: z.string().min(1).max(80),
    operationId: z.string().uuid(),
    questions: z.array(teacherHomeworkQuestionInputSchema).max(50),
    status: z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]),
    studentProfileIds: z.array(z.string().min(1).max(80)).min(1).max(50),
    title: z.string().min(3).max(160),
  })
  .strict();

const teacherHomeworkUpdateInputSchema = teacherHomeworkMutationInputSchema
  .extend({ expectedUpdatedAt: z.string().datetime() })
  .strict();

const teacherHomeworkEditorSchema = teacherHomeworkMutationInputSchema
  .omit({ operationId: true })
  .extend({
    assetFileName: z.string().min(1).nullable(),
    hasSubmissions: z.boolean(),
    id: z.string().min(1),
    interactiveFieldCount: z.number().int().min(0),
    kind: z.enum(["INTERACTIVE", "TEXT"]),
    questions: z
      .array(
        teacherHomeworkQuestionInputSchema.extend({ id: z.string().min(1) }),
      )
      .max(50),
    studentProfileIds: z.array(z.string().min(1).max(80)).max(50),
    updatedAt: z.string().datetime(),
  })
  .strict();

const teacherHomeworkEditorResponseSchema = z
  .object({ homework: teacherHomeworkEditorSchema, ok: z.literal(true) })
  .strict();

const teacherHomeworkOptionsSchema = z
  .object({
    lessons: z
      .array(
        z
          .object({
            id: z.string().min(1),
            status: z.enum(["ARCHIVED", "DRAFT", "PUBLISHED"]),
            studentProfileId: z.string().min(1).nullable(),
            title: z.string().min(1),
          })
          .strict(),
      )
      .max(100),
    students: z
      .array(
        z
          .object({
            id: z.string().min(1),
            level: z.string().nullable(),
            name: z.string().min(1),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

const teacherHomeworkOptionsResponseSchema = teacherHomeworkOptionsSchema
  .extend({ ok: z.literal(true) })
  .strict();

const teacherHomeworkMutationResponseSchema = z
  .object({
    homeworkId: z.string().min(1),
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const teacherHomeworkDuplicateInputSchema = z
  .object({
    operationId: z.string().uuid(),
    studentProfileIds: z.array(z.string().min(1).max(80)).min(1).max(50),
  })
  .strict();

const teacherHomeworkDuplicateResponseSchema = z
  .object({
    createdCount: z.number().int().min(0),
    homeworkIds: z.array(z.string().min(1)).max(50),
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
    skippedCount: z.number().int().min(0),
  })
  .strict();

const teacherHomeworkDeleteInputSchema = z
  .object({
    expectedUpdatedAt: z.string().datetime(),
    operationId: z.string().uuid(),
  })
  .strict();

const teacherHomeworkDeleteResponseSchema = z
  .object({
    homeworkId: z.string().min(1),
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
  })
  .strict();

export type MobileTeacherHomeworkDeleteInput = z.infer<
  typeof teacherHomeworkDeleteInputSchema
>;
export type MobileTeacherHomeworkDeleteResult = z.infer<
  typeof teacherHomeworkDeleteResponseSchema
>;
export type MobileTeacherHomeworkDuplicateInput = z.infer<
  typeof teacherHomeworkDuplicateInputSchema
>;
export type MobileTeacherHomeworkDuplicateResult = z.infer<
  typeof teacherHomeworkDuplicateResponseSchema
>;
export type MobileTeacherHomeworkEditor = z.infer<
  typeof teacherHomeworkEditorSchema
>;
export type MobileTeacherHomeworkMutationInput = z.infer<
  typeof teacherHomeworkMutationInputSchema
>;
export type MobileTeacherHomeworkMutationResult = z.infer<
  typeof teacherHomeworkMutationResponseSchema
>;
export type MobileTeacherHomeworkOptions = z.infer<
  typeof teacherHomeworkOptionsSchema
>;
export type MobileTeacherHomeworkUpdateInput = z.infer<
  typeof teacherHomeworkUpdateInputSchema
>;

const teacherInteractiveFieldInputSchema = z
  .object({
    height: z.number().min(1).max(100),
    id: z.string().min(1).max(80).nullable(),
    label: z.string().max(80).nullable(),
    page: z.number().int().min(1).max(20),
    placeholder: z.string().max(2000).nullable(),
    required: z.boolean(),
    type: z.enum([
      "CHECKBOX",
      "DRAWING",
      "LISTENING",
      "LONG_TEXT",
      "SHORT_TEXT",
      "TINY_TEXT",
    ]),
    width: z.number().min(1).max(100),
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  })
  .strict();

const teacherInteractiveFieldSchema = teacherInteractiveFieldInputSchema
  .extend({ id: z.string().min(1).max(80), sortOrder: z.number().int().min(0) })
  .strict();

const teacherInteractiveFieldEditorSchema = z
  .object({
    assetFileName: z.string().min(1).nullable(),
    fields: z.array(teacherInteractiveFieldSchema).max(120),
    hasSubmissions: z.boolean(),
    homeworkId: z.string().min(1),
    pageCount: z.number().int().min(1).max(20),
    replayed: z.boolean().optional(),
    title: z.string().min(1),
    updatedAt: z.string().datetime(),
  })
  .strict();

const teacherInteractiveFieldEditorResponseSchema = z
  .object({ editor: teacherInteractiveFieldEditorSchema, ok: z.literal(true) })
  .strict();

const teacherInteractiveFieldUpdateInputSchema = z
  .object({
    expectedUpdatedAt: z.string().datetime(),
    fields: z.array(teacherInteractiveFieldInputSchema).max(120),
    operationId: z.string().uuid(),
  })
  .strict();

const teacherInteractiveFieldUpdateResponseSchema = z
  .object({
    editor: teacherInteractiveFieldEditorSchema,
    message: z.string().min(1),
    ok: z.literal(true),
  })
  .strict();

export type MobileTeacherInteractiveField = z.infer<
  typeof teacherInteractiveFieldSchema
>;
export type MobileTeacherInteractiveFieldDraft = z.infer<
  typeof teacherInteractiveFieldInputSchema
>;
export type MobileTeacherInteractiveFieldEditor = z.infer<
  typeof teacherInteractiveFieldEditorSchema
>;
export type MobileTeacherInteractiveFieldUpdateInput = z.infer<
  typeof teacherInteractiveFieldUpdateInputSchema
>;

const teacherPreRegistrationSchema = z
  .object({
    agenda: z
      .object({
        complete: z.boolean(),
        days: z.string().min(1).nullable(),
        time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
      })
      .strict(),
    canConvert: z.boolean(),
    converted: z.boolean(),
    email: z.string().email().nullable(),
    englishGoal: z.string().min(1),
    estimatedLevel: z.string().min(1).nullable(),
    finance: z.object({ complete: z.boolean() }).strict(),
    fullName: z.string().min(1),
    id: z.string().min(1),
    phone: z.string().min(1),
    status: z.enum([
      "APPROVED",
      "CONTACTED",
      "PENDING",
      "READY_TO_CONVERT",
      "REJECTED",
      "WAITING_PAYMENT",
    ]),
    statusNote: z.string().nullable(),
    unit: z.enum(["DOURADINA", "IVATE"]),
    updatedAt: z.string().datetime(),
  })
  .strict();

const teacherPreRegistrationResponseSchema = z
  .object({ ok: z.literal(true), preRegistration: teacherPreRegistrationSchema })
  .strict();

const teacherPreRegistrationConversionInputSchema = z
  .object({
    confirmConversion: z.literal(true),
    confirmMissingAgendaData: z.boolean(),
    emailForLogin: z.string().trim().email().max(254),
    initialPassword: z.string().trim().min(8).max(120),
    operationId: z.string().uuid(),
  })
  .strict();

const teacherPreRegistrationConversionResponseSchema = z
  .object({
    message: z.string().min(1),
    ok: z.literal(true),
    preRegistration: teacherPreRegistrationSchema.nullable(),
  })
  .strict();

export type MobileTeacherPreRegistration = z.infer<
  typeof teacherPreRegistrationSchema
>;
export type MobileTeacherPreRegistrationConversionInput = z.infer<
  typeof teacherPreRegistrationConversionInputSchema
>;

const teacherSubmissionStatusSchema = z.enum([
  "RETURNED",
  "REVIEWED",
  "SUBMITTED",
]);

const teacherSubmissionQueueItemSchema = z
  .object({
    feedbackPresent: z.boolean(),
    homeworkId: z.string().min(1),
    homeworkKind: z.enum(["INTERACTIVE", "TEXT"]),
    homeworkTitle: z.string().min(1),
    id: z.string().min(1),
    lessonTitle: z.string().min(1),
    reviewedAt: z.string().datetime().nullable(),
    status: teacherSubmissionStatusSchema,
    studentLevel: z.string().nullable(),
    studentName: z.string().min(1),
    submittedAt: z.string().datetime(),
  })
  .strict();

const teacherSubmissionQueueResponseSchema = z
  .object({
    hasMore: z.boolean(),
    ok: z.literal(true),
    submissions: z.array(teacherSubmissionQueueItemSchema).max(100),
  })
  .strict();

const teacherSubmissionDetailSchema = z
  .object({
    answers: z
      .array(
        z
          .object({
            id: z.string().min(1),
            label: z.string().min(1),
            type: z.enum([
              "CHECKBOX",
              "DRAWING",
              "LISTENING",
              "LONG_TEXT",
              "SHORT_TEXT",
              "TEXT",
              "TINY_TEXT",
            ]),
            value: z.string().max(1_000_000),
          })
          .strict(),
      )
      .max(120),
    feedback: z.string().nullable(),
    hasAnnotations: z.boolean(),
    homework: z
      .object({
        id: z.string().min(1),
        instructions: z.string().nullable(),
        kind: z.enum(["INTERACTIVE", "TEXT"]),
        lessonTitle: z.string().min(1),
        questions: z
          .array(
            z
              .object({
                expectedAnswer: z.string().nullable(),
                id: z.string().min(1),
                prompt: z.string().min(1),
              })
              .strict(),
          )
          .max(50),
        title: z.string().min(1),
      })
      .strict(),
    id: z.string().min(1),
    reviewedAt: z.string().datetime().nullable(),
    status: teacherSubmissionStatusSchema,
    student: z
      .object({
        id: z.string().min(1),
        level: z.string().nullable(),
        name: z.string().min(1),
      })
      .strict(),
    submittedAt: z.string().datetime(),
  })
  .strict();

const teacherSubmissionDetailResponseSchema = z
  .object({
    ok: z.literal(true),
    submission: teacherSubmissionDetailSchema,
  })
  .strict();

const teacherSubmissionVersionInputSchema = z.object({
  expectedReviewedAt: z.string().datetime().nullable(),
  expectedStatus: z.enum(["REVIEWED", "SUBMITTED"]),
  expectedSubmittedAt: z.string().datetime(),
  operationId: z.string().uuid(),
});

const teacherSubmissionReviewInputSchema = teacherSubmissionVersionInputSchema
  .extend({ feedback: z.string().trim().min(2).max(6000) })
  .strict();

const teacherSubmissionRedoInputSchema = teacherSubmissionVersionInputSchema
  .extend({ feedback: z.string().trim().max(6000).nullable() })
  .strict();

const teacherSubmissionMutationResponseSchema = z
  .object({
    feedback: z.string().nullable(),
    message: z.string().min(1),
    ok: z.literal(true),
    replayed: z.boolean(),
    reviewedAt: z.string().datetime().nullable(),
    status: teacherSubmissionStatusSchema,
    submissionId: z.string().min(1),
    submittedAt: z.string().datetime(),
  })
  .strict();

export type MobileTeacherSubmissionDetail = z.infer<
  typeof teacherSubmissionDetailSchema
>;
export type MobileTeacherSubmissionMutationResult = z.infer<
  typeof teacherSubmissionMutationResponseSchema
>;
export type MobileTeacherSubmissionQueue = {
  hasMore: boolean;
  submissions: MobileTeacherSubmissionQueueItem[];
};
export type MobileTeacherSubmissionQueueItem = z.infer<
  typeof teacherSubmissionQueueItemSchema
>;
export type MobileTeacherSubmissionRedoInput = z.infer<
  typeof teacherSubmissionRedoInputSchema
>;
export type MobileTeacherSubmissionReviewInput = z.infer<
  typeof teacherSubmissionReviewInputSchema
>;

const chatThreadSchema = z
  .object({
    id: z.string().min(1),
    lastMessage: z.string().nullable(),
    lastMessageAt: z.string().datetime(),
    peerName: z.string().min(1),
    studentProfileId: z.string().min(1),
    teacherProfileId: z.string().min(1),
  })
  .strict();

const chatMessageSchema = z
  .object({
    body: z.string(),
    createdAt: z.string().datetime(),
    id: z.string().min(1),
    isMine: z.boolean(),
    senderName: z.string().min(1),
  })
  .strict();

const chatThreadsResponseSchema = z
  .object({
    ok: z.literal(true),
    threads: z.array(chatThreadSchema),
  })
  .strict();

const chatMessagesResponseSchema = z
  .object({
    messages: z.array(chatMessageSchema),
    ok: z.literal(true),
  })
  .strict();

const chatSendResponseSchema = z
  .object({
    message: z.string().min(1),
    ok: z.literal(true),
  })
  .strict();

const cattyMessageSchema = z
  .object({
    from: z.enum(["catty", "user"]),
    id: z.string().min(1),
    text: z.string().min(1).max(900),
  })
  .strict();

const cattyHistoryResponseSchema = z
  .object({
    messages: z.array(cattyMessageSchema),
    ok: z.literal(true),
  })
  .strict();

const cattyReplyResponseSchema = z
  .object({
    messageId: z.string().min(1).optional(),
    ok: z.literal(true),
    reply: z.string().min(1).max(900),
    source: z.enum(["fallback", "gemini", "openai"]),
  })
  .strict();

const secureLiveClassUrlSchema = z.string().url().refine((value) => {
  const parsed = new URL(value);

  return (
    parsed.protocol === "https:" &&
    parsed.username.length === 0 &&
    parsed.password.length === 0
  );
});

const liveClassSessionSchema = z
  .object({
    createdAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable(),
    id: z.string().min(1),
    isLive: z.boolean(),
    joinUrl: secureLiveClassUrlSchema.nullable(),
    startsAt: z.string().datetime().nullable(),
    studentName: z.string().min(1).nullable(),
    teacherName: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

const liveClassOverviewSchema = z
  .object({
    generatedAt: z.string().datetime(),
    maintenance: z
      .object({
        enabled: z.boolean(),
        message: z.string().min(1).nullable(),
      })
      .strict(),
    role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
    sessions: z.array(liveClassSessionSchema),
  })
  .strict();

const liveClassResponseSchema = z
  .object({
    liveClass: liveClassOverviewSchema,
    ok: z.literal(true),
  })
  .strict();

const notificationTargetSchema = z.discriminatedUnion("kind", [
  z
    .object({
      id: z.null(),
      kind: z.literal("CANDY_XP"),
    })
    .strict(),
  z
    .object({
      id: z.string().min(1).max(200),
      kind: z.literal("HOMEWORK"),
    })
    .strict(),
  z
    .object({
      id: z.string().min(1).max(200),
      kind: z.literal("LESSON"),
    })
    .strict(),
]);

const notificationSchema = z
  .object({
    eventAt: z.string().datetime(),
    id: z.string().min(1).max(240),
    summary: z.string().min(1).max(300),
    target: notificationTargetSchema,
    title: z.string().min(1).max(160),
    type: z.enum(["ACHIEVEMENT", "CLASS", "FEEDBACK", "HOMEWORK"]),
  })
  .strict();

const notificationInboxSchema = z
  .object({
    generatedAt: z.string().datetime(),
    items: z.array(notificationSchema).max(50),
  })
  .strict();

const notificationResponseSchema = z
  .object({
    notifications: notificationInboxSchema,
    ok: z.literal(true),
  })
  .strict();

export type MobileChatThread = z.infer<typeof chatThreadSchema>;
export type MobileChatMessage = z.infer<typeof chatMessageSchema>;
export type MobileCattyMessage = z.infer<typeof cattyMessageSchema>;
export type MobileCattyContext = {
  area: "admin" | "student" | "teacher";
  task?: string;
};
export type MobileLiveClassOverview = z.infer<
  typeof liveClassOverviewSchema
>;
export type MobileNotificationInbox = z.infer<
  typeof notificationInboxSchema
>;
export type MobileNotificationTarget = z.infer<
  typeof notificationTargetSchema
>;

const homeworkSchema = z
  .object({
    answer: z.string(),
    canSubmit: z.boolean(),
    dueDate: z.string().datetime().nullable(),
    feedback: z.string().nullable(),
    id: z.string().min(1),
    instructions: z.string().nullable(),
    interactiveAnswers: z.array(
      z
        .object({
          fieldId: z.string().min(1),
          value: z.string(),
        })
        .strict(),
    ),
    interactiveFields: z.array(
      z
        .object({
          id: z.string().min(1),
          label: z.string().nullable(),
          placeholder: z.string().nullable(),
          required: z.boolean(),
          sortOrder: z.number().int(),
          type: z.enum([
            "TINY_TEXT",
            "SHORT_TEXT",
            "LONG_TEXT",
            "CHECKBOX",
            "DRAWING",
            "LISTENING",
          ]),
        })
        .strict(),
    ),
    kind: z.enum(["TEXT", "INTERACTIVE"]),
    lessonTitle: z.string().min(1),
    questions: z.array(
      z
        .object({
          id: z.string().min(1),
          prompt: z.string(),
        })
        .strict(),
    ),
    reviewedAt: z.string().datetime().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    submissionStatus: z
      .enum(["DRAFT", "SUBMITTED", "RETURNED", "REVIEWED"])
      .nullable(),
    title: z.string().min(1),
  })
  .strict();

const homeworkResponseSchema = z
  .object({
    homework: homeworkSchema,
    ok: z.literal(true),
  })
  .strict();

const homeworkSubmitResponseSchema = z
  .object({
    message: z.string().min(1),
    ok: z.literal(true),
    submittedAt: z.string().datetime(),
  })
  .strict();

export type MobileHomework = z.infer<typeof homeworkSchema>;
export type MobileInteractiveAnswer = MobileHomework["interactiveAnswers"][number];

const interactiveHomeworkActionResponseSchema = z
  .object({
    message: z.string().min(1),
    ok: z.literal(true),
    status: z.enum(["DRAFT", "SUBMITTED"]),
    submittedAt: z.string().datetime().optional(),
  })
  .strict();

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  ok: z.literal(false),
  requestId: z.string().optional(),
});

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly status: number;

  constructor(
    code: string,
    message: string,
    status: number,
    requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.requestId = requestId;
    this.status = status;
  }
}

function toAuthSession(value: z.infer<typeof successSessionSchema>) {
  return {
    tokens: value.tokens,
    user: value.user,
  };
}

function defaultRequestId() {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createMobileApiClient(options: MobileApiClientOptions) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetcher: Fetcher =
    options.fetcher ?? ((url, init) => fetch(url, init));
  const createRequestId = options.createRequestId ?? defaultRequestId;
  const timeoutMs = options.timeoutMs ?? 15_000;
  let refreshPromise: Promise<AuthSession> | null = null;

  async function clearLocalSession() {
    await options.sessionStore.clear();

    try {
      await options.onSessionCleared?.();
    } catch {
      // Session cleanup must not be blocked by an unavailable cache directory.
    }
  }

  async function readError(response: Response) {
    const body = await response.json().catch(() => null);
    const parsed = errorResponseSchema.safeParse(body);
    const requestId =
      response.headers.get("x-request-id") ??
      (parsed.success ? parsed.data.requestId : undefined);

    return new ApiError(
      parsed.success ? parsed.data.error.code : "REQUEST_FAILED",
      parsed.success
        ? parsed.data.error.message
        : "Não foi possível concluir a solicitação.",
      response.status,
      requestId,
    );
  }

  async function request(
    path: string,
    init: RequestInit,
    accessToken?: string,
    requestTimeoutMs = timeoutMs,
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    const headers = new Headers(init.headers);

    headers.set("accept", "application/json");
    headers.set("x-request-id", createRequestId());

    if (typeof init.body === "string" && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }

    try {
      return await fetcher(`${baseUrl}/api/mobile/v1${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        throw new ApiError(
          "TIMEOUT",
          "A conexão demorou mais que o esperado.",
          408,
        );
      }

      throw new ApiError(
        "NETWORK_ERROR",
        "Não foi possível conectar ao Candy English.",
        0,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async function rotateSession() {
    const session = await options.sessionStore.get();

    if (!session) {
      throw new ApiError(
        "SESSION_EXPIRED",
        "Entre novamente para continuar.",
        401,
      );
    }

    const device = await options.getDeviceIdentity();
    const response = await request("/auth/refresh", {
      body: JSON.stringify({
        installationId: device.installationId,
        refreshToken: session.tokens.refreshToken,
      }),
      method: "POST",
    });

    if (!response.ok) {
      await clearLocalSession();
      throw new ApiError(
        "SESSION_EXPIRED",
        "Entre novamente para continuar.",
        response.status,
        response.headers.get("x-request-id") ?? undefined,
      );
    }

    const parsed = successSessionSchema.safeParse(await response.json());

    if (!parsed.success) {
      await clearLocalSession();
      throw new ApiError(
        "INVALID_RESPONSE",
        "O servidor retornou uma resposta inválida.",
        502,
      );
    }

    const nextSession = toAuthSession(parsed.data);
    await options.sessionStore.save(nextSession);

    return nextSession;
  }

  function refreshSessionOnce() {
    if (!refreshPromise) {
      refreshPromise = rotateSession().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  async function authenticatedRequest(
    path: string,
    init: RequestInit,
    requestTimeoutMs = timeoutMs,
  ) {
    let session = await options.sessionStore.get();

    if (!session) {
      throw new ApiError(
        "SESSION_EXPIRED",
        "Entre novamente para continuar.",
        401,
      );
    }

    if (!session.tokens.accessToken) {
      session = await refreshSessionOnce();
    }

    let response = await request(
      path,
      init,
      session.tokens.accessToken,
      requestTimeoutMs,
    );

    if (response.status === 401) {
      const refreshed = await refreshSessionOnce();
      response = await request(
        path,
        init,
        refreshed.tokens.accessToken,
        requestTimeoutMs,
      );
    }

    if (!response.ok) {
      throw await readError(response);
    }

    return response;
  }

  return {
    async getMe(): Promise<AuthUser> {
      const response = await authenticatedRequest("/auth/me", {
        method: "GET",
      });
      const parsed = meResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      const current = await options.sessionStore.get();

      if (current) {
        await options.sessionStore.save({
          ...current,
          user: parsed.data.user,
        });
      }

      return parsed.data.user;
    },

    async getStudentProfile(): Promise<MobileStudentProfile> {
      const response = await authenticatedRequest("/profile", {
        method: "GET",
      });
      const parsed = studentProfileResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.profile;
    },

    async getStudentCandyXp(): Promise<MobileStudentCandyXp> {
      const response = await authenticatedRequest("/candy-xp", {
        method: "GET",
      });
      const parsed = candyXpResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data.candyXp;
    },

    async getTeacherCandyXp(): Promise<MobileTeacherCandyXp> {
      const response = await authenticatedRequest("/teacher/candy-xp", {
        method: "GET",
      });
      const parsed = teacherCandyXpResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou um Candy XP teacher inválido.",
          502,
        );
      }
      return parsed.data.candyXp;
    },

    async getStudentCandyXpActivity(
      activityId: string,
    ): Promise<MobileCandyXpActivity> {
      const response = await authenticatedRequest(
        `/candy-xp/${encodeURIComponent(activityId)}`,
        { method: "GET" },
      );
      const parsed = candyXpActivityResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data.activity;
    },

    async saveCandyXpActivityDraft(
      activityId: string,
      answers: MobileCandyXpAnswer[],
    ) {
      const response = await authenticatedRequest(
        `/candy-xp/${encodeURIComponent(activityId)}/submission`,
        {
          body: JSON.stringify({ answers }),
          method: "PUT",
        },
      );
      const parsed = candyXpActivityActionResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data;
    },

    async submitCandyXpActivity(
      activityId: string,
      answers: MobileCandyXpAnswer[],
    ) {
      const response = await authenticatedRequest(
        `/candy-xp/${encodeURIComponent(activityId)}/submission`,
        {
          body: JSON.stringify({ answers }),
          method: "POST",
        },
      );
      const parsed = candyXpActivityActionResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data;
    },

    async getCandyXpAssetSource(activityId: string) {
      await authenticatedRequest("/auth/me", { method: "GET" });
      const session = await options.sessionStore.get();

      if (!session?.tokens.accessToken) {
        throw new ApiError(
          "SESSION_EXPIRED",
          "Sua sessao expirou. Entre novamente.",
          401,
        );
      }

      return {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
        uri: `${baseUrl}/api/mobile/v1/candy-xp/${encodeURIComponent(
          activityId,
        )}/asset`,
      };
    },

    async updateStudentProfile(input: MobileStudentProfileUpdate) {
      const response = await authenticatedRequest("/profile", {
        body: JSON.stringify(input),
        method: "PATCH",
      });
      const parsed = studentProfileUpdateResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data;
    },

    async getStudentAvatarSource() {
      await authenticatedRequest("/auth/me", { method: "GET" });
      const session = await options.sessionStore.get();

      if (!session?.tokens.accessToken) {
        throw new ApiError(
          "SESSION_EXPIRED",
          "Sua sessão expirou. Entre novamente.",
          401,
        );
      }

      return {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
        uri: `${baseUrl}/api/mobile/v1/profile/avatar`,
      };
    },

    async uploadStudentAvatar(input: {
      mimeType: "image/jpeg";
      name: string;
      uri: string;
    }) {
      const formData = new FormData();
      formData.append(
        "avatar",
        {
          name: input.name,
          type: input.mimeType,
          uri: input.uri,
        } as unknown as Blob,
      );
      const response = await authenticatedRequest("/profile/avatar", {
        body: formData,
        method: "POST",
      });
      const parsed = avatarUploadResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data;
    },

    async getOverview(): Promise<MobileOverview> {
      const response = await authenticatedRequest("/overview", {
        method: "GET",
      });
      const parsed = overviewResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.overview;
    },

    async getAdminUsers(
      input: AdminUsersInput = {},
    ): Promise<MobileAdminUserList> {
      const params = new URLSearchParams();
      if (input.limit !== undefined) params.set("limit", String(input.limit));
      if (input.query) params.set("query", input.query);
      if (input.role) params.set("role", input.role);
      if (input.status) params.set("status", input.status);
      if (input.cursor) params.set("cursor", input.cursor);
      const query = params.toString();
      const response = await authenticatedRequest(
        `/admin/users${query ? `?${query}` : ""}`,
        { method: "GET" },
      );
      const parsed = adminUsersResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma lista de usuarios invalida.",
          502,
        );
      }

      return parsed.data.users;
    },

    async getAdminUser(userId: string): Promise<MobileAdminUserDetail> {
      const response = await authenticatedRequest(
        `/admin/users/${encodeURIComponent(userId)}`,
        { method: "GET" },
      );
      const parsed = adminUserResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou um usuario administrativo invalido.",
          502,
        );
      }

      return parsed.data.user;
    },

    async getModule(slug: string): Promise<MobileModuleData> {
      const response = await authenticatedRequest(
        `/modules/${encodeURIComponent(slug)}`,
        { method: "GET" },
      );
      const parsed = moduleResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.data;
    },

    async getLesson(lessonId: string): Promise<MobileLesson> {
      const response = await authenticatedRequest(
        `/lessons/${encodeURIComponent(lessonId)}`,
        { method: "GET" },
      );
      const parsed = lessonResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.lesson;
    },

    async getTeacherLesson(lessonId: string): Promise<MobileTeacherLesson> {
      const response = await authenticatedRequest(
        `/teacher/lessons/${encodeURIComponent(lessonId)}`,
        { method: "GET" },
      );
      const parsed = teacherLessonResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.lesson;
    },

    async getTeacherLessonOptions(): Promise<MobileTeacherLessonOptions> {
      const response = await authenticatedRequest("/teacher/lessons/options", {
        method: "GET",
      });
      const parsed = teacherLessonOptionsResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return { students: parsed.data.students };
    },

    async getTeacherLessonEditor(
      lessonId: string,
    ): Promise<MobileTeacherLessonEditor> {
      const response = await authenticatedRequest(
        `/teacher/lessons/${encodeURIComponent(lessonId)}/editor`,
        { method: "GET" },
      );
      const parsed = teacherLessonEditorResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.lesson;
    },

    async createTeacherLesson(
      input: MobileTeacherLessonMutationInput,
    ): Promise<MobileTeacherLessonMutationResult> {
      const validated = teacherLessonMutationInputSchema.safeParse(input);

      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os dados da aula.",
          400,
        );
      }

      const response = await authenticatedRequest("/teacher/lessons", {
        body: JSON.stringify(validated.data),
        method: "POST",
      });
      const parsed = teacherLessonMutationResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data;
    },

    async updateTeacherLesson(
      lessonId: string,
      input: MobileTeacherLessonUpdateInput,
    ): Promise<MobileTeacherLessonMutationResult> {
      const validated = teacherLessonUpdateInputSchema.safeParse(input);

      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os dados da aula.",
          400,
        );
      }

      const response = await authenticatedRequest(
        `/teacher/lessons/${encodeURIComponent(lessonId)}/editor`,
        {
          body: JSON.stringify(validated.data),
          method: "PUT",
        },
      );
      const parsed = teacherLessonMutationResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data;
    },

    async getTeacherHomeworkOptions(): Promise<MobileTeacherHomeworkOptions> {
      const response = await authenticatedRequest("/teacher/homeworks/options", {
        method: "GET",
      });
      const parsed = teacherHomeworkOptionsResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return { lessons: parsed.data.lessons, students: parsed.data.students };
    },

    async getTeacherHomeworkEditor(
      homeworkId: string,
    ): Promise<MobileTeacherHomeworkEditor> {
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/editor`,
        { method: "GET" },
      );
      const parsed = teacherHomeworkEditorResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data.homework;
    },

    async createTeacherHomework(
      input: MobileTeacherHomeworkMutationInput,
    ): Promise<MobileTeacherHomeworkMutationResult> {
      const validated = teacherHomeworkMutationInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os dados da tarefa.",
          400,
        );
      }
      const response = await authenticatedRequest("/teacher/homeworks", {
        body: JSON.stringify(validated.data),
        method: "POST",
      });
      const parsed = teacherHomeworkMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async updateTeacherHomework(
      homeworkId: string,
      input: MobileTeacherHomeworkUpdateInput,
    ): Promise<MobileTeacherHomeworkMutationResult> {
      const validated = teacherHomeworkUpdateInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os dados da tarefa.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/editor`,
        { body: JSON.stringify(validated.data), method: "PUT" },
      );
      const parsed = teacherHomeworkMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async duplicateTeacherHomework(
      homeworkId: string,
      input: MobileTeacherHomeworkDuplicateInput,
    ): Promise<MobileTeacherHomeworkDuplicateResult> {
      const validated = teacherHomeworkDuplicateInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os alunos selecionados.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/duplicate`,
        { body: JSON.stringify(validated.data), method: "POST" },
      );
      const parsed = teacherHomeworkDuplicateResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async deleteTeacherHomework(
      homeworkId: string,
      input: MobileTeacherHomeworkDeleteInput,
    ): Promise<MobileTeacherHomeworkDeleteResult> {
      const validated = teacherHomeworkDeleteInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Solicitação de exclusão inválida.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/editor`,
        { body: JSON.stringify(validated.data), method: "DELETE" },
      );
      const parsed = teacherHomeworkDeleteResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async getTeacherInteractiveFields(
      homeworkId: string,
    ): Promise<MobileTeacherInteractiveFieldEditor> {
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/fields`,
        { method: "GET" },
      );
      const parsed = teacherInteractiveFieldEditorResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data.editor;
    },

    async updateTeacherInteractiveFields(
      homeworkId: string,
      input: MobileTeacherInteractiveFieldUpdateInput,
    ) {
      const validated = teacherInteractiveFieldUpdateInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise os campos interativos.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/homeworks/${encodeURIComponent(homeworkId)}/fields`,
        { body: JSON.stringify(validated.data), method: "PUT" },
      );
      const parsed = teacherInteractiveFieldUpdateResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return { editor: parsed.data.editor, message: parsed.data.message };
    },

    async getTeacherPreRegistration(
      requestId: string,
    ): Promise<MobileTeacherPreRegistration> {
      const response = await authenticatedRequest(
        `/teacher/pre-registrations/${encodeURIComponent(requestId)}`,
        { method: "GET" },
      );
      const parsed = teacherPreRegistrationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data.preRegistration;
    },

    async convertTeacherPreRegistration(
      requestId: string,
      input: MobileTeacherPreRegistrationConversionInput,
    ) {
      const validated = teacherPreRegistrationConversionInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise email, senha e confirmações.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/pre-registrations/${encodeURIComponent(requestId)}/convert`,
        { body: JSON.stringify(validated.data), method: "POST" },
      );
      const parsed = teacherPreRegistrationConversionResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return {
        message: parsed.data.message,
        preRegistration: parsed.data.preRegistration,
      };
    },

    async getTeacherSubmissions(): Promise<MobileTeacherSubmissionQueue> {
      const response = await authenticatedRequest("/teacher/submissions", {
        method: "GET",
      });
      const parsed = teacherSubmissionQueueResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return {
        hasMore: parsed.data.hasMore,
        submissions: parsed.data.submissions,
      };
    },

    async getTeacherSubmission(
      submissionId: string,
    ): Promise<MobileTeacherSubmissionDetail> {
      const response = await authenticatedRequest(
        `/teacher/submissions/${encodeURIComponent(submissionId)}`,
        { method: "GET" },
      );
      const parsed = teacherSubmissionDetailResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data.submission;
    },

    async reviewTeacherSubmission(
      submissionId: string,
      input: MobileTeacherSubmissionReviewInput,
    ): Promise<MobileTeacherSubmissionMutationResult> {
      const validated = teacherSubmissionReviewInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise o feedback antes de enviar.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/submissions/${encodeURIComponent(submissionId)}/review`,
        { body: JSON.stringify(validated.data), method: "POST" },
      );
      const parsed = teacherSubmissionMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async redoTeacherSubmission(
      submissionId: string,
      input: MobileTeacherSubmissionRedoInput,
    ): Promise<MobileTeacherSubmissionMutationResult> {
      const validated = teacherSubmissionRedoInputSchema.safeParse(input);
      if (!validated.success) {
        throw new ApiError(
          "INVALID_REQUEST",
          "Revise a liberação da nova tentativa.",
          400,
        );
      }
      const response = await authenticatedRequest(
        `/teacher/submissions/${encodeURIComponent(submissionId)}/redo`,
        { body: JSON.stringify(validated.data), method: "POST" },
      );
      const parsed = teacherSubmissionMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }
      return parsed.data;
    },

    async getHomework(homeworkId: string): Promise<MobileHomework> {
      const response = await authenticatedRequest(
        `/homeworks/${encodeURIComponent(homeworkId)}`,
        { method: "GET" },
      );
      const parsed = homeworkResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invÃ¡lida.",
          502,
        );
      }

      return parsed.data.homework;
    },

    async submitHomework(homeworkId: string, answer: string) {
      const response = await authenticatedRequest(
        `/homeworks/${encodeURIComponent(homeworkId)}/submit`,
        {
          body: JSON.stringify({ answer }),
          method: "POST",
        },
      );
      const parsed = homeworkSubmitResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invÃ¡lida.",
          502,
        );
      }

      return parsed.data;
    },

    async saveInteractiveHomeworkDraft(
      homeworkId: string,
      answers: MobileInteractiveAnswer[],
    ) {
      const response = await authenticatedRequest(
        `/homeworks/${encodeURIComponent(homeworkId)}/interactive`,
        {
          body: JSON.stringify({ answers }),
          method: "PUT",
        },
      );
      const parsed = interactiveHomeworkActionResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invÃ¡lida.",
          502,
        );
      }

      return parsed.data;
    },

    async submitInteractiveHomework(
      homeworkId: string,
      answers: MobileInteractiveAnswer[],
    ) {
      const response = await authenticatedRequest(
        `/homeworks/${encodeURIComponent(homeworkId)}/interactive`,
        {
          body: JSON.stringify({ answers }),
          method: "POST",
        },
      );
      const parsed = interactiveHomeworkActionResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invÃ¡lida.",
          502,
        );
      }

      return parsed.data;
    },

    async getListeningAudioSource(
      homeworkId: string,
      fieldId: string,
      speed: "normal" | "slow",
    ) {
      await authenticatedRequest("/auth/me", { method: "GET" });
      const session = await options.sessionStore.get();

      if (!session?.tokens.accessToken) {
        throw new ApiError(
          "SESSION_EXPIRED",
          "Sua sessÃ£o expirou. Entre novamente.",
          401,
        );
      }

      return {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
        uri: `${baseUrl}/api/mobile/v1/homeworks/${encodeURIComponent(
          homeworkId,
        )}/listening/${encodeURIComponent(fieldId)}?speed=${speed}`,
      };
    },

    async getContractDownloadSource(contractId: string) {
      await authenticatedRequest("/auth/me", { method: "GET" });
      const session = await options.sessionStore.get();

      if (!session?.tokens.accessToken) {
        throw new ApiError(
          "SESSION_EXPIRED",
          "Sua sessão expirou. Entre novamente.",
          401,
        );
      }

      return {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
        uri: `${baseUrl}/api/mobile/v1/contracts/${encodeURIComponent(
          contractId,
        )}`,
      };
    },

    async getChatThreads(): Promise<MobileChatThread[]> {
      const response = await authenticatedRequest("/chat/threads", {
        method: "GET",
      });
      const parsed = chatThreadsResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.threads;
    },

    async getTeacherCattyManagement(): Promise<MobileTeacherCattyManagement> {
      const response = await authenticatedRequest(
        "/teacher/catty/management",
        { method: "GET" },
      );
      const parsed = teacherCattyManagementResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou um Catty Learning invalido.",
          502,
        );
      }
      return parsed.data.management;
    },

    async createTeacherCattyLearning(input: TeacherCattyLearningInput) {
      const response = await authenticatedRequest(
        "/teacher/catty/learning",
        { body: JSON.stringify(input), method: "POST" },
      );
      const parsed = teacherCattyMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor nao confirmou o aprendizado da Catty.",
          502,
        );
      }
      return parsed.data;
    },

    async saveTeacherCattyArtifact(input: TeacherCattyArtifactInput) {
      const response = await authenticatedRequest(
        "/teacher/catty/artifacts",
        { body: JSON.stringify(input), method: "PUT" },
      );
      const parsed = teacherCattyMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor nao confirmou o artefato da Catty.",
          502,
        );
      }
      return parsed.data;
    },

    async updateTeacherCattyArtifactStatus(
      artifactId: string,
      input: TeacherCattyArtifactStatusInput,
    ) {
      const response = await authenticatedRequest(
        `/teacher/catty/artifacts/${encodeURIComponent(artifactId)}`,
        { body: JSON.stringify(input), method: "PATCH" },
      );
      const parsed = teacherCattyMutationResponseSchema.safeParse(
        await response.json(),
      );
      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor nao confirmou o status do artefato.",
          502,
        );
      }
      return parsed.data;
    },

    async getCattyHistory(
      context: MobileCattyContext,
    ): Promise<MobileCattyMessage[]> {
      const query = new URLSearchParams({
        area: context.area,
        ...(context.task ? { task: context.task } : {}),
      }).toString();
      const response = await authenticatedRequest(`/catty/chat?${query}`, {
        method: "GET",
      });
      const parsed = cattyHistoryResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data.messages;
    },

    async sendCattyMessage(input: {
      context: MobileCattyContext;
      history: MobileCattyMessage[];
      message: string;
    }) {
      const response = await authenticatedRequest(
        "/catty/chat",
        {
          body: JSON.stringify({
            context: input.context,
            history: input.history.slice(-8).map(({ from, text }) => ({
              from,
              text,
            })),
            message: input.message,
          }),
          method: "POST",
        },
        30_000,
      );
      const parsed = cattyReplyResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data;
    },

    async getLiveClass(): Promise<MobileLiveClassOverview> {
      const response = await authenticatedRequest("/live-class", {
        method: "GET",
      });
      const parsed = liveClassResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta invalida.",
          502,
        );
      }

      return parsed.data.liveClass;
    },

    async getNotifications(): Promise<MobileNotificationInbox> {
      const response = await authenticatedRequest("/notifications", {
        method: "GET",
      });
      const parsed = notificationResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.notifications;
    },

    async getChatMessages(pair: {
      studentProfileId: string;
      teacherProfileId: string;
    }): Promise<MobileChatMessage[]> {
      const query = new URLSearchParams(pair).toString();
      const response = await authenticatedRequest(`/chat/messages?${query}`, {
        method: "GET",
      });
      const parsed = chatMessagesResponseSchema.safeParse(
        await response.json(),
      );

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data.messages;
    },

    async sendChatMessage(input: {
      body: string;
      studentProfileId: string;
      teacherProfileId: string;
    }) {
      const response = await authenticatedRequest("/chat/messages", {
        body: JSON.stringify(input),
        method: "POST",
      });
      const parsed = chatSendResponseSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      return parsed.data;
    },

    async signIn(email: string, password: string) {
      const device = await options.getDeviceIdentity();
      const response = await request("/auth/login", {
        body: JSON.stringify({
          device,
          email,
          password,
        }),
        method: "POST",
      });

      if (!response.ok) {
        throw await readError(response);
      }

      const parsed = successSessionSchema.safeParse(await response.json());

      if (!parsed.success) {
        throw new ApiError(
          "INVALID_RESPONSE",
          "O servidor retornou uma resposta inválida.",
          502,
        );
      }

      const session = toAuthSession(parsed.data);
      await options.sessionStore.save(session);

      return session.user;
    },

    async signOut() {
      const session = await options.sessionStore.get();

      try {
        if (session) {
          await request(
            "/auth/logout",
            { method: "POST" },
            session.tokens.accessToken,
          );
        }
      } finally {
        await clearLocalSession();
      }
    },
  };
}
