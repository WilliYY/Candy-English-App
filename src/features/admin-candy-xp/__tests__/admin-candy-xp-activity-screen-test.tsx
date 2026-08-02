import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";

import { AdminCandyXpActivityScreen } from "@/features/admin-candy-xp/admin-candy-xp-activity-screen";
import type { MobileAdminCandyXpDetail } from "@/lib/api/admin-candy-xp-contracts";

const detail: MobileAdminCandyXpDetail = {
  activity: {
    asset: null,
    category: "Conversation",
    createdAt: "2026-08-02T10:00:00.000Z",
    description: "Practice greetings.",
    id: "activity/1",
    interactiveFields: [],
    level: "A1",
    publishedAt: "2026-08-02T10:00:00.000Z",
    questions: [
      {
        correctAnswer: "Hello!",
        id: "question/1",
        options: [],
        prompt: "Say hello",
        required: true,
        sortOrder: 0,
        type: "SHORT_TEXT",
      },
    ],
    release: { mode: "ALL", students: [] },
    status: "PUBLISHED",
    submissionCount: 1,
    submissions: [
      {
        answers: [{ questionId: "question/1", value: "Hi!" }],
        autoScorePercent: 50,
        awardedXp: null,
        feedback: null,
        id: "submission/1",
        reviewedAt: null,
        reviewedByName: null,
        status: "SUBMITTED",
        studentName: "Ana Candy",
        submittedAt: "2026-08-02T10:30:00.000Z",
        updatedAt: "2026-08-02T10:30:00.000Z",
      },
    ],
    title: "Greetings",
    updatedAt: "2026-08-02T11:00:00.000Z",
    xpReward: 50,
  },
  students: [{ id: "student/1", name: "Ana Candy" }],
};

it("confirms activity edits and awards Candy XP through idempotent operations", async () => {
  const updateAdminCandyXpActivity = jest.fn(async () => ({
    activity: { ...detail.activity, title: "Greetings updated" },
    message: "Atividade Candy XP atualizada.",
    replayed: false,
  }));
  const reviewAdminCandyXpSubmission = jest.fn(async () => ({
    message: "Correcao Candy XP confirmada.",
    replayed: false,
    submission: { ...detail.activity.submissions[0]!, awardedXp: 50, status: "REVIEWED" as const },
  }));
  const client = {
    getAdminCandyXpActivity: jest.fn(async () => detail),
    reviewAdminCandyXpSubmission,
    updateAdminCandyXpActivity,
  };
  const operationIds = [
    "77777777-7777-4777-8777-777777777777",
    "88888888-8888-4888-8888-888888888888",
  ];
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
    buttons?.find((button) => button.text === "Confirmar")?.onPress?.();
  });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <AdminCandyXpActivityScreen
        activityId="activity/1"
        client={client}
        createOperationId={() => operationIds.shift()!}
        onBack={jest.fn()}
      />
    </QueryClientProvider>,
  );

  expect(await view.findByDisplayValue("Greetings")).toBeTruthy();
  expect(view.getByText("Hello!")).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText("Título da atividade"), "Greetings updated");
  await fireEvent.press(view.getByText("Revisar e salvar"));
  await waitFor(() => expect(updateAdminCandyXpActivity).toHaveBeenCalledWith(
    "activity/1",
    expect.objectContaining({
      confirmChange: true,
      expectedUpdatedAt: detail.activity.updatedAt,
      operationId: "77777777-7777-4777-8777-777777777777",
      title: "Greetings updated",
    }),
  ));

  await fireEvent.changeText(view.getByLabelText("Feedback para Ana Candy"), "Great work!");
  await fireEvent.press(view.getByLabelText("Aprovar entrega de Ana Candy"));
  await waitFor(() => expect(reviewAdminCandyXpSubmission).toHaveBeenCalledWith(
    "submission/1",
    expect.objectContaining({
      confirmReview: true,
      expectedUpdatedAt: detail.activity.submissions[0]!.updatedAt,
      feedback: "Great work!",
      operationId: "88888888-8888-4888-8888-888888888888",
      outcome: "APPROVE",
    }),
  ));
  await view.unmount();
  alert.mockRestore();
});
