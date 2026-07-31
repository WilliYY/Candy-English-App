import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { NotificationsScreen } from "@/features/notifications/notifications-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("@/lib/api/mobile-api", () => ({
  getMobileApi: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
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

describe("NotificationsScreen", () => {
  it("renders the synchronized categories without private feedback", async () => {
    const getNotifications = jest.fn(async () => ({
      generatedAt: "2026-07-30T15:00:00.000Z",
      items: [
        {
          eventAt: "2026-07-30T14:30:00.000Z",
          id: "achievement:xp-1",
          summary: "Voce ganhou 25 XP no Candy English.",
          target: { id: null, kind: "CANDY_XP" as const },
          title: "Conquista: Primeiro badge",
          type: "ACHIEVEMENT" as const,
        },
        {
          eventAt: "2026-07-30T14:00:00.000Z",
          id: "feedback:submission-1",
          summary: "Abra a tarefa para consultar o feedback da teacher.",
          target: { id: "homework-1", kind: "HOMEWORK" as const },
          title: "Correcao disponivel: Speaking practice",
          type: "FEEDBACK" as const,
        },
        {
          eventAt: "2026-07-30T13:00:00.000Z",
          id: "homework:homework-2",
          summary: "Uma tarefa esta disponivel para voce.",
          target: { id: "homework-2", kind: "HOMEWORK" as const },
          title: "Tarefa: My routine",
          type: "HOMEWORK" as const,
        },
        {
          eventAt: "2026-07-30T12:00:00.000Z",
          id: "lesson:lesson-1",
          summary: "Uma aula foi liberada ou atualizada para voce.",
          target: { id: "lesson-1", kind: "LESSON" as const },
          title: "Aula: Simple present",
          type: "CLASS" as const,
        },
      ],
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getNotifications,
    } as unknown as ReturnType<typeof getMobileApi>);
    const onOpenTarget = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <NotificationsScreen
        onBack={jest.fn()}
        onOpenTarget={onOpenTarget}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("CONQUISTA")).toBeTruthy();
    expect(view.getByText("CORREÇÃO")).toBeTruthy();
    expect(view.getByText("TAREFA")).toBeTruthy();
    expect(view.getByText("AULA")).toBeTruthy();
    expect(view.queryByText("Texto privado da teacher")).toBeNull();

    await fireEvent.press(
      view.getByRole("button", {
        name: "Abrir Correcao disponivel: Speaking practice",
      }),
    );
    expect(onOpenTarget).toHaveBeenCalledWith({
      id: "homework-1",
      kind: "HOMEWORK",
    });

    await view.unmount();
    queryClient.clear();
  });

  it("shows a calm empty state when there are no notices", async () => {
    jest.mocked(getMobileApi).mockReturnValue({
      getNotifications: jest.fn(async () => ({
        generatedAt: "2026-07-30T15:00:00.000Z",
        items: [],
      })),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <NotificationsScreen
        onBack={jest.fn()}
        onOpenTarget={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Tudo em dia por aqui")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
