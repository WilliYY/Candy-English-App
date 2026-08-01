import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";

import { AdminAgendaLessonScreen } from "@/features/admin-agenda/admin-agenda-lesson-screen";
import type { MobileAdminAgendaLessonDetail } from "@/lib/api/admin-agenda-contracts";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const detail: MobileAdminAgendaLessonDetail = {
  history: [
    {
      action: "ATTENDANCE",
      actorName: "Williany",
      createdAt: "2026-08-11T12:05:00.000Z",
      description: "Presenca confirmada: Ana Candy.",
      id: "log-1",
      lessonId: "lesson-1",
    },
  ],
  lesson: {
    date: "2026-08-10",
    id: "lesson-1",
    isMakeup: false,
    lessonNote: "Levar material",
    status: "SCHEDULED",
    studentId: "student-1",
    studentName: "Ana Candy",
    studentNote: "Responsavel avisado",
    studentPhone: "44999999999",
    studentUnit: "IVATE",
    time: "14:00",
    updatedAt: "2026-08-11T12:00:00.000Z",
  },
};

describe("AdminAgendaLessonScreen", () => {
  afterEach(() => jest.restoreAllMocks());

  it("shows safe history and updates attendance only after confirmation", async () => {
    const getAdminAgendaLesson = jest.fn(async () => detail);
    const updateAdminAgendaAttendance = jest.fn(async (_id, input) => ({
      lesson: { ...detail.lesson, status: input.status, updatedAt: "2026-08-11T12:01:00.000Z" },
      message: "Presenca atualizada.",
      replayed: false,
    }));
    const createAdminAgendaMakeup = jest.fn();
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
    });
    const view = await render(
      <AdminAgendaLessonScreen
        client={{
          createAdminAgendaMakeup,
          getAdminAgendaLesson,
          updateAdminAgendaAttendance,
        }}
        lessonId="lesson-1"
        onBack={jest.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    expect(view.getByText("Presenca confirmada: Ana Candy.")).toBeTruthy();
    expect(view.getByText("Williany")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Marcar Ana Candy como veio"));

    await waitFor(() => {
      expect(updateAdminAgendaAttendance).toHaveBeenCalledWith("lesson-1", {
        confirmChange: true,
        expectedUpdatedAt: detail.lesson.updatedAt,
        operationId: "11111111-1111-4111-8111-111111111111",
        status: "ATTENDED",
      });
    });
    view.unmount();
  });

  it("creates a makeup only after validation and confirmation", async () => {
    const getAdminAgendaLesson = jest.fn(async () => detail);
    const updateAdminAgendaAttendance = jest.fn();
    const createAdminAgendaMakeup = jest.fn(async () => ({
      makeupLesson: {
        ...detail.lesson,
        date: "2026-08-20",
        id: "makeup-1",
        isMakeup: true,
        status: "MAKEUP_SCHEDULED" as const,
        time: "15:30",
      },
      message: "Reposicao criada.",
      replayed: false,
    }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
    });
    const view = await render(
      <AdminAgendaLessonScreen
        client={{
          createAdminAgendaMakeup,
          getAdminAgendaLesson,
          updateAdminAgendaAttendance,
        }}
        lessonId="lesson-1"
        onBack={jest.fn()}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText("Data da reposicao"), "2026-08-20");
    await fireEvent.changeText(view.getByLabelText("Horario da reposicao"), "15:30");
    await fireEvent.changeText(view.getByLabelText("Observacao da reposicao"), "Reposicao combinada");
    await fireEvent.press(view.getByLabelText("Criar reposicao para Ana Candy"));

    await waitFor(() => {
      expect(createAdminAgendaMakeup).toHaveBeenCalledWith("lesson-1", {
        confirmCreate: true,
        date: "2026-08-20",
        expectedUpdatedAt: detail.lesson.updatedAt,
        notes: "Reposicao combinada",
        operationId: "11111111-1111-4111-8111-111111111111",
        time: "15:30",
      });
    });
    view.unmount();
  });
});
