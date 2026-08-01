import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { AdminAgendaScreen } from "@/features/admin-agenda/admin-agenda-screen";
import type { MobileAdminAgenda } from "@/lib/api/admin-agenda-contracts";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const emptyCounts = {
  attendedCount: 0,
  count: 0,
  makeupCount: 0,
  missedCount: 0,
  scheduledCount: 0,
};
const agenda: MobileAdminAgenda = {
  dailyLessons: [
    {
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
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  ],
  days: Array.from({ length: 31 }, (_, index) => ({
    ...emptyCounts,
    ...(index === 9 ? { count: 1, scheduledCount: 1 } : {}),
    date: `2026-08-${String(index + 1).padStart(2, "0")}`,
  })),
  generatedAt: "2026-08-15T15:00:00.000Z",
  period: { month: 8, year: 2026 },
  selectedDate: "2026-08-10",
  summary: { ...emptyCounts, count: 1, scheduledCount: 1 },
  unit: "ALL",
};

describe("AdminAgendaScreen", () => {
  it("shows the monthly calendar, daily queue and applies safe filters", async () => {
    const getAdminAgenda = jest.fn(async () => agenda);
    const onOpenLesson = jest.fn();
    const view = await render(
      <AdminAgendaScreen
        client={{ getAdminAgenda }}
        initialDate="2026-08-10"
        initialPeriod={{ month: 8, year: 2026 }}
        onBack={jest.fn()}
        onOpenLesson={onOpenLesson}
      />,
      { wrapper: createWrapper() },
    );

    expect(await view.findByText("Ana Candy")).toBeTruthy();
    expect(view.getByText("14:00")).toBeTruthy();
    expect(view.getByText("44999999999")).toBeTruthy();
    expect(view.getByText("Responsavel avisado")).toBeTruthy();
    expect(view.getByText("aula(s) no mes")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Abrir aula de Ana Candy as 14:00"));
    expect(onOpenLesson).toHaveBeenCalledWith("lesson-1");

    await fireEvent.press(view.getByLabelText("Filtrar unidade Douradina"));
    await fireEvent.press(view.getByLabelText("Selecionar dia 11"));
    await fireEvent.changeText(view.getByLabelText("Buscar na agenda do dia"), "Bruna");
    await fireEvent.press(view.getByLabelText("Pesquisar agenda"));

    await waitFor(() => {
      expect(getAdminAgenda).toHaveBeenCalledWith({
        date: "2026-08-11",
        month: 8,
        query: "Bruna",
        unit: "DOURADINA",
        year: 2026,
      });
    });
    view.unmount();
  });
});
