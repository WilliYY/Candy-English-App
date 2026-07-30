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
