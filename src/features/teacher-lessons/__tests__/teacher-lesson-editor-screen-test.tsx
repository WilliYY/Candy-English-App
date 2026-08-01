import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherLessonEditorScreen } from "@/features/teacher-lessons/teacher-lesson-editor-screen";
import { getMobileApi } from "@/lib/api/mobile-api";
import { ApiError } from "@/lib/api/mobile-api-client";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

jest.mock("@/lib/api/mobile-api", () => ({
  getMobileApi: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });

  return {
    queryClient,
    Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

const options = {
  students: [{ id: "student-1", level: "A2", name: "Candy Student" }],
};

describe("TeacherLessonEditorScreen", () => {
  it("creates a safe draft lesson for the general class", async () => {
    const createTeacherLesson = jest.fn(async () => ({
      lessonId: "lesson-new",
      message: "Aula criada.",
      ok: true as const,
      replayed: false,
      updatedAt: "2026-08-01T13:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      createTeacherLesson,
      getTeacherLessonOptions: jest.fn(async () => options),
    } as unknown as ReturnType<typeof getMobileApi>);
    const onSaved = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherLessonEditorScreen
        mode="create"
        onBack={jest.fn()}
        onSaved={onSaved}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Turma geral")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Título da aula"),
      "Conversation practice",
    );
    await fireEvent.press(view.getByRole("button", { name: "Criar aula" }));

    await waitFor(() =>
      expect(createTeacherLesson).toHaveBeenCalledWith({
        description: null,
        materials: [],
        operationId: "11111111-1111-4111-8111-111111111111",
        scheduledAt: null,
        status: "DRAFT",
        studentProfileId: null,
        title: "Conversation practice",
        vocabularyItems: [],
      }),
    );
    expect(onSaved).toHaveBeenCalledWith("lesson-new");

    await view.unmount();
    queryClient.clear();
  });

  it("loads and updates an owned lesson with its expected version", async () => {
    const updateTeacherLesson = jest.fn(async () => ({
      lessonId: "lesson-1",
      message: "Aula atualizada.",
      ok: true as const,
      replayed: false,
      updatedAt: "2026-08-01T14:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherLessonEditor: jest.fn(async () => ({
        description: "Practice introductions.",
        id: "lesson-1",
        materials: [],
        scheduledAt: null,
        status: "PUBLISHED" as const,
        studentProfileId: "student-1",
        title: "Introductions",
        updatedAt: "2026-08-01T13:00:00.000Z",
        vocabularyItems: [],
      })),
      getTeacherLessonOptions: jest.fn(async () => options),
      updateTeacherLesson,
    } as unknown as ReturnType<typeof getMobileApi>);
    const onSaved = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherLessonEditorScreen
        lessonId="lesson-1"
        mode="edit"
        onBack={jest.fn()}
        onSaved={onSaved}
      />,
      { wrapper: Wrapper },
    );

    const title = await view.findByDisplayValue("Introductions");
    await fireEvent.changeText(title, "Updated introductions");
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateTeacherLesson).toHaveBeenCalledWith(
        "lesson-1",
        expect.objectContaining({
          expectedUpdatedAt: "2026-08-01T13:00:00.000Z",
          studentProfileId: "student-1",
          title: "Updated introductions",
        }),
      ),
    );
    expect(onSaved).toHaveBeenCalledWith("lesson-1");

    await view.unmount();
    queryClient.clear();
  });

  it("explains an edit conflict without discarding the local form", async () => {
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherLessonEditor: jest.fn(async () => ({
        description: null,
        id: "lesson-1",
        materials: [],
        scheduledAt: null,
        status: "DRAFT" as const,
        studentProfileId: null,
        title: "Introductions",
        updatedAt: "2026-08-01T13:00:00.000Z",
        vocabularyItems: [],
      })),
      getTeacherLessonOptions: jest.fn(async () => ({ students: [] })),
      updateTeacherLesson: jest.fn(async () => {
        throw new ApiError(
          "LESSON_EDIT_CONFLICT",
          "Esta aula foi alterada em outro lugar.",
          409,
        );
      }),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherLessonEditorScreen
        lessonId="lesson-1"
        mode="edit"
        onBack={jest.fn()}
        onSaved={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    await view.findByDisplayValue("Introductions");
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar alterações" }),
    );

    expect(
      await view.findByText(
        "A aula mudou no site ou em outro aparelho. Recarregue a versão atual antes de salvar.",
      ),
    ).toBeTruthy();
    expect(view.getByDisplayValue("Introductions")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
