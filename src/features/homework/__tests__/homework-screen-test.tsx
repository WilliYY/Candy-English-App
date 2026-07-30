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
});
