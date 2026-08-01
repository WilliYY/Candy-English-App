import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import type { PropsWithChildren } from "react";

import { ContractScreen } from "@/features/contracts/contract-screen";
import { getMobileApi } from "@/lib/api/mobile-api";
import { cacheProtectedContract } from "@/lib/files/protected-contract-cache";

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));
jest.mock("@/lib/api/mobile-api", () => ({
  getMobileApi: jest.fn(),
}));
jest.mock("@/lib/files/protected-contract-cache", () => ({
  cacheProtectedContract: jest.fn(),
  isValidProtectedContractMetadata: jest.fn(
    (value: { mimeType: string; sizeBytes: number }) =>
      value.mimeType === "application/pdf" &&
      value.sizeBytes > 0 &&
      value.sizeBytes <= 8 * 1024 * 1024,
  ),
  ProtectedContractError: class ProtectedContractError extends Error {},
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

describe("ContractScreen", () => {
  it("downloads an authorized PDF and opens the native share sheet", async () => {
    const getModule = jest.fn(async () => ({
      emptyMessage: "Nenhum contrato.",
      items: [
        {
          fileName: "Matrícula 2026.pdf",
          id: "contract-1",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          title: "Contrato de matrícula",
        },
      ],
      slug: "contracts",
      title: "Contratos",
    }));
    const getContractDownloadSource = jest.fn(async () => ({
      headers: { Authorization: "Bearer protected-token" },
      uri: "https://candy.example/api/mobile/v1/contracts/contract-1",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getContractDownloadSource,
      getModule,
    } as unknown as ReturnType<typeof getMobileApi>);
    jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
    jest.mocked(cacheProtectedContract).mockResolvedValue(
      "file:///cache/protected-contracts/hash.pdf",
    );
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <ContractScreen contractId="contract-1" onBack={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Contrato de matrícula")).toBeTruthy();
    await fireEvent.press(
      view.getByRole("button", { name: "Baixar e abrir PDF" }),
    );

    await waitFor(() => {
      expect(getContractDownloadSource).toHaveBeenCalledWith("contract-1");
      expect(cacheProtectedContract).toHaveBeenCalledWith(
        expect.objectContaining({
          contractId: "contract-1",
          sizeBytes: 1024,
        }),
      );
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        "file:///cache/protected-contracts/hash.pdf",
        expect.objectContaining({ mimeType: "application/pdf" }),
      );
    });

    expect(
      view.getByText("Contrato baixado com segurança e pronto para abrir."),
    ).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });

  it("loads ADMIN metadata without depending on the generic role module", async () => {
    const getModule = jest.fn();
    jest.mocked(getMobileApi).mockReturnValue({
      getContractDownloadSource: jest.fn(),
      getModule,
    } as unknown as ReturnType<typeof getMobileApi>);
    const loadContract = jest.fn(async () => ({
      fileName: "admin.pdf",
      id: "contract-admin",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      title: "Contrato administrativo",
    }));
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <ContractScreen
        contractId="contract-admin"
        loadContract={loadContract}
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Contrato administrativo")).toBeTruthy();
    expect(loadContract).toHaveBeenCalledTimes(1);
    expect(getModule).not.toHaveBeenCalled();

    view.unmount();
    queryClient.clear();
  });
});
