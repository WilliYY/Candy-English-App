import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherPreRegistrationScreen } from "@/features/teacher-secretary/teacher-pre-registration-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

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
    Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    },
  };
}

function detail(converted = false) {
  return {
    agenda: { complete: false, days: null, time: null },
    canConvert: !converted,
    converted,
    email: "student@example.com",
    englishGoal: "Conversation",
    estimatedLevel: "A2",
    finance: { complete: false },
    fullName: "Student One",
    id: "request-1",
    phone: "44999990000",
    status: converted ? ("APPROVED" as const) : ("READY_TO_CONVERT" as const),
    statusNote: null,
    unit: "IVATE" as const,
    updatedAt: "2026-08-01T20:00:00.000Z",
  };
}

describe("TeacherPreRegistrationScreen", () => {
  it("converts with explicit missing-agenda and double confirmation", async () => {
    const getTeacherPreRegistration = jest.fn(async () => detail());
    const convertTeacherPreRegistration = jest.fn(async () => ({
      message: "Aluno convertido com AVA.",
      preRegistration: detail(true),
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      convertTeacherPreRegistration,
      getTeacherPreRegistration,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { Wrapper } = createWrapper();
    const view = await render(
      <TeacherPreRegistrationScreen onBack={jest.fn()} requestId="request-1" />,
      { wrapper: Wrapper },
    );

    await view.findByText("Student One");
    await fireEvent.changeText(
      view.getByLabelText("Email para login"),
      "new@example.com",
    );
    await fireEvent.changeText(
      view.getByLabelText("Senha inicial"),
      "StrongPass123",
    );
    await fireEvent.press(view.getByRole("checkbox"));
    await fireEvent.press(view.getByText("Tornar aluno"));
    expect(convertTeacherPreRegistration).not.toHaveBeenCalled();
    await fireEvent.press(await view.findByText("Confirmar conversão agora"));

    await waitFor(() => {
      expect(convertTeacherPreRegistration).toHaveBeenCalledWith("request-1", {
        confirmConversion: true,
        confirmMissingAgendaData: true,
        emailForLogin: "new@example.com",
        initialPassword: "StrongPass123",
        operationId: "11111111-1111-4111-8111-111111111111",
      });
    });
  });

  it("keeps an already converted request read-only", async () => {
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherPreRegistration: jest.fn(async () => detail(true)),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { Wrapper } = createWrapper();
    const view = await render(
      <TeacherPreRegistrationScreen onBack={jest.fn()} requestId="request-1" />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Pré-cadastro já convertido")).toBeTruthy();
    expect(view.queryByLabelText("Senha inicial")).toBeNull();
  });
});
