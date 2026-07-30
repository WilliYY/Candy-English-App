import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";

import { HomeworkScreen } from "@/features/homework/homework-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("@/lib/api/mobile-api", () => ({
  getMobileApi: jest.fn(),
}));

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

describe("HomeworkScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads feedback and confirms a text homework submission", async () => {
    const getHomework = jest.fn(async () => ({
      answer: "First answer",
      canSubmit: true,
      dueDate: "2026-08-01T12:00:00.000Z",
      feedback: "Try using a complete sentence.",
      id: "homework-1",
      instructions: "Answer in English.",
      interactiveAnswers: [],
      interactiveFields: [],
      kind: "TEXT" as const,
      lessonTitle: "Lesson 1",
      questions: [{ id: "question-1", prompt: "How are you?" }],
      reviewedAt: null,
      status: "PUBLISHED" as const,
      submissionStatus: "RETURNED" as const,
      title: "Introductions",
    }));
    const submitHomework = jest.fn(async () => ({
      message: "Homework enviada com sucesso.",
      ok: true as const,
      submittedAt: "2026-07-30T14:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getHomework,
      submitHomework,
    } as unknown as ReturnType<typeof getMobileApi>);
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <HomeworkScreen homeworkId="homework-1" onBack={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Introductions")).toBeTruthy();
    expect(
      await view.findByText("Try using a complete sentence."),
    ).toBeTruthy();

    await fireEvent.changeText(
      view.getByLabelText("Resposta da homework"),
      "I am great!",
    );
    await fireEvent.press(
      view.getByRole("button", { name: "Enviar para correção" }),
    );

    expect(alert).toHaveBeenCalledTimes(1);
    const buttons = alert.mock.calls[0]?.[2];
    const confirm = buttons?.find((button) => button.text === "Enviar agora");

    await act(async () => {
      confirm?.onPress?.();
    });

    await waitFor(() => {
      expect(submitHomework).toHaveBeenCalledWith(
        "homework-1",
        "I am great!",
      );
    });
    await waitFor(() => {
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    });

    await view.unmount();
    queryClient.clear();
  }, 15_000);

  it("saves a native interactive draft and submits required fields", async () => {
    const getHomework = jest.fn(async () => ({
      answer: "",
      canSubmit: true,
      dueDate: null,
      feedback: null,
      id: "interactive-1",
      instructions: "Complete all fields.",
      interactiveAnswers: [],
      interactiveFields: [
        {
          id: "field-text",
          label: "Your answer",
          placeholder: "Type here",
          required: true,
          sortOrder: 0,
          type: "SHORT_TEXT" as const,
        },
        {
          id: "field-check",
          label: "I reviewed my answer",
          placeholder: null,
          required: true,
          sortOrder: 1,
          type: "CHECKBOX" as const,
        },
      ],
      kind: "INTERACTIVE" as const,
      lessonTitle: "Lesson 2",
      questions: [],
      reviewedAt: null,
      status: "PUBLISHED" as const,
      submissionStatus: null,
      title: "Interactive practice",
    }));
    const saveInteractiveHomeworkDraft = jest.fn(async () => ({
      message: "Rascunho salvo.",
      ok: true as const,
      status: "DRAFT" as const,
    }));
    const submitInteractiveHomework = jest.fn(async () => ({
      message: "Homework entregue com sucesso.",
      ok: true as const,
      status: "SUBMITTED" as const,
      submittedAt: "2026-07-30T15:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getHomework,
      saveInteractiveHomeworkDraft,
      submitInteractiveHomework,
    } as unknown as ReturnType<typeof getMobileApi>);
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <HomeworkScreen homeworkId="interactive-1" onBack={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Interactive practice")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Your answer *"),
      "I am ready.",
    );
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar rascunho" }),
    );

    await waitFor(() => {
      expect(saveInteractiveHomeworkDraft).toHaveBeenCalledWith(
        "interactive-1",
        [
          { fieldId: "field-text", value: "I am ready." },
          { fieldId: "field-check", value: "" },
        ],
      );
    });

    await fireEvent.press(view.getByLabelText("I reviewed my answer *"));
    await fireEvent.press(
      view.getByRole("button", { name: "Entregar atividade" }),
    );
    const buttons = alert.mock.calls.at(-1)?.[2];
    const confirm = buttons?.find(
      (button) => button.text === "Entregar agora",
    );

    await act(async () => {
      confirm?.onPress?.();
    });

    await waitFor(() => {
      expect(submitInteractiveHomework).toHaveBeenCalledWith(
        "interactive-1",
        [
          { fieldId: "field-text", value: "I am ready." },
          { fieldId: "field-check", value: "true" },
        ],
      );
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    });

    await view.unmount();
    queryClient.clear();
  }, 15_000);
});
