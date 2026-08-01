import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherInteractiveFieldEditorScreen } from "@/features/teacher-homeworks/teacher-interactive-field-editor-screen";
import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileTeacherInteractiveFieldUpdateInput } from "@/lib/api/mobile-api-client";

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

function editor(hasSubmissions = false) {
  return {
    assetFileName: "activity.pdf",
    fields: [
      {
        height: 4,
        id: "field-1",
        label: "Answer",
        page: 1,
        placeholder: "Type here",
        required: true,
        sortOrder: 0,
        type: "LONG_TEXT" as const,
        width: 80,
        x: 10,
        y: 15,
      },
    ],
    hasSubmissions,
    homeworkId: "homework-1",
    pageCount: 2,
    title: "Interactive activity",
    updatedAt: "2026-08-01T18:00:00.000Z",
  };
}

describe("TeacherInteractiveFieldEditorScreen", () => {
  it("adds and saves native interactive fields with optimistic version data", async () => {
    const getTeacherInteractiveFields = jest.fn(async () => editor());
    const updateTeacherInteractiveFields = jest.fn(
      async (_id: string, input: MobileTeacherInteractiveFieldUpdateInput) => ({
      editor: {
        ...editor(),
        fields: input.fields.map((field, index) => ({
          ...field,
          id: field.id ?? `field-${index + 1}`,
          sortOrder: index,
        })),
        updatedAt: "2026-08-01T18:01:00.000Z",
      },
      message: "2 campo(s) salvos com sucesso.",
      }),
    );
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherInteractiveFields,
      updateTeacherInteractiveFields,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherInteractiveFieldEditorScreen
        homeworkId="homework-1"
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Interactive activity")).toBeTruthy();
    await fireEvent.press(view.getByRole("button", { name: "+ Adicionar campo" }));
    expect(view.getByText("Campo 2")).toBeTruthy();
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar campos interativos" }),
    );
    await waitFor(() =>
      expect(updateTeacherInteractiveFields).toHaveBeenCalledWith(
        "homework-1",
        expect.objectContaining({
          expectedUpdatedAt: "2026-08-01T18:00:00.000Z",
          fields: expect.arrayContaining([
            expect.objectContaining({ id: "field-1" }),
            expect.objectContaining({ id: null }),
          ]),
          operationId: "11111111-1111-4111-8111-111111111111",
        }),
      ),
    );
    expect(await view.findByText("2 campo(s) salvos com sucesso.")).toBeTruthy();
    expect(await view.findByText("Salvar campos interativos")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });

  it("shows existing fields read-only after a submission", async () => {
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherInteractiveFields: jest.fn(async () => editor(true)),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherInteractiveFieldEditorScreen
        homeworkId="homework-1"
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Estrutura protegida")).toBeTruthy();
    expect(view.getByText("1 campo(s) cadastrados")).toBeTruthy();
    expect(
      view.queryByRole("button", { name: "Salvar campos interativos" }),
    ).toBeNull();

    await view.unmount();
    queryClient.clear();
  });
});
