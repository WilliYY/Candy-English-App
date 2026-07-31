import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Linking from "expo-linking";
import type { PropsWithChildren } from "react";

import { LiveClassScreen } from "@/features/live-class/live-class-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("expo-linking", () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));
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

describe("LiveClassScreen", () => {
  it("shows the same live-class maintenance state as the site", async () => {
    const getLiveClass = jest.fn(async () => ({
      generatedAt: "2026-07-30T15:00:00.000Z",
      maintenance: {
        enabled: true,
        message: "Aula ao vivo em manutencao.",
      },
      role: "STUDENT" as const,
      sessions: [],
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getLiveClass,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <LiveClassScreen onBack={jest.fn()} role="STUDENT" />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Em manutenção")).toBeTruthy();
    expect(view.getByText("Aula ao vivo em manutencao.")).toBeTruthy();
    expect(getLiveClass).toHaveBeenCalledTimes(1);

    await view.unmount();
    queryClient.clear();
  });

  it("opens only the HTTPS join link returned by the backend", async () => {
    const getLiveClass = jest.fn(async () => ({
      generatedAt: "2026-07-30T15:00:00.000Z",
      maintenance: {
        enabled: false,
        message: null,
      },
      role: "STUDENT" as const,
      sessions: [
        {
          createdAt: "2026-07-30T14:00:00.000Z",
          endsAt: null,
          id: "live-1",
          isLive: true,
          joinUrl: "https://meet.jit.si/candy-room",
          startsAt: "2026-07-30T15:00:00.000Z",
          studentName: "Candy Student",
          teacherName: "Teacher Candy",
          title: "Conversation",
        },
      ],
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getLiveClass,
    } as unknown as ReturnType<typeof getMobileApi>);
    jest.mocked(Linking.canOpenURL).mockResolvedValue(true);
    jest.mocked(Linking.openURL).mockResolvedValue(true);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <LiveClassScreen onBack={jest.fn()} role="STUDENT" />,
      { wrapper: Wrapper },
    );

    await fireEvent.press(
      await view.findByRole("link", { name: "Entrar na aula" }),
    );

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        "https://meet.jit.si/candy-room",
      );
    });

    await view.unmount();
    queryClient.clear();
  });
});
