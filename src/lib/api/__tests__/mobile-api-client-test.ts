import { createMobileApiClient } from "@/lib/api/mobile-api-client";
import type {
  AuthSession,
  AuthSessionStore,
} from "@/lib/auth/auth-session";

function jsonResponse(status: number, body: unknown) {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "x-request-id" ? "request-test-123" : null,
    },
    json: async () => body,
    ok: status >= 200 && status < 300,
    status,
  } as Response;
}

function sessionPayload(accessToken = "access-new"): AuthSession {
  return {
    tokens: {
      accessExpiresAt: "2026-07-30T13:00:00.000Z",
      accessToken,
      refreshExpiresAt: "2026-08-29T12:00:00.000Z",
      refreshToken: "refresh-new",
      tokenType: "Bearer",
    },
    user: {
      email: "teacher@candy.example",
      id: "user-1",
      name: "Candy Teacher",
      role: "TEACHER",
    },
  };
}

function createMemoryStore(initial: AuthSession | null = null) {
  let current = initial;
  const store: AuthSessionStore = {
    clear: jest.fn(async () => {
      current = null;
    }),
    get: jest.fn(async () => current),
    save: jest.fn(async (session) => {
      current = session;
    }),
  };

  return {
    get current() {
      return current;
    },
    store,
  };
}

const device = {
  appVersion: "0.1.0",
  installationId: "installation-12345678",
  platform: "ANDROID" as const,
};

describe("MobileApiClient", () => {
  it("signs in without persisting the password", async () => {
    const memory = createMemoryStore();
    const fetcher = jest.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;

      expect(body).toMatchObject({
        device,
        email: "teacher@candy.example",
        password: "correct-password",
      });

      return jsonResponse(200, {
        ok: true,
        ...sessionPayload(),
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await client.signIn("teacher@candy.example", "correct-password");

    expect(memory.current).toEqual(sessionPayload());
    expect(JSON.stringify(memory.current)).not.toContain("correct-password");
  });

  it("rotates once after 401 and retries with the new access token", async () => {
    const memory = createMemoryStore(sessionPayload("access-old"));
    const authorizationHeaders: string[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get("authorization");

      if (authorization) {
        authorizationHeaders.push(authorization);
      }

      if (url.endsWith("/auth/refresh")) {
        return jsonResponse(200, {
          ok: true,
          ...sessionPayload("access-new"),
        });
      }

      return authorization === "Bearer access-old"
        ? jsonResponse(401, {
            error: { code: "SESSION_INVALID", message: "expired" },
            ok: false,
          })
        : jsonResponse(200, {
            ok: true,
            user: sessionPayload().user,
          });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    const user = await client.getMe();

    expect(user.role).toBe("TEACHER");
    expect(authorizationHeaders).toEqual([
      "Bearer access-old",
      "Bearer access-new",
    ]);
    expect(memory.current?.tokens.accessToken).toBe("access-new");
  });

  it("clears local tokens when refresh is rejected", async () => {
    const memory = createMemoryStore(sessionPayload("access-old"));
    const fetcher = jest.fn(async (url: string) =>
      url.endsWith("/auth/refresh")
        ? jsonResponse(401, {
            error: { code: "SESSION_INVALID", message: "expired" },
            ok: false,
          })
        : jsonResponse(401, {
            error: { code: "SESSION_INVALID", message: "expired" },
            ok: false,
          }),
    );
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getMe()).rejects.toMatchObject({
      code: "SESSION_EXPIRED",
      status: 401,
    });
    expect(memory.current).toBeNull();
  });

  it("loads a role-scoped overview with the authenticated token", async () => {
    const memory = createMemoryStore(sessionPayload("access-overview"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/overview");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-overview",
      );

      return jsonResponse(200, {
        ok: true,
        overview: {
          generatedAt: "2026-07-30T12:00:00.000Z",
          metrics: [
            {
              id: "students",
              label: "Alunos",
              unit: "COUNT",
              value: 12,
            },
          ],
          nextItem: null,
          role: "TEACHER",
        },
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    const overview = await client.getOverview();

    expect(overview.role).toBe("TEACHER");
    expect(overview.metrics[0]?.value).toBe(12);
  });

  it("loads only a server-authorized native module", async () => {
    const memory = createMemoryStore(sessionPayload("access-module"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/modules/submissions",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-module",
      );

      return jsonResponse(200, {
        data: {
          emptyMessage: "Nenhuma submissão.",
          items: [
            {
              id: "submission-1",
              status: "SUBMITTED",
              subtitle: "Candy Student",
              title: "Homework 1",
            },
          ],
          slug: "submissions",
          title: "Correções",
        },
        ok: true,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    const module = await client.getModule("submissions");

    expect(module.title).toBe("Correções");
    expect(module.items[0]?.status).toBe("SUBMITTED");
  });

  it("loads an authorized student homework detail", async () => {
    const memory = createMemoryStore(sessionPayload("access-homework"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/homeworks/homework%2F1",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-homework",
      );

      return jsonResponse(200, {
        homework: {
          answer: "My first answer",
          canSubmit: true,
          dueDate: "2026-08-01T12:00:00.000Z",
          feedback: null,
          id: "homework/1",
          instructions: "Answer in English.",
          interactiveFields: [],
          kind: "TEXT",
          lessonTitle: "Lesson 1",
          questions: [{ id: "question-1", prompt: "How are you?" }],
          reviewedAt: null,
          status: "PUBLISHED",
          submissionStatus: "SUBMITTED",
          title: "Introductions",
        },
        ok: true,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    const homework = await client.getHomework("homework/1");

    expect(homework.kind).toBe("TEXT");
    expect(homework.answer).toBe("My first answer");
  });

  it("submits a text homework through the authenticated endpoint", async () => {
    const memory = createMemoryStore(sessionPayload("access-homework"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/homeworks/homework-1/submit",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-homework",
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        answer: "I am great!",
      });

      return jsonResponse(200, {
        message: "Homework enviada com sucesso.",
        ok: true,
        submittedAt: "2026-07-30T14:00:00.000Z",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.submitHomework("homework-1", "I am great!"),
    ).resolves.toMatchObject({
      ok: true,
      submittedAt: "2026-07-30T14:00:00.000Z",
    });
  });

  it("sends chat messages only through an authenticated pair", async () => {
    const memory = createMemoryStore(sessionPayload("access-chat"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/chat/messages",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-chat",
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        body: "Hello, teacher!",
        studentProfileId: "student-profile-1",
        teacherProfileId: "teacher-profile-1",
      });

      return jsonResponse(201, {
        message: "Mensagem enviada.",
        ok: true,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.sendChatMessage({
        body: "Hello, teacher!",
        studentProfileId: "student-profile-1",
        teacherProfileId: "teacher-profile-1",
      }),
    ).resolves.toEqual({
      message: "Mensagem enviada.",
      ok: true,
    });
  });
});
