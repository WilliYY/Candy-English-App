import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherHomeworkEditorScreen } from "@/features/teacher-homeworks/teacher-homework-editor-screen";
import { getMobileApi } from "@/lib/api/mobile-api";
import { ApiError } from "@/lib/api/mobile-api-client";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

jest.mock("@/lib/api/mobile-api", () => ({ getMobileApi: jest.fn() }));

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
  lessons: [
    {
      id: "lesson-1",
      status: "DRAFT" as const,
      studentProfileId: "student-1",
      title: "Introductions",
    },
  ],
  students: [{ id: "student-1", level: "A1", name: "Ana" }],
};

const homework = {
  assetFileName: null,
  dueDate: null,
  hasSubmissions: false,
  id: "homework-1",
  instructions: "Answer in English.",
  interactiveFieldCount: 0,
  kind: "TEXT" as const,
  lessonId: "lesson-1",
  questions: [
    {
      expectedAnswer: null,
      id: "question-1",
      prompt: "How are you?",
    },
  ],
  status: "DRAFT" as const,
  studentProfileIds: ["student-1"],
  title: "Daily conversation",
  updatedAt: "2026-08-01T15:00:00.000Z",
};

describe("TeacherHomeworkEditorScreen", () => {
  it("creates a text homework in the selected lesson", async () => {
    const createTeacherHomework = jest.fn(async () => ({
      homeworkId: "homework-new",
      message: "Tarefa criada.",
      ok: true as const,
      replayed: false,
      updatedAt: "2026-08-01T16:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      createTeacherHomework,
      getTeacherHomeworkOptions: jest.fn(async () => options),
    } as unknown as ReturnType<typeof getMobileApi>);
    const onSaved = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherHomeworkEditorScreen
        lessonId="lesson-1"
        mode="create"
        onBack={jest.fn()}
        onDeleted={jest.fn()}
        onSaved={onSaved}
      />,
      { wrapper: Wrapper },
    );

    await fireEvent.changeText(
      await view.findByLabelText("Título da tarefa"),
      "Daily conversation",
    );
    await fireEvent.changeText(
      view.getByLabelText("Enunciado da pergunta 1"),
      "How are you?",
    );
    await fireEvent.press(view.getByRole("button", { name: "Criar tarefa" }));

    await waitFor(() =>
      expect(createTeacherHomework).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: "lesson-1",
          questions: [{ expectedAnswer: null, prompt: "How are you?" }],
          status: "DRAFT",
          studentProfileIds: ["student-1"],
          title: "Daily conversation",
        }),
      ),
    );
    expect(onSaved).toHaveBeenCalledWith("homework-new");
    view.unmount();
    queryClient.clear();
  });

  it("updates with the loaded version and preserves local data on conflict", async () => {
    const updateTeacherHomework = jest.fn(async () => {
      throw new ApiError(
        "HOMEWORK_EDIT_CONFLICT",
        "Tarefa alterada em outro lugar.",
        409,
      );
    });
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherHomeworkEditor: jest.fn(async () => homework),
      getTeacherHomeworkOptions: jest.fn(async () => options),
      updateTeacherHomework,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherHomeworkEditorScreen
        homeworkId="homework-1"
        mode="edit"
        onBack={jest.fn()}
        onDeleted={jest.fn()}
        onSaved={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    const title = await view.findByDisplayValue("Daily conversation");
    await fireEvent.changeText(title, "Updated conversation");
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar alterações" }),
    );

    await waitFor(() =>
      expect(updateTeacherHomework).toHaveBeenCalledWith(
        "homework-1",
        expect.objectContaining({
          expectedUpdatedAt: "2026-08-01T15:00:00.000Z",
          title: "Updated conversation",
        }),
      ),
    );
    expect(
      await view.findByText(
        "A tarefa mudou no site ou em outro aparelho. Recarregue a versão atual antes de continuar.",
      ),
    ).toBeTruthy();
    expect(view.getByDisplayValue("Updated conversation")).toBeTruthy();
    view.unmount();
    queryClient.clear();
  });

  it("advances the local version after each successful edit", async () => {
    const updateTeacherHomework = jest
      .fn()
      .mockResolvedValueOnce({
        homeworkId: "homework-1",
        message: "Primeira alteração salva.",
        ok: true as const,
        replayed: false,
        updatedAt: "2026-08-01T16:00:00.000Z",
      })
      .mockResolvedValueOnce({
        homeworkId: "homework-1",
        message: "Segunda alteração salva.",
        ok: true as const,
        replayed: false,
        updatedAt: "2026-08-01T17:00:00.000Z",
      });
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherHomeworkEditor: jest.fn(async () => homework),
      getTeacherHomeworkOptions: jest.fn(async () => options),
      updateTeacherHomework,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherHomeworkEditorScreen
        homeworkId="homework-1"
        mode="edit"
        onBack={jest.fn()}
        onDeleted={jest.fn()}
        onSaved={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    const title = await view.findByDisplayValue("Daily conversation");
    await fireEvent.changeText(title, "First update");
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() => expect(updateTeacherHomework).toHaveBeenCalledTimes(1));

    await fireEvent.changeText(title, "Second update");
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar alterações" }),
    );
    await waitFor(() => expect(updateTeacherHomework).toHaveBeenCalledTimes(2));
    expect(updateTeacherHomework.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        expectedUpdatedAt: "2026-08-01T16:00:00.000Z",
        title: "Second update",
      }),
    );
    view.unmount();
    queryClient.clear();
  });

  it("requires explicit confirmation before deleting", async () => {
    const deleteTeacherHomework = jest.fn(async () => ({
      homeworkId: "homework-1",
      message: "Tarefa excluída.",
      ok: true as const,
      replayed: false,
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      deleteTeacherHomework,
      getTeacherHomeworkEditor: jest.fn(async () => homework),
      getTeacherHomeworkOptions: jest.fn(async () => options),
    } as unknown as ReturnType<typeof getMobileApi>);
    const onDeleted = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherHomeworkEditorScreen
        homeworkId="homework-1"
        mode="edit"
        onBack={jest.fn()}
        onDeleted={onDeleted}
        onSaved={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    await view.findByDisplayValue("Daily conversation");
    await fireEvent.press(view.getByRole("button", { name: "Quero excluir" }));
    expect(deleteTeacherHomework).not.toHaveBeenCalled();
    await fireEvent.press(
      view.getByRole("button", { name: "Confirmar exclusão" }),
    );

    await waitFor(() =>
      expect(deleteTeacherHomework).toHaveBeenCalledWith("homework-1", {
        expectedUpdatedAt: "2026-08-01T15:00:00.000Z",
        operationId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(onDeleted).toHaveBeenCalled();
    view.unmount();
    queryClient.clear();
  });
});
