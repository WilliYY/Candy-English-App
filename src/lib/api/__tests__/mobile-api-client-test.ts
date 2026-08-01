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

  it("loads a protected student lesson with materials", async () => {
    const memory = createMemoryStore(sessionPayload("access-lesson"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/lessons/lesson%2F1",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-lesson",
      );

      return jsonResponse(200, {
        lesson: {
          description: "Practice introductions.",
          homeworks: [
            {
              dueDate: "2026-08-05T12:00:00.000Z",
              id: "homework-1",
              submissionStatus: null,
              title: "Introduce yourself",
            },
          ],
          id: "lesson/1",
          materials: [
            {
              content: null,
              id: "material-1",
              title: "Pronunciation guide",
              type: "LINK",
              url: "https://example.com/guide",
            },
          ],
          scheduledAt: "2026-08-01T12:00:00.000Z",
          teacherName: "Candy Teacher",
          title: "Introductions",
          vocabularyItems: [
            {
              example: "Nice to meet you.",
              id: "word-1",
              term: "meet",
              translation: "conhecer",
            },
          ],
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

    const lesson = await client.getLesson("lesson/1");

    expect(lesson.title).toBe("Introductions");
    expect(lesson.materials[0]?.type).toBe("LINK");
  });

  it("loads a lesson owned by the authenticated teacher", async () => {
    const memory = createMemoryStore(sessionPayload("access-teacher-lesson"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/teacher/lessons/lesson%2F1",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-teacher-lesson",
      );

      return jsonResponse(200, {
        lesson: {
          description: "Practice introductions.",
          homeworks: [
            {
              dueDate: "2026-08-05T12:00:00.000Z",
              id: "homework-1",
              status: "DRAFT",
              title: "Introduce yourself",
            },
          ],
          id: "lesson/1",
          materials: [
            {
              content: null,
              id: "material-1",
              title: "Pronunciation guide",
              type: "LINK",
              url: "https://example.com/guide",
            },
          ],
          scheduledAt: "2026-08-01T12:00:00.000Z",
          status: "DRAFT",
          studentName: "Candy Student",
          teacherName: "Candy Teacher",
          title: "Introductions",
          vocabularyItems: [
            {
              example: "Nice to meet you.",
              id: "word-1",
              term: "meet",
              translation: "conhecer",
            },
          ],
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

    const lesson = await client.getTeacherLesson("lesson/1");

    expect(lesson.status).toBe("DRAFT");
    expect(lesson.studentName).toBe("Candy Student");
    expect(lesson.homeworks[0]?.status).toBe("DRAFT");
  });

  it("loads the teacher lesson editor and linked student options", async () => {
    const memory = createMemoryStore(sessionPayload("access-lesson-editor"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-lesson-editor",
      );

      if (url.endsWith("/teacher/lessons/options")) {
        return jsonResponse(200, {
          ok: true,
          students: [
            { id: "student-1", level: "A2", name: "Candy Student" },
          ],
        });
      }

      expect(url).toBe(
        "https://candy.example/api/mobile/v1/teacher/lessons/lesson%2F1/editor",
      );
      return jsonResponse(200, {
        lesson: {
          description: "Practice introductions.",
          id: "lesson/1",
          materials: [
            {
              content: null,
              title: "Pronunciation guide",
              type: "LINK",
              url: "https://example.com/guide",
            },
          ],
          scheduledAt: "2026-08-01T12:00:00.000Z",
          status: "DRAFT",
          studentProfileId: "student-1",
          title: "Introductions",
          updatedAt: "2026-08-01T13:00:00.000Z",
          vocabularyItems: [
            {
              example: "Nice to meet you.",
              term: "meet",
              translation: "conhecer",
            },
          ],
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

    await expect(client.getTeacherLessonOptions()).resolves.toEqual({
      students: [
        { id: "student-1", level: "A2", name: "Candy Student" },
      ],
    });
    await expect(client.getTeacherLessonEditor("lesson/1")).resolves.toMatchObject(
      {
        id: "lesson/1",
        studentProfileId: "student-1",
        updatedAt: "2026-08-01T13:00:00.000Z",
      },
    );
  });

  it("creates and updates a teacher lesson with stable operation data", async () => {
    const memory = createMemoryStore(sessionPayload("access-lesson-write"));
    const requests: { body: unknown; method: string; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: JSON.parse(String(init?.body)),
        method: init?.method ?? "GET",
        url,
      });
      return jsonResponse(url.endsWith("/editor") ? 200 : 201, {
        lessonId: "lesson-1",
        message: "Aula salva.",
        ok: true,
        replayed: false,
        updatedAt: "2026-08-01T14:00:00.000Z",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const input = {
      description: null,
      materials: [],
      operationId: "11111111-1111-4111-8111-111111111111",
      scheduledAt: null,
      status: "DRAFT" as const,
      studentProfileId: null,
      title: "General lesson",
      vocabularyItems: [],
    };

    await expect(client.createTeacherLesson(input)).resolves.toMatchObject({
      lessonId: "lesson-1",
      replayed: false,
    });
    await expect(
      client.updateTeacherLesson("lesson/1", {
        ...input,
        expectedUpdatedAt: "2026-08-01T13:00:00.000Z",
        operationId: "22222222-2222-4222-8222-222222222222",
      }),
    ).resolves.toMatchObject({ updatedAt: "2026-08-01T14:00:00.000Z" });

    expect(requests).toEqual([
      {
        body: input,
        method: "POST",
        url: "https://candy.example/api/mobile/v1/teacher/lessons",
      },
      {
        body: {
          ...input,
          expectedUpdatedAt: "2026-08-01T13:00:00.000Z",
          operationId: "22222222-2222-4222-8222-222222222222",
        },
        method: "PUT",
        url: "https://candy.example/api/mobile/v1/teacher/lessons/lesson%2F1/editor",
      },
    ]);
  });

  it("loads the protected teacher homework editor and creation options", async () => {
    const memory = createMemoryStore(sessionPayload("access-homework-editor"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-homework-editor",
      );
      if (url.endsWith("/teacher/homeworks/options")) {
        return jsonResponse(200, {
          lessons: [
            {
              id: "lesson-1",
              status: "DRAFT",
              studentProfileId: "student-1",
              title: "Introductions",
            },
          ],
          ok: true,
          students: [{ id: "student-1", level: "A1", name: "Ana" }],
        });
      }

      expect(url).toBe(
        "https://candy.example/api/mobile/v1/teacher/homeworks/homework%2F1/editor",
      );
      return jsonResponse(200, {
        homework: {
          assetFileName: null,
          dueDate: null,
          hasSubmissions: false,
          id: "homework/1",
          instructions: "Answer in English.",
          interactiveFieldCount: 0,
          kind: "TEXT",
          lessonId: "lesson-1",
          questions: [
            {
              expectedAnswer: "I am fine.",
              id: "question-1",
              prompt: "How are you?",
            },
          ],
          status: "DRAFT",
          studentProfileIds: ["student-1"],
          title: "Daily conversation",
          updatedAt: "2026-08-01T15:00:00.000Z",
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

    await expect(client.getTeacherHomeworkOptions()).resolves.toMatchObject({
      lessons: [{ id: "lesson-1" }],
      students: [{ id: "student-1" }],
    });
    await expect(
      client.getTeacherHomeworkEditor("homework/1"),
    ).resolves.toMatchObject({ id: "homework/1", kind: "TEXT" });
  });

  it("creates, updates, duplicates, and deletes teacher homeworks", async () => {
    const memory = createMemoryStore(sessionPayload("access-homework-write"));
    const requests: { body: unknown; method: string; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: JSON.parse(String(init?.body)),
        method: init?.method ?? "GET",
        url,
      });
      if (url.endsWith("/duplicate")) {
        return jsonResponse(201, {
          createdCount: 1,
          homeworkIds: ["homework-copy"],
          message: "Tarefa duplicada.",
          ok: true,
          replayed: false,
          skippedCount: 0,
        });
      }
      if (init?.method === "DELETE") {
        return jsonResponse(200, {
          homeworkId: "homework/1",
          message: "Tarefa excluída.",
          ok: true,
          replayed: false,
        });
      }
      return jsonResponse(url.endsWith("/editor") ? 200 : 201, {
        homeworkId: "homework/1",
        message: "Tarefa salva.",
        ok: true,
        replayed: false,
        updatedAt: "2026-08-01T16:00:00.000Z",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const input = {
      dueDate: null,
      instructions: "Answer in English.",
      lessonId: "lesson-1",
      operationId: "11111111-1111-4111-8111-111111111111",
      questions: [{ expectedAnswer: null, prompt: "How are you?" }],
      status: "DRAFT" as const,
      studentProfileIds: ["student-1"],
      title: "Daily conversation",
    };

    await client.createTeacherHomework(input);
    await client.updateTeacherHomework("homework/1", {
      ...input,
      expectedUpdatedAt: "2026-08-01T15:00:00.000Z",
      operationId: "22222222-2222-4222-8222-222222222222",
    });
    await client.duplicateTeacherHomework("homework/1", {
      operationId: "33333333-3333-4333-8333-333333333333",
      studentProfileIds: ["student-2"],
    });
    await client.deleteTeacherHomework("homework/1", {
      expectedUpdatedAt: "2026-08-01T15:00:00.000Z",
      operationId: "44444444-4444-4444-8444-444444444444",
    });

    expect(requests.map(({ method, url }) => ({ method, url }))).toEqual([
      {
        method: "POST",
        url: "https://candy.example/api/mobile/v1/teacher/homeworks",
      },
      {
        method: "PUT",
        url: "https://candy.example/api/mobile/v1/teacher/homeworks/homework%2F1/editor",
      },
      {
        method: "POST",
        url: "https://candy.example/api/mobile/v1/teacher/homeworks/homework%2F1/duplicate",
      },
      {
        method: "DELETE",
        url: "https://candy.example/api/mobile/v1/teacher/homeworks/homework%2F1/editor",
      },
    ]);
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
          interactiveAnswers: [],
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

  it("saves and submits interactive answers through idempotent methods", async () => {
    const memory = createMemoryStore(sessionPayload("access-interactive"));
    const methods: string[] = [];
    const answers = [{ fieldId: "field-1", value: "Hello" }];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/homeworks/homework-1/interactive",
      );
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-interactive",
      );
      expect(JSON.parse(String(init?.body))).toEqual({ answers });
      methods.push(String(init?.method));

      return jsonResponse(200, {
        message:
          init?.method === "PUT"
            ? "Rascunho salvo."
            : "Homework entregue com sucesso.",
        ok: true,
        status: init?.method === "PUT" ? "DRAFT" : "SUBMITTED",
        ...(init?.method === "POST"
          ? { submittedAt: "2026-07-30T14:00:00.000Z" }
          : {}),
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.saveInteractiveHomeworkDraft("homework-1", answers),
    ).resolves.toMatchObject({ status: "DRAFT" });
    await expect(
      client.submitInteractiveHomework("homework-1", answers),
    ).resolves.toMatchObject({ status: "SUBMITTED" });
    expect(methods).toEqual(["PUT", "POST"]);
  });

  it("creates a protected listening source after validating the session", async () => {
    const memory = createMemoryStore(sessionPayload("access-listening"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/auth/me");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-listening",
      );

      return jsonResponse(200, {
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

    await expect(
      client.getListeningAudioSource("homework/1", "field/2", "slow"),
    ).resolves.toEqual({
      headers: { Authorization: "Bearer access-listening" },
      uri:
        "https://candy.example/api/mobile/v1/homeworks/homework%2F1/" +
        "listening/field%2F2?speed=slow",
    });
  });

  it("keeps the contract token in headers and out of the download URL", async () => {
    const memory = createMemoryStore(sessionPayload("access-contract"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/auth/me");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-contract",
      );

      return jsonResponse(200, {
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

    const source = await client.getContractDownloadSource("contract/1");

    expect(source).toEqual({
      headers: { Authorization: "Bearer access-contract" },
      uri: "https://candy.example/api/mobile/v1/contracts/contract%2F1",
    });
    expect(source.uri).not.toContain("access-contract");
  });

  it("loads and updates the student profile through authenticated JSON", async () => {
    const memory = createMemoryStore(sessionPayload("access-profile"));
    const profile = {
      address: null,
      avatarRevision: null,
      birthDate: "2010-05-20",
      email: "student@candy.example",
      gender: null,
      guardianDocument: null,
      hasAvatar: false,
      level: "A2",
      motherName: null,
      motherPhone: null,
      name: "Candy Student",
      notes: null,
      phone: null,
      studentPhone: null,
      studentPhoneAlt: null,
    };
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/profile");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-profile",
      );

      if (init?.method === "PATCH") {
        expect(new Headers(init.headers).get("content-type")).toBe(
          "application/json",
        );
        expect(JSON.parse(String(init.body))).toMatchObject({
          name: "Candy Student Updated",
        });
        return jsonResponse(200, {
          message: "Perfil atualizado com sucesso.",
          ok: true,
          profile: { ...profile, name: "Candy Student Updated" },
        });
      }

      return jsonResponse(200, { ok: true, profile });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getStudentProfile()).resolves.toEqual(profile);
    await expect(
      client.updateStudentProfile({
        name: "Candy Student Updated",
      }),
    ).resolves.toMatchObject({
      profile: { name: "Candy Student Updated" },
    });
  });

  it("uploads the avatar as multipart without exposing or overriding its boundary", async () => {
    const memory = createMemoryStore(sessionPayload("access-avatar"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/profile/avatar",
      );
      const headers = new Headers(init?.headers);
      expect(headers.get("authorization")).toBe("Bearer access-avatar");
      expect(headers.get("content-type")).toBeNull();
      expect(init?.body).toBeInstanceOf(FormData);

      return jsonResponse(200, {
        avatarRevision: "revision-2",
        message: "Foto atualizada com sucesso.",
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
      client.uploadStudentAvatar({
        mimeType: "image/jpeg",
        name: "avatar.jpg",
        uri: "file:///cache/avatar.jpg",
      }),
    ).resolves.toMatchObject({ avatarRevision: "revision-2" });
  });

  it("keeps the avatar token in headers and out of its URL", async () => {
    const memory = createMemoryStore(sessionPayload("access-avatar-source"));
    const fetcher = jest.fn(async () =>
      jsonResponse(200, {
        ok: true,
        user: sessionPayload().user,
      }),
    );
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    const source = await client.getStudentAvatarSource();

    expect(source).toEqual({
      headers: { Authorization: "Bearer access-avatar-source" },
      uri: "https://candy.example/api/mobile/v1/profile/avatar",
    });
    expect(source.uri).not.toContain("access-avatar-source");
  });

  it("clears protected local data when signing out", async () => {
    const memory = createMemoryStore(sessionPayload("access-logout"));
    const onSessionCleared = jest.fn(async () => undefined);
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher: jest.fn(async () => jsonResponse(204, null)),
      getDeviceIdentity: async () => device,
      onSessionCleared,
      sessionStore: memory.store,
    });

    await client.signOut();

    expect(memory.current).toBeNull();
    expect(onSessionCleared).toHaveBeenCalledTimes(1);
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

  it("loads the private teacher Candy XP overview with bearer authentication", async () => {
    const memory = createMemoryStore(sessionPayload("access-teacher-xp"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/teacher/candy-xp");
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-teacher-xp",
      );
      return jsonResponse(200, {
        candyXp: {
          nextGoals: ["Corrigir uma submissão pendente."],
          profile: {
            badgeCount: 1,
            level: 2,
            longestStreakDays: 2,
            progressPercent: 34,
            progressXp: 60,
            requiredXp: 175,
            streakDays: 2,
            totalXp: 180,
            xpToNextLevel: 115,
          },
          ranking: {
            currentUser: {
              hasXp: true,
              position: 1,
              totalInCategory: 2,
              totalXp: 180,
              xpToNextLevel: 115,
            },
            generatedAt: "2026-08-01T21:00:00.000Z",
            topEntries: [
              {
                isCurrentUser: true,
                level: 2,
                name: "Candy Teacher",
                position: 1,
                progressPercent: 34,
                totalXp: 180,
                xpToNextLevel: 115,
              },
            ],
            totalRanked: 2,
          },
          recentEvents: [
            {
              occurredAt: "2026-08-01T20:00:00.000Z",
              sourceLabel: "Feedbacks dados",
              xp: 35,
            },
          ],
          sources: [{ label: "Feedbacks dados", value: 1, xp: 35 }],
          spotlightCard: {
            description: "Corrigir respostas pendentes gera XP.",
            status: "1 pendente(s)",
            title: "Missões teacher",
            unlocked: false,
          },
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

    await expect(client.getTeacherCandyXp()).resolves.toMatchObject({
      profile: { level: 2, totalXp: 180 },
      ranking: { topEntries: [{ name: "Candy Teacher" }] },
      spotlightCard: { title: "Missões teacher" },
    });
  });

  it("loads the private student Candy XP overview with bearer authentication", async () => {
    const memory = createMemoryStore(sessionPayload("access-candy-xp"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe("https://candy.example/api/mobile/v1/candy-xp");
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-candy-xp",
      );

      return jsonResponse(200, {
        candyXp: {
          activities: [
            {
              assetKind: "PDF",
              assetPageCount: 2,
              category: "Vocabulary",
              description: "Revise as cores.",
              id: "activity-1",
              interactiveFieldCount: 3,
              level: "A1",
              questionCount: 0,
              submission: null,
              title: "Candy Colors",
              xpReward: 80,
            },
          ],
          profile: {
            badgeCount: 2,
            level: 3,
            longestStreakDays: 5,
            progressPercent: 60,
            progressXp: 60,
            requiredXp: 100,
            streakDays: 3,
            totalXp: 500,
            xpToNextLevel: 40,
          },
          ranking: {
            currentUser: {
              hasXp: true,
              position: 2,
              totalInCategory: 10,
              totalXp: 500,
              xpToNextLevel: 40,
            },
            generatedAt: "2026-07-30T15:00:00.000Z",
            topEntries: [
              {
                isCurrentUser: true,
                level: 3,
                name: "Candy Student",
                position: 2,
                progressPercent: 60,
                totalXp: 500,
                xpToNextLevel: 40,
              },
            ],
            totalRanked: 10,
          },
          recentEvents: [
            {
              occurredAt: "2026-07-30T14:00:00.000Z",
              sourceLabel: "Homework enviado",
              xp: 150,
            },
          ],
          sources: [
            {
              label: "Homework enviado",
              value: 1,
              xp: 150,
            },
          ],
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

    await expect(client.getStudentCandyXp()).resolves.toMatchObject({
      activities: [{ id: "activity-1", title: "Candy Colors" }],
      profile: { level: 3, totalXp: 500 },
      ranking: { totalRanked: 10 },
    });
  });

  it("loads, saves and submits a protected Candy XP activity", async () => {
    const memory = createMemoryStore(sessionPayload("access-candy-activity"));
    const answers = [{ questionId: "question-1", value: "Blue" }];
    let requestIndex = 0;
    const submission = {
      answers,
      autoScorePercent: 100,
      awardedXp: 80,
      feedback: "Concluido automaticamente. +80 XP.",
      id: "submission-1",
      status: "REVIEWED",
      submittedAt: "2026-07-30T16:00:00.000Z",
    } as const;
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-candy-activity",
      );
      requestIndex += 1;

      if (requestIndex === 1) {
        expect(url).toBe(
          "https://candy.example/api/mobile/v1/candy-xp/activity-1",
        );
        expect(init?.method).toBe("GET");

        return jsonResponse(200, {
          activity: {
            asset: {
              fileName: "colors.pdf",
              kind: "PDF",
              mimeType: "application/pdf",
              pageCount: 2,
              sizeBytes: 2048,
            },
            canSubmit: true,
            category: "Vocabulary",
            description: "Revise as cores.",
            id: "activity-1",
            interactiveFields: [],
            level: "A1",
            questions: [
              {
                id: "question-1",
                options: [{ text: "Blue" }, { text: "Green" }],
                prompt: "Choose a color",
                required: true,
                sortOrder: 0,
                type: "MULTIPLE_CHOICE",
              },
            ],
            submission: null,
            title: "Candy Colors",
            xpReward: 80,
          },
          ok: true,
        });
      }

      if (requestIndex === 2 || requestIndex === 3) {
        expect(url).toBe(
          "https://candy.example/api/mobile/v1/candy-xp/activity-1/submission",
        );
        expect(init?.method).toBe(requestIndex === 2 ? "PUT" : "POST");
        expect(JSON.parse(String(init?.body))).toEqual({ answers });

        return jsonResponse(200, {
          message:
            requestIndex === 2
              ? "Progresso Candy XP salvo."
              : "Missao concluida. +80 XP.",
          ok: true,
          replayed: false,
          submission,
        });
      }

      expect(url).toBe(
        "https://candy.example/api/mobile/v1/auth/me",
      );
      expect(init?.method).toBe("GET");
      return jsonResponse(200, { ok: true });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.getStudentCandyXpActivity("activity-1"),
    ).resolves.toMatchObject({
      id: "activity-1",
      questions: [{ id: "question-1" }],
    });
    await expect(
      client.saveCandyXpActivityDraft("activity-1", answers),
    ).resolves.toMatchObject({
      message: "Progresso Candy XP salvo.",
      submission: { id: "submission-1" },
    });
    await expect(
      client.submitCandyXpActivity("activity-1", answers),
    ).resolves.toMatchObject({
      message: "Missao concluida. +80 XP.",
      submission: { awardedXp: 80, status: "REVIEWED" },
    });
    await expect(
      client.getCandyXpAssetSource("activity-1"),
    ).resolves.toEqual({
      headers: { Authorization: "Bearer access-candy-activity" },
      uri: "https://candy.example/api/mobile/v1/candy-xp/activity-1/asset",
    });
  });

  it("loads and continues the authenticated Catty history", async () => {
    const memory = createMemoryStore(sessionPayload("access-catty"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-catty",
      );

      if (init?.method === "GET") {
        expect(url).toBe(
          "https://candy.example/api/mobile/v1/catty/chat?area=student",
        );
        return jsonResponse(200, {
          messages: [
            { from: "user", id: "message-user-1", text: "Hello" },
            {
              from: "catty",
              id: "message-catty-1",
              text: "Hi! = Oi!",
            },
          ],
          ok: true,
        });
      }

      expect(url).toBe(
        "https://candy.example/api/mobile/v1/catty/chat",
      );
      expect(JSON.parse(String(init?.body))).toEqual({
        context: { area: "student" },
        history: [
          { from: "user", text: "Hello" },
          { from: "catty", text: "Hi! = Oi!" },
        ],
        message: "How are you?",
      });
      return jsonResponse(200, {
        messageId: "message-catty-2",
        ok: true,
        reply: "I'm great! = Eu estou otima!",
        source: "gemini",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const context = { area: "student" as const };
    const history = await client.getCattyHistory(context);

    await expect(
      client.sendCattyMessage({
        context,
        history,
        message: "How are you?",
      }),
    ).resolves.toEqual({
      messageId: "message-catty-2",
      ok: true,
      reply: "I'm great! = Eu estou otima!",
      source: "gemini",
    });
  });

  it("manages only the teacher Catty Learning and linked-student artifacts", async () => {
    const memory = createMemoryStore(sessionPayload("access-teacher-catty"));
    const requests: { body: unknown; method: string; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-teacher-catty",
      );
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url,
      });

      if (url.endsWith("/teacher/catty/management")) {
        return jsonResponse(200, {
          management: {
            approvedLearningCount: 4,
            artifacts: [
              {
                catchphrases: ["Level up!"],
                emojis: ["🎮"],
                example: "Gaming vocabulary",
                id: "artifact-1",
                isPrimary: true,
                label: "Games",
                sounds: ["pop"],
                status: "ACTIVE",
                studentId: "student-1",
                themeId: "games",
                toneRule: "Keep it light.",
                updatedAt: "2026-08-01T12:00:00.000Z",
              },
            ],
            learningCategories: ["VOCABULARY", "TEACHER_GUIDANCE"],
            learningItems: [
              {
                badReply: null,
                category: "VOCABULARY",
                createdAt: "2026-08-01T12:00:00.000Z",
                id: "learning-1",
                idealReply: null,
                intent: null,
                notes: "Explain with one short example.",
                status: "PENDING",
                tags: ["vocabulary"],
                title: "New word",
                updatedAt: "2026-08-01T12:00:00.000Z",
                userPrompt: "What does brave mean?",
              },
            ],
            students: [{ id: "student-1", name: "Ana" }],
            themeOptions: [
              {
                catchphrases: ["Level up!"],
                emojis: ["🎮"],
                id: "games",
                label: "Games",
                sounds: ["pop"],
              },
            ],
          },
          ok: true,
        });
      }

      return jsonResponse(url.endsWith("/teacher/catty/learning") ? 201 : 200, {
        message: "Operacao confirmada.",
        ok: true,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getTeacherCattyManagement()).resolves.toMatchObject({
      artifacts: [{ studentId: "student-1" }],
      students: [{ id: "student-1", name: "Ana" }],
    });
    await client.createTeacherCattyLearning({
      category: "VOCABULARY",
      notes: "Explain with one short example.",
      title: "New word",
    });
    await client.saveTeacherCattyArtifact({
      catchphrasesText: "Level up!",
      emojisText: "🎮",
      label: "Games",
      status: "ACTIVE",
      targetUserId: "student-1",
      themeId: "games",
    });
    await client.updateTeacherCattyArtifactStatus("artifact/1", {
      status: "DISABLED",
    });

    expect(requests).toEqual([
      {
        body: null,
        method: "GET",
        url: "https://candy.example/api/mobile/v1/teacher/catty/management",
      },
      {
        body: {
          category: "VOCABULARY",
          notes: "Explain with one short example.",
          title: "New word",
        },
        method: "POST",
        url: "https://candy.example/api/mobile/v1/teacher/catty/learning",
      },
      {
        body: {
          catchphrasesText: "Level up!",
          emojisText: "🎮",
          label: "Games",
          status: "ACTIVE",
          targetUserId: "student-1",
          themeId: "games",
        },
        method: "PUT",
        url: "https://candy.example/api/mobile/v1/teacher/catty/artifacts",
      },
      {
        body: { status: "DISABLED" },
        method: "PATCH",
        url: "https://candy.example/api/mobile/v1/teacher/catty/artifacts/artifact%2F1",
      },
    ]);
  });

  it("loads the authenticated live-class maintenance state", async () => {
    const memory = createMemoryStore(sessionPayload("access-live-class"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/live-class",
      );
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-live-class",
      );

      return jsonResponse(200, {
        liveClass: {
          generatedAt: "2026-07-30T15:00:00.000Z",
          maintenance: {
            enabled: true,
            message: "Aula ao vivo em manutencao.",
          },
          role: "STUDENT",
          sessions: [],
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

    await expect(client.getLiveClass()).resolves.toMatchObject({
      maintenance: {
        enabled: true,
      },
      role: "STUDENT",
      sessions: [],
    });
  });

  it("rejects a non-HTTPS live-class join link", async () => {
    const memory = createMemoryStore(sessionPayload("access-live-class"));
    const fetcher = jest.fn(async () =>
      jsonResponse(200, {
        liveClass: {
          generatedAt: "2026-07-30T15:00:00.000Z",
          maintenance: {
            enabled: false,
            message: null,
          },
          role: "STUDENT",
          sessions: [
            {
              createdAt: "2026-07-30T14:00:00.000Z",
              endsAt: null,
              id: "live-1",
              isLive: true,
              joinUrl: "http://meet.jit.si/candy-room",
              startsAt: "2026-07-30T15:00:00.000Z",
              studentName: null,
              teacherName: "Teacher Candy",
              title: "Conversation",
            },
          ],
        },
        ok: true,
      }),
    );
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getLiveClass()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });

  it("loads the authenticated student notification inbox", async () => {
    const memory = createMemoryStore(sessionPayload("access-notifications"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/notifications",
      );
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-notifications",
      );

      return jsonResponse(200, {
        notifications: {
          generatedAt: "2026-07-30T15:00:00.000Z",
          items: [
            {
              eventAt: "2026-07-30T14:30:00.000Z",
              id: "lesson:lesson-1",
              summary: "Uma aula foi liberada ou atualizada para voce.",
              target: {
                id: "lesson-1",
                kind: "LESSON",
              },
              title: "Aula: Simple present",
              type: "CLASS",
            },
          ],
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

    await expect(client.getNotifications()).resolves.toMatchObject({
      items: [
        {
          id: "lesson:lesson-1",
          target: { id: "lesson-1", kind: "LESSON" },
          type: "CLASS",
        },
      ],
    });
  });

  it("rejects an unknown notification target from the server", async () => {
    const memory = createMemoryStore(sessionPayload("access-notifications"));
    const fetcher = jest.fn(async () =>
      jsonResponse(200, {
        notifications: {
          generatedAt: "2026-07-30T15:00:00.000Z",
          items: [
            {
              eventAt: "2026-07-30T14:30:00.000Z",
              id: "finance:payment-1",
              summary: "Conteudo financeiro indevido.",
              target: {
                id: "payment-1",
                kind: "FINANCE",
              },
              title: "Pagamento",
              type: "HOMEWORK",
            },
          ],
        },
        ok: true,
      }),
    );
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getNotifications()).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
    });
  });

  it("loads and updates protected teacher interactive fields", async () => {
    const memory = createMemoryStore(sessionPayload("access-fields"));
    const requests: { body: unknown; method: string | undefined }[] = [];
    const editor = {
      assetFileName: "activity.pdf",
      fields: [
        {
          height: 4,
          id: "field-1",
          label: "Answer",
          page: 1,
          placeholder: "Type here",
          required: true,
          sortOrder: 0,
          type: "LONG_TEXT" as const,
          width: 80,
          x: 10,
          y: 15,
        },
      ],
      hasSubmissions: false,
      homeworkId: "homework/1",
      pageCount: 2,
      title: "Interactive activity",
      updatedAt: "2026-08-01T18:00:00.000Z",
    };
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(
        "https://candy.example/api/mobile/v1/teacher/homeworks/homework%2F1/fields",
      );
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method,
      });
      return jsonResponse(200, {
        editor: init?.method === "PUT" ? { ...editor, replayed: false } : editor,
        ...(init?.method === "PUT"
          ? { message: "1 campo(s) salvos com sucesso." }
          : {}),
        ok: true,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const fields = editor.fields.map(({ sortOrder: _sortOrder, ...field }) => field);

    await expect(client.getTeacherInteractiveFields("homework/1")).resolves.toMatchObject({
      fields: [{ id: "field-1", type: "LONG_TEXT" }],
      pageCount: 2,
    });
    await expect(
      client.updateTeacherInteractiveFields("homework/1", {
        expectedUpdatedAt: editor.updatedAt,
        fields,
        operationId: "11111111-1111-4111-8111-111111111111",
      }),
    ).resolves.toMatchObject({ message: "1 campo(s) salvos com sucesso." });
    expect(requests).toEqual([
      { body: null, method: "GET" },
      {
        body: {
          expectedUpdatedAt: editor.updatedAt,
          fields,
          operationId: "11111111-1111-4111-8111-111111111111",
        },
        method: "PUT",
      },
    ]);
  });

  it("loads and converts an authorized teacher pre-registration", async () => {
    const memory = createMemoryStore(sessionPayload("access-conversion"));
    const requests: { body: unknown; method: string | undefined; url: string }[] = [];
    const preRegistration = {
      agenda: { complete: false, days: null, time: null },
      canConvert: true,
      converted: false,
      email: "student@example.com",
      englishGoal: "Conversation",
      estimatedLevel: "A2",
      finance: { complete: false },
      fullName: "Student One",
      id: "request/1",
      phone: "44999990000",
      status: "READY_TO_CONVERT" as const,
      statusNote: null,
      unit: "IVATE" as const,
      updatedAt: "2026-08-01T20:00:00.000Z",
    };
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-conversion",
      );
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method,
        url,
      });
      if (url.endsWith("/convert")) {
        return jsonResponse(200, {
          message: "Aluno convertido com AVA.",
          ok: true,
          preRegistration: {
            ...preRegistration,
            canConvert: false,
            converted: true,
            status: "APPROVED",
          },
        });
      }
      return jsonResponse(200, { ok: true, preRegistration });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const conversion = {
      confirmConversion: true as const,
      confirmMissingAgendaData: true,
      emailForLogin: "new@example.com",
      initialPassword: "StrongPass123",
      operationId: "11111111-1111-4111-8111-111111111111",
    };

    await expect(
      client.getTeacherPreRegistration("request/1"),
    ).resolves.toMatchObject({ id: "request/1", canConvert: true });
    await expect(
      client.convertTeacherPreRegistration("request/1", conversion),
    ).resolves.toMatchObject({
      message: "Aluno convertido com AVA.",
      preRegistration: { canConvert: false, converted: true },
    });
    expect(requests).toEqual([
      {
        body: null,
        method: "GET",
        url: "https://candy.example/api/mobile/v1/teacher/pre-registrations/request%2F1",
      },
      {
        body: conversion,
        method: "POST",
        url: "https://candy.example/api/mobile/v1/teacher/pre-registrations/request%2F1/convert",
      },
    ]);
  });

  it("loads the teacher submission queue and protected submission detail", async () => {
    const memory = createMemoryStore(sessionPayload("access-submissions"));
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        "Bearer access-submissions",
      );
      if (url.endsWith("/teacher/submissions")) {
        return jsonResponse(200, {
          hasMore: false,
          ok: true,
          submissions: [
            {
              feedbackPresent: false,
              homeworkId: "homework-1",
              homeworkKind: "TEXT",
              homeworkTitle: "Daily conversation",
              id: "submission/1",
              lessonTitle: "Conversation",
              reviewedAt: null,
              status: "SUBMITTED",
              studentLevel: "A1",
              studentName: "Ana",
              submittedAt: "2026-08-01T15:00:00.000Z",
            },
          ],
        });
      }

      expect(url).toBe(
        "https://candy.example/api/mobile/v1/teacher/submissions/submission%2F1",
      );
      return jsonResponse(200, {
        ok: true,
        submission: {
          answers: [
            {
              id: "text-answer",
              label: "How are you?",
              type: "TEXT",
              value: "I am fine.",
            },
          ],
          feedback: null,
          hasAnnotations: false,
          homework: {
            id: "homework-1",
            instructions: "Answer in English.",
            kind: "TEXT",
            lessonTitle: "Conversation",
            questions: [
              {
                expectedAnswer: "I am fine.",
                id: "question-1",
                prompt: "How are you?",
              },
            ],
            title: "Daily conversation",
          },
          id: "submission/1",
          reviewedAt: null,
          status: "SUBMITTED",
          student: { id: "student-1", level: "A1", name: "Ana" },
          submittedAt: "2026-08-01T15:00:00.000Z",
        },
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(client.getTeacherSubmissions()).resolves.toMatchObject({
      hasMore: false,
      submissions: [{ id: "submission/1", studentName: "Ana" }],
    });
    await expect(client.getTeacherSubmission("submission/1")).resolves.toMatchObject({
      answers: [{ value: "I am fine." }],
      id: "submission/1",
      student: { name: "Ana" },
    });
  });

  it("validates and sends teacher feedback and redo operations", async () => {
    const memory = createMemoryStore(sessionPayload("access-review"));
    const requests: { body: unknown; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        url,
      });
      const returned = url.endsWith("/redo");
      return jsonResponse(200, {
        feedback: "Great work!",
        message: returned
          ? "Nova tentativa liberada com sucesso."
          : "Feedback enviado com sucesso.",
        ok: true,
        replayed: false,
        reviewedAt: returned ? null : "2026-08-01T16:00:00.000Z",
        status: returned ? "RETURNED" : "REVIEWED",
        submissionId: "submission/1",
        submittedAt: "2026-08-01T15:00:00.000Z",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const version = {
      expectedReviewedAt: null,
      expectedStatus: "SUBMITTED" as const,
      expectedSubmittedAt: "2026-08-01T15:00:00.000Z",
      operationId: "11111111-1111-4111-8111-111111111111",
    };

    await expect(
      client.reviewTeacherSubmission("submission/1", {
        ...version,
        feedback: "Great work!",
      }),
    ).resolves.toMatchObject({ status: "REVIEWED" });
    await expect(
      client.redoTeacherSubmission("submission/1", {
        ...version,
        feedback: "Great work!",
      }),
    ).resolves.toMatchObject({ status: "RETURNED" });
    expect(requests).toEqual([
      {
        body: { ...version, feedback: "Great work!" },
        url: "https://candy.example/api/mobile/v1/teacher/submissions/submission%2F1/review",
      },
      {
        body: { ...version, feedback: "Great work!" },
        url: "https://candy.example/api/mobile/v1/teacher/submissions/submission%2F1/redo",
      },
    ]);
  });

  it("lists and loads safe administrative user details", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-users"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const urls: string[] = [];
    const fetcher = jest.fn(async (url: string) => {
      urls.push(url);
      if (url.includes("/admin/users?")) {
        return jsonResponse(200, {
          ok: true,
          users: {
            generatedAt: "2026-08-01T12:00:00.000Z",
            items: [
              {
                createdAt: "2026-07-01T12:00:00.000Z",
                email: "student@candy.example",
                id: "user/1",
                isActive: true,
                name: "Student Candy",
                profileComplete: true,
                role: "STUDENT",
                updatedAt: "2026-08-01T12:00:00.000Z",
              },
            ],
            nextCursor: null,
            total: 1,
          },
        });
      }

      return jsonResponse(200, {
        ok: true,
        user: {
          address: null,
          createdAt: "2026-07-01T12:00:00.000Z",
          email: "student@candy.example",
          id: "user/1",
          isActive: true,
          name: "Student Candy",
          phone: null,
          role: "STUDENT",
          studentProfile: {
            contractsCount: 1,
            id: "student-1",
            lessonsCount: 2,
            level: "B1",
            submissionsCount: 3,
            teacherNames: ["Teacher Candy"],
          },
          teacherProfile: null,
          updatedAt: "2026-08-01T12:00:00.000Z",
        },
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.getAdminUsers({
        limit: 25,
        query: "Ana Candy",
        role: "STUDENT",
        status: "ACTIVE",
      }),
    ).resolves.toMatchObject({ items: [{ id: "user/1" }], total: 1 });
    await expect(client.getAdminUser("user/1")).resolves.toMatchObject({
      id: "user/1",
      studentProfile: { teacherNames: ["Teacher Candy"] },
    });
    expect(urls).toEqual([
      "https://candy.example/api/mobile/v1/admin/users?limit=25&query=Ana+Candy&role=STUDENT&status=ACTIVE",
      "https://candy.example/api/mobile/v1/admin/users/user%2F1",
    ]);
  });

  it("creates, edits, changes status and resets administrative user passwords", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-write"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const requests: { body: unknown; method: string | undefined; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method,
        url,
      });
      if (url.endsWith("/status")) {
        return jsonResponse(200, {
          changed: true,
          isActive: false,
          message: "Usuario desativado com sucesso.",
          ok: true,
          userId: "user/1",
        });
      }
      return jsonResponse(url.endsWith("/admin/users") ? 201 : 200, {
        message: url.endsWith("/admin/users")
          ? "Usuario cadastrado com sucesso."
          : "Usuario atualizado com sucesso.",
        ok: true,
        userId: "user/1",
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const createInput = {
      confirmPassword: "StrongPass123",
      email: "student@example.com",
      name: "Student Candy",
      password: "StrongPass123",
      role: "STUDENT" as const,
    };
    const updateInput = {
      email: "new@example.com",
      expectedUpdatedAt: "2026-08-01T12:00:00.000Z",
      name: "New Name",
    };
    const statusInput = {
      confirmStatusChange: true as const,
      expectedUpdatedAt: "2026-08-01T12:00:00.000Z",
      isActive: false,
    };
    const passwordInput = {
      confirmNewPassword: "NewStrongPass123",
      confirmPasswordReset: true as const,
      expectedUpdatedAt: "2026-08-01T12:00:00.000Z",
      newPassword: "NewStrongPass123",
    };

    await expect(client.createAdminUser(createInput)).resolves.toMatchObject({
      userId: "user/1",
    });
    await expect(
      client.updateAdminUser("user/1", updateInput),
    ).resolves.toMatchObject({ userId: "user/1" });
    await expect(
      client.changeAdminUserStatus("user/1", statusInput),
    ).resolves.toMatchObject({ changed: true, isActive: false });
    await expect(
      client.resetAdminUserPassword("user/1", passwordInput),
    ).resolves.toMatchObject({ userId: "user/1" });

    expect(requests).toEqual([
      {
        body: createInput,
        method: "POST",
        url: "https://candy.example/api/mobile/v1/admin/users",
      },
      {
        body: updateInput,
        method: "PUT",
        url: "https://candy.example/api/mobile/v1/admin/users/user%2F1",
      },
      {
        body: statusInput,
        method: "PATCH",
        url: "https://candy.example/api/mobile/v1/admin/users/user%2F1/status",
      },
      {
        body: passwordInput,
        method: "PATCH",
        url: "https://candy.example/api/mobile/v1/admin/users/user%2F1/password",
      },
    ]);
  });

  it("lists and loads complete administrative pre-registrations", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-pre-registrations"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const urls: string[] = [];
    const listItem = {
      assignedTeacherName: "Teacher Candy",
      converted: false,
      createdAt: "2026-08-01T10:00:00.000Z",
      email: "ana@example.com",
      fullName: "Ana Candy",
      id: "pre/1",
      phone: "44999999999",
      status: "READY_TO_CONVERT",
      statusNote: "Documentos conferidos",
      unit: "IVATE",
      updatedAt: "2026-08-01T12:00:00.000Z",
    };
    const fetcher = jest.fn(async (url: string) => {
      urls.push(url);
      if (url.includes("pre%2F1")) {
        return jsonResponse(200, {
          ok: true,
          preRegistration: {
            address: "Rua Candy, 10",
            agenda: { complete: true, days: ["Seg", "Qua"], time: "19:00" },
            assignedTeacherName: "Teacher Candy",
            birthDate: "2010-05-20",
            canConvert: true,
            city: "Ivaté",
            converted: false,
            convertedUser: null,
            createdAt: listItem.createdAt,
            createdBy: { name: "Admin Candy", role: "ADMIN" },
            email: listItem.email,
            englishGoal: "Conversacao",
            estimatedLevel: "A2",
            finance: { complete: true },
            fullName: listItem.fullName,
            guardianDocument: "12345678900",
            guardianName: "Maria Candy",
            guardianPhone: "44977777777",
            id: listItem.id,
            installmentsTotal: 12,
            notes: "Prefere aulas online",
            paymentDay: 10,
            paymentMethod: "PIX",
            phone: listItem.phone,
            reviewedAt: null,
            reviewedByName: null,
            secondaryContact: null,
            status: listItem.status,
            statusNote: listItem.statusNote,
            studentPhone: "44988888888",
            tuitionCents: 35000,
            unit: listItem.unit,
            updatedAt: listItem.updatedAt,
          },
        });
      }
      return jsonResponse(200, {
        ok: true,
        preRegistrations: {
          generatedAt: "2026-08-01T13:00:00.000Z",
          items: [listItem],
          nextCursor: null,
          total: 1,
        },
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });

    await expect(
      client.getAdminPreRegistrations({
        limit: 25,
        query: "Ana Candy",
        status: "OPEN",
        unit: "IVATE",
      }),
    ).resolves.toMatchObject({ items: [{ id: "pre/1" }], total: 1 });
    await expect(
      client.getAdminPreRegistration("pre/1"),
    ).resolves.toMatchObject({
      agenda: { complete: true, days: ["Seg", "Qua"] },
      guardianName: "Maria Candy",
      id: "pre/1",
    });
    expect(urls).toEqual([
      "https://candy.example/api/mobile/v1/admin/pre-registrations?limit=25&query=Ana+Candy&status=OPEN&unit=IVATE",
      "https://candy.example/api/mobile/v1/admin/pre-registrations/pre%2F1",
    ]);
  });

  it("converts an administrative pre-registration with explicit confirmations", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-conversion"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const requests: { body: unknown; method: string | undefined; url: string }[] = [];
    const preRegistration = {
      address: null,
      agenda: { complete: false, days: [], time: null },
      assignedTeacherName: null,
      birthDate: null,
      canConvert: false,
      city: null,
      converted: true,
      convertedUser: { email: "student@example.com", name: "Ana Candy" },
      createdAt: "2026-08-01T10:00:00.000Z",
      createdBy: null,
      email: "student@example.com",
      englishGoal: "Conversacao",
      estimatedLevel: null,
      finance: { complete: false },
      fullName: "Ana Candy",
      guardianDocument: null,
      guardianName: null,
      guardianPhone: null,
      id: "pre/1",
      installmentsTotal: null,
      notes: null,
      paymentDay: null,
      paymentMethod: null,
      phone: "44999999999",
      reviewedAt: "2026-08-01T13:00:00.000Z",
      reviewedByName: "Admin Candy",
      secondaryContact: null,
      status: "APPROVED",
      statusNote: "Convertido em aluno com AVA; completar financeiro e agenda.",
      studentPhone: null,
      tuitionCents: null,
      unit: "IVATE",
      updatedAt: "2026-08-01T13:00:00.000Z",
    };
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method,
        url,
      });
      return jsonResponse(200, {
        message: "Aluno convertido com AVA.",
        ok: true,
        preRegistration,
      });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const conversion = {
      confirmConversion: true as const,
      confirmMissingAgendaData: true,
      confirmMissingFinancialData: true,
      emailForLogin: "student@example.com",
      expectedUpdatedAt: "2026-08-01T12:00:00.000Z",
      initialPassword: "StrongPass123",
      operationId: "11111111-1111-4111-8111-111111111111",
    };

    await expect(
      client.convertAdminPreRegistration("pre/1", conversion),
    ).resolves.toMatchObject({
      message: "Aluno convertido com AVA.",
      preRegistration: { converted: true, id: "pre/1" },
    });
    expect(requests).toEqual([
      {
        body: conversion,
        method: "POST",
        url: "https://candy.example/api/mobile/v1/admin/pre-registrations/pre%2F1/convert",
      },
    ]);
  });

  it("loads the administrative finance overview by period and unit", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-finance"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const urls: string[] = [];
    const summary = {
      incompleteCount: 0,
      overdueCents: 35_000,
      overdueCount: 1,
      paidCents: 0,
      paidCount: 0,
      pendingCents: 35_000,
      pendingCount: 1,
      studentsCount: 1,
      totalCents: 35_000,
    };
    const fetcher = jest.fn(async (url: string) => {
      urls.push(url);
      return jsonResponse(200, {
        finance: {
          generatedAt: "2026-08-15T15:00:00.000Z",
          items: [
            {
              amountCents: 35_000,
              id: "payment/1",
              installmentNumber: 1,
              installmentsTotal: 12,
              isPaid: false,
              month: 8,
              name: "Ana Candy",
              note: null,
              paidAt: null,
              paymentDay: 10,
              paymentMethod: "PIX",
              status: "OVERDUE",
              studentId: "student/1",
              unit: "IVATE",
              updatedAt: "2026-08-11T12:00:00.000Z",
              year: 2026,
            },
          ],
          nextCursor: null,
          period: { month: 8, year: 2026 },
          scopeSummary: summary,
          total: 1,
          unitSummaries: [
            { ...summary, unit: "IVATE" },
            {
              ...summary,
              overdueCents: 0,
              overdueCount: 0,
              pendingCents: 0,
              pendingCount: 0,
              studentsCount: 0,
              totalCents: 0,
              unit: "DOURADINA",
            },
          ],
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

    await expect(
      client.getAdminFinance({
        limit: 25,
        month: 8,
        query: "Ana",
        status: "OVERDUE",
        unit: "IVATE",
        year: 2026,
      }),
    ).resolves.toMatchObject({
      items: [{ id: "payment/1", status: "OVERDUE" }],
      scopeSummary: { overdueCents: 35_000 },
      total: 1,
    });
    expect(urls).toEqual([
      "https://candy.example/api/mobile/v1/admin/finance?limit=25&month=8&query=Ana&status=OVERDUE&unit=IVATE&year=2026",
    ]);
  });

  it("loads and updates finance operations with exact safe requests", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-finance-operations"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const payment = {
      amountCents: 35_000,
      id: "payment/1",
      installmentNumber: 1,
      installmentsTotal: 12,
      isPaid: false,
      month: 8,
      name: "Ana Candy",
      note: null,
      paidAt: null,
      paymentDay: 10,
      paymentMethod: "PIX",
      status: "OVERDUE",
      studentId: "student/1",
      unit: "IVATE",
      updatedAt: "2026-08-11T12:00:00.000Z",
      year: 2026,
    } as const;
    const expense = {
      actorName: "Administracao",
      amountCents: 12_500,
      createdAt: "2026-08-15T15:00:00.000Z",
      id: "expense/1",
      itemName: "Material didatico",
      note: null,
      purchasedAt: "2026-08-15",
      unit: "IVATE",
      updatedAt: "2026-08-15T15:00:00.000Z",
    } as const;
    const requests: { body: unknown; method: string | undefined; url: string }[] = [];
    const fetcher = jest.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method,
        url,
      });
      if (url.includes("/activity")) {
        return jsonResponse(200, {
          activity: {
            expenseSummary: { count: 1, totalCents: 12_500 },
            expenses: [expense],
            generatedAt: "2026-08-15T15:00:00.000Z",
            logs: [
              {
                action: "MOBILE_EXPENSE",
                createdAt: "2026-08-15T15:00:00.000Z",
                description: "Gasto registrado no app.",
                id: "log/1",
                studentName: null,
              },
            ],
            logsScope: "GLOBAL_RECENT",
            period: { month: 8, year: 2026 },
            unit: "IVATE",
          },
          ok: true,
        });
      }
      if (url.endsWith("/expenses")) {
        return jsonResponse(201, {
          expense,
          message: "Gasto registrado com sucesso.",
          ok: true,
          replayed: false,
        });
      }
      if (init?.method === "PATCH") {
        return jsonResponse(200, {
          message: "Pagamento marcado como pago.",
          ok: true,
          payment: {
            ...payment,
            isPaid: true,
            paidAt: "2026-08-15T15:00:00.000Z",
            status: "PAID",
            updatedAt: "2026-08-15T15:00:00.000Z",
          },
          replayed: false,
        });
      }
      return jsonResponse(200, { ok: true, payment });
    });
    const client = createMobileApiClient({
      baseUrl: "https://candy.example",
      fetcher,
      getDeviceIdentity: async () => device,
      sessionStore: memory.store,
    });
    const updateInput = {
      amountCents: 35_000,
      confirmChange: true as const,
      expectedUpdatedAt: payment.updatedAt,
      isPaid: true,
      note: "Pago pelo app",
      operationId: "11111111-1111-4111-8111-111111111111",
    };
    const expenseInput = {
      actorName: "Administracao",
      amountCents: 12_500,
      confirmCreate: true as const,
      itemName: "Material didatico",
      month: 8,
      note: null,
      operationId: "22222222-2222-4222-8222-222222222222",
      purchasedAt: "2026-08-15",
      unit: "IVATE" as const,
      year: 2026,
    };

    await expect(
      client.getAdminFinanceActivity({ month: 8, unit: "IVATE", year: 2026 }),
    ).resolves.toMatchObject({ expenses: [{ id: "expense/1" }] });
    await expect(client.getAdminFinancePayment("payment/1")).resolves.toMatchObject({
      id: "payment/1",
    });
    await expect(
      client.updateAdminFinancePayment("payment/1", updateInput),
    ).resolves.toMatchObject({ payment: { status: "PAID" }, replayed: false });
    await expect(client.createAdminFinanceExpense(expenseInput)).resolves.toMatchObject({
      expense: { id: "expense/1" },
      replayed: false,
    });

    expect(requests).toEqual([
      {
        body: null,
        method: "GET",
        url: "https://candy.example/api/mobile/v1/admin/finance/activity?month=8&unit=IVATE&year=2026",
      },
      {
        body: null,
        method: "GET",
        url: "https://candy.example/api/mobile/v1/admin/finance/payments/payment%2F1",
      },
      {
        body: updateInput,
        method: "PATCH",
        url: "https://candy.example/api/mobile/v1/admin/finance/payments/payment%2F1",
      },
      {
        body: expenseInput,
        method: "POST",
        url: "https://candy.example/api/mobile/v1/admin/finance/expenses",
      },
    ]);
  });

  it("loads the administrative monthly agenda and selected daily queue", async () => {
    const memory = createMemoryStore({
      ...sessionPayload("access-admin-agenda"),
      user: { ...sessionPayload().user, role: "ADMIN" },
    });
    const urls: string[] = [];
    const fetcher = jest.fn(async (url: string) => {
      urls.push(url);
      return jsonResponse(200, {
        agenda: {
          dailyLessons: [
            {
              date: "2026-08-10",
              id: "lesson/1",
              isMakeup: false,
              lessonNote: null,
              status: "SCHEDULED",
              studentId: "student/1",
              studentName: "Ana Candy",
              studentNote: "Responsavel avisado",
              studentPhone: "44999999999",
              studentUnit: "IVATE",
              time: "14:00",
              updatedAt: "2026-08-01T12:00:00.000Z",
            },
          ],
          days: [
            {
              attendedCount: 0,
              count: 1,
              date: "2026-08-10",
              makeupCount: 0,
              missedCount: 0,
              scheduledCount: 1,
            },
          ],
          generatedAt: "2026-08-15T15:00:00.000Z",
          period: { month: 8, year: 2026 },
          selectedDate: "2026-08-10",
          summary: {
            attendedCount: 0,
            count: 1,
            makeupCount: 0,
            missedCount: 0,
            scheduledCount: 1,
          },
          unit: "IVATE",
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

    await expect(
      client.getAdminAgenda({
        date: "2026-08-10",
        month: 8,
        query: "Ana",
        unit: "IVATE",
        year: 2026,
      }),
    ).resolves.toMatchObject({
      dailyLessons: [{ id: "lesson/1", studentName: "Ana Candy" }],
      selectedDate: "2026-08-10",
      summary: { count: 1 },
    });
    expect(urls).toEqual([
      "https://candy.example/api/mobile/v1/admin/agenda?date=2026-08-10&month=8&query=Ana&unit=IVATE&year=2026",
    ]);
  });
});
