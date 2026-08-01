import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherSubmissionDetailScreen } from "@/features/teacher-submissions/teacher-submission-detail-screen";
import { TeacherSubmissionQueueScreen } from "@/features/teacher-submissions/teacher-submission-queue-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "11111111-1111-4111-8111-111111111111"),
}));

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

function submission() {
  return {
    answers: [
      {
        id: "text-answer",
        label: "How are you?",
        type: "TEXT" as const,
        value: "I am fine.",
      },
    ],
    feedback: null,
    hasAnnotations: false,
    homework: {
      id: "homework-1",
      instructions: "Answer in English.",
      kind: "TEXT" as const,
      lessonTitle: "Conversation",
      questions: [
        {
          expectedAnswer: "I am fine.",
          id: "question-1",
          prompt: "How are you?",
        },
      ],
      title: "Daily conversation",
    },
    id: "submission-1",
    reviewedAt: null,
    status: "SUBMITTED" as const,
    student: { id: "student-1", level: "A1", name: "Ana" },
    submittedAt: "2026-08-01T15:00:00.000Z",
  };
}

describe("teacher submission screens", () => {
  it("shows pending submissions first and opens the selected correction", async () => {
    const onOpenSubmission = jest.fn();
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherSubmissions: jest.fn(async () => ({
        hasMore: false,
        submissions: [
          {
            feedbackPresent: false,
            homeworkId: "homework-1",
            homeworkKind: "TEXT" as const,
            homeworkTitle: "Daily conversation",
            id: "submission-1",
            lessonTitle: "Conversation",
            reviewedAt: null,
            status: "SUBMITTED" as const,
            studentLevel: "A1",
            studentName: "Ana",
            submittedAt: "2026-08-01T15:00:00.000Z",
          },
          {
            feedbackPresent: true,
            homeworkId: "homework-2",
            homeworkKind: "INTERACTIVE" as const,
            homeworkTitle: "Listening",
            id: "submission-2",
            lessonTitle: "At the airport",
            reviewedAt: "2026-08-01T16:00:00.000Z",
            status: "REVIEWED" as const,
            studentLevel: "A2",
            studentName: "Bia",
            submittedAt: "2026-08-01T14:00:00.000Z",
          },
        ],
      })),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherSubmissionQueueScreen
        onBack={jest.fn()}
        onOpenSubmission={onOpenSubmission}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Ana")).toBeTruthy();
    expect(view.queryByText("Bia")).toBeNull();
    await fireEvent.press(
      view.getByRole("button", {
        name: "Corrigir Daily conversation, entrega de Ana",
      }),
    );
    expect(onOpenSubmission).toHaveBeenCalledWith("submission-1");

    await view.unmount();
    queryClient.clear();
  });

  it("sends feedback with the loaded submission version", async () => {
    const getTeacherSubmission = jest.fn(async () => submission());
    const reviewTeacherSubmission = jest.fn(async () => ({
      feedback: "Great work!",
      message: "Feedback enviado com sucesso.",
      ok: true as const,
      replayed: false,
      reviewedAt: "2026-08-01T16:00:00.000Z",
      status: "REVIEWED" as const,
      submissionId: "submission-1",
      submittedAt: "2026-08-01T15:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherSubmission,
      reviewTeacherSubmission,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherSubmissionDetailScreen
        onBack={jest.fn()}
        submissionId="submission-1"
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(getTeacherSubmission).toHaveBeenCalledTimes(1));
    expect(await view.findByText("Daily conversation")).toBeTruthy();
    await fireEvent.changeText(
      view.getByLabelText("Feedback para o aluno"),
      "Great work!",
    );
    await fireEvent.press(view.getByRole("button", { name: "Enviar feedback" }));
    await waitFor(() =>
      expect(reviewTeacherSubmission).toHaveBeenCalledWith("submission-1", {
        expectedReviewedAt: null,
        expectedStatus: "SUBMITTED",
        expectedSubmittedAt: "2026-08-01T15:00:00.000Z",
        feedback: "Great work!",
        operationId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(await view.findByText("Feedback enviado com sucesso.")).toBeTruthy();
    expect(await view.findByText("Enviar feedback")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });

  it("requires a second explicit tap before releasing a redo", async () => {
    const getTeacherSubmission = jest.fn(async () => submission());
    const redoTeacherSubmission = jest.fn(async () => ({
      feedback: null,
      message: "Nova tentativa liberada com sucesso.",
      ok: true as const,
      replayed: false,
      reviewedAt: null,
      status: "RETURNED" as const,
      submissionId: "submission-1",
      submittedAt: "2026-08-01T15:00:00.000Z",
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherSubmission,
      redoTeacherSubmission,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherSubmissionDetailScreen
        onBack={jest.fn()}
        submissionId="submission-1"
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(getTeacherSubmission).toHaveBeenCalledTimes(1));
    expect(await view.findByText("Daily conversation")).toBeTruthy();
    await fireEvent.press(
      view.getByRole("button", { name: "Liberar nova tentativa" }),
    );
    expect(redoTeacherSubmission).not.toHaveBeenCalled();
    await fireEvent.press(
      view.getByRole("button", { name: "Confirmar nova tentativa" }),
    );
    await waitFor(() => expect(redoTeacherSubmission).toHaveBeenCalledTimes(1));
    expect(
      await view.findByText("Nova tentativa liberada com sucesso."),
    ).toBeTruthy();
    expect(await view.findByText("Liberar nova tentativa")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
