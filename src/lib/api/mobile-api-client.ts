import { z } from "zod";

import {
  authSessionSchema,
  authUserSchema,
  type AuthSession,
  type AuthSessionStore,
  type AuthUser,
} from "@/lib/auth/auth-session";

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
    id: z.string().min(1),
    occurredAt: z.string().datetime().optional(),
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

export type MobileChatThread = z.infer<typeof chatThreadSchema>;
export type MobileChatMessage = z.infer<typeof chatMessageSchema>;

const homeworkSchema = z
  .object({
    answer: z.string(),
    canSubmit: z.boolean(),
    dueDate: z.string().datetime().nullable(),
    feedback: z.string().nullable(),
    id: z.string().min(1),
    instructions: z.string().nullable(),
    interactiveFields: z.array(
      z
        .object({
          id: z.string().min(1),
          label: z.string().nullable(),
          required: z.boolean(),
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
  ) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const headers = new Headers(init.headers);

    headers.set("accept", "application/json");
    headers.set("x-request-id", createRequestId());

    if (init.body) {
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
      await options.sessionStore.clear();
      throw new ApiError(
        "SESSION_EXPIRED",
        "Entre novamente para continuar.",
        response.status,
        response.headers.get("x-request-id") ?? undefined,
      );
    }

    const parsed = successSessionSchema.safeParse(await response.json());

    if (!parsed.success) {
      await options.sessionStore.clear();
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

  async function authenticatedRequest(path: string, init: RequestInit) {
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

    let response = await request(path, init, session.tokens.accessToken);

    if (response.status === 401) {
      const refreshed = await refreshSessionOnce();
      response = await request(path, init, refreshed.tokens.accessToken);
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
        await options.sessionStore.clear();
      }
    },
  };
}
