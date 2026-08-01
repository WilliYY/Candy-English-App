import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import type { PropsWithChildren } from "react";

import { AdminContractsScreen } from "@/features/admin-contracts/admin-contracts-screen";
import type { MobileAdminContractCatalog } from "@/lib/api/admin-contracts-contracts";

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
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    },
  };
}

const catalog: MobileAdminContractCatalog = {
  contracts: [
    {
      createdAt: "2026-08-01T20:00:00.000Z",
      fileName: "matricula.pdf",
      id: "contract-1",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      student: { id: "student-1", name: "Ana Candy" },
      title: "Contrato de matricula",
      uploadedByName: "Admin Candy",
    },
  ],
  generatedAt: "2026-08-01T20:00:00.000Z",
  hasMore: false,
  nextCursor: null,
  students: [
    { id: "student-1", name: "Ana Candy" },
    { id: "student-2", name: "Bruno Candy" },
  ],
  summary: { general: 2, studentSpecific: 3, total: 5 },
};

describe("AdminContractsScreen", () => {
  it("shows the safe catalog, filters it and opens a contract", async () => {
    const getAdminContracts = jest.fn(async () => catalog);
    const onOpenContract = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <AdminContractsScreen
        client={{
          getAdminContracts,
          uploadAdminContract: jest.fn(),
        }}
        onBack={jest.fn()}
        onOpenContract={onOpenContract}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Contrato de matricula")).toBeTruthy();
    expect(view.getByText("5")).toBeTruthy();
    expect(view.getByText("Ana Candy")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Abrir Contrato de matricula"));
    expect(onOpenContract).toHaveBeenCalledWith("contract-1");

    await fireEvent.press(view.getByLabelText("Filtrar contratos de alunos"));
    await fireEvent.changeText(
      view.getByLabelText("Buscar contratos"),
      "Ana",
    );
    await fireEvent.press(view.getByLabelText("Pesquisar contratos"));
    await waitFor(() => {
      expect(getAdminContracts).toHaveBeenCalledWith({
        assignment: "STUDENT",
        limit: 30,
        query: "Ana",
      });
    });
    view.unmount();
    queryClient.clear();
  });

  it("selects, confirms and uploads a PDF with a stable operation id", async () => {
    const getAdminContracts = jest.fn(async () => catalog);
    const uploadAdminContract = jest.fn(async () => ({
      contract: catalog.contracts[0]!,
      message: "Contrato enviado com sucesso.",
      replayed: false,
    }));
    jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.text === "Enviar")?.onPress?.();
    });
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <AdminContractsScreen
        client={{ getAdminContracts, uploadAdminContract }}
        createOperationId={() => "9dfda8f1-4c48-4302-a2a1-5611d652e151"}
        onBack={jest.fn()}
        onOpenContract={jest.fn()}
        pickDocument={async () => ({
          mimeType: "application/pdf",
          name: "novo.pdf",
          size: 4096,
          uri: "file:///novo.pdf",
        })}
      />,
      { wrapper: Wrapper },
    );

    await view.findByText("Contrato de matricula");
    await fireEvent.changeText(
      view.getByLabelText("Titulo do contrato"),
      "Contrato novo",
    );
    await fireEvent.press(view.getByLabelText("Selecionar aluno Ana Candy"));
    await fireEvent.press(view.getByLabelText("Selecionar PDF"));
    expect(await view.findByText(/novo\.pdf/)).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Enviar contrato"));

    await waitFor(() => {
      expect(uploadAdminContract).toHaveBeenCalledWith({
        confirmUpload: true,
        file: {
          mimeType: "application/pdf",
          name: "novo.pdf",
          size: 4096,
          uri: "file:///novo.pdf",
        },
        operationId: "9dfda8f1-4c48-4302-a2a1-5611d652e151",
        studentProfileId: "student-1",
        title: "Contrato novo",
      });
    });
    expect(await view.findByText("Contrato enviado com sucesso.")).toBeTruthy();
    await waitFor(() => expect(getAdminContracts).toHaveBeenCalledTimes(2));
    view.unmount();
    queryClient.clear();
    jest.restoreAllMocks();
  });
});
