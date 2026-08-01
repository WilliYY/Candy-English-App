import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { PropsWithChildren } from "react";

import { AdminOperationsScreen } from "@/features/admin-operations/admin-operations-screen";
import type { MobileAdminOperations } from "@/lib/api/admin-operations-contracts";

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

const operations: MobileAdminOperations = {
  generatedAt: "2026-08-01T19:00:00.000Z",
  maintenance: {
    enabled: false,
    updatedAt: "2026-08-01T18:00:00.000Z",
  },
  storage: { usageBytes: 12_345 },
};

describe("AdminOperationsScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows only safe operational status and confirms maintenance changes", async () => {
    const updateAdminMaintenance = jest.fn(async () => ({
      changed: true,
      maintenance: {
        enabled: true,
        updatedAt: "2026-08-01T19:01:00.000Z",
      },
      message: "Manutencao atualizada com sucesso.",
      replayed: false,
    }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Ativar")?.onPress?.();
    });
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <AdminOperationsScreen
        client={{
          getAdminOperations: async () => operations,
          updateAdminMaintenance,
        }}
        createOperationId={() => "44444444-4444-4444-8444-444444444444"}
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("OPERAÇÃO NORMAL")).toBeTruthy();
    expect(view.getByText("12,1 KB")).toBeTruthy();
    expect(
      view.getByText("APIs e senhas ficam somente no site"),
    ).toBeTruthy();

    await fireEvent.press(view.getByText("Ativar manutenção"));
    await waitFor(() =>
      expect(updateAdminMaintenance).toHaveBeenCalledWith({
        confirmChange: true,
        enabled: true,
        expectedUpdatedAt: "2026-08-01T18:00:00.000Z",
        operationId: "44444444-4444-4444-8444-444444444444",
      }),
    );
    expect(await view.findByText("MANUTENÇÃO ATIVA")).toBeTruthy();
    queryClient.clear();
  });

  it("keeps the same operation id for an explicit retry", async () => {
    const updateAdminMaintenance = jest
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        changed: true,
        maintenance: {
          enabled: true,
          updatedAt: "2026-08-01T19:01:00.000Z",
        },
        message: "Manutencao atualizada com sucesso.",
        replayed: false,
      });
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Ativar")?.onPress?.();
    });
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <AdminOperationsScreen
        client={{
          getAdminOperations: async () => operations,
          updateAdminMaintenance,
        }}
        createOperationId={() => "55555555-5555-4555-8555-555555555555"}
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    await view.findByText("OPERAÇÃO NORMAL");
    await fireEvent.press(view.getByText("Ativar manutenção"));
    expect(await view.findByText("offline")).toBeTruthy();
    await fireEvent.press(view.getByText("Ativar manutenção"));

    await waitFor(() => expect(updateAdminMaintenance).toHaveBeenCalledTimes(2));
    expect(updateAdminMaintenance.mock.calls[0]?.[0].operationId).toBe(
      updateAdminMaintenance.mock.calls[1]?.[0].operationId,
    );
    queryClient.clear();
  });
});
