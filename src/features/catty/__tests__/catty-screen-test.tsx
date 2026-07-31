import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { CattyScreen } from "@/features/catty/catty-screen";

describe("CattyScreen", () => {
  it("loads protected history and sends a student message", async () => {
    const getCattyHistory = jest.fn(async () => [
      { from: "catty" as const, id: "catty-1", text: "Hello! = Ola!" },
    ]);
    const sendCattyMessage = jest.fn(async () => ({
      messageId: "catty-2",
      reply: "Good morning! = Bom dia!",
      source: "gemini" as const,
    }));
    const client = { getCattyHistory, sendCattyMessage };
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { gcTime: Infinity, retry: false },
        queries: { gcTime: Infinity, retry: false },
      },
    });

    function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    const view = await render(
      <CattyScreen
        client={client}
        onBack={jest.fn()}
        role="STUDENT"
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Hello! = Ola!")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Mensagem para a Catty"),
      "Good morning",
    );
    await fireEvent.press(view.getByLabelText("Enviar para a Catty"));

    await waitFor(() => {
      expect(sendCattyMessage).toHaveBeenCalledWith({
        context: { area: "student" },
        history: [
          { from: "catty", id: "catty-1", text: "Hello! = Ola!" },
        ],
        message: "Good morning",
      });
    });
    expect(await view.findByText("Good morning! = Bom dia!")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
