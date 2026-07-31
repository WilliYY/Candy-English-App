import { z } from "zod";

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
  type MobileCandyXpActivity,
  type MobileCandyXpAnswer,
  type MobileStudentCandyXp,
} from "@/lib/api/candy-xp-contracts";

export type {
  MobileStudentProfile,
  MobileStudentProfileUpdate,
} from "@/lib/api/profile-contracts";
export type {
  MobileCandyXpActivity,
  MobileCandyXpActivityAction,
  MobileCandyXpAnswer,
  MobileStudentCandyXp,
} from "@/lib/api/candy-xp-contracts";

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

export type MobileChatThread = z.infer<typeof chatThreadSchema>;
export type MobileChatMessage = z.infer<typeof chatMessageSchema>;
export type MobileCattyMessage = z.infer<typeof cattyMessageSchema>;
export type MobileCattyContext = {
  area: "admin" | "student" | "teacher";
  task?: string;
};

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
