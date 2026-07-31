import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";

import { CandyXpActivityScreen } from "@/features/candy-xp/candy-xp-activity-screen";
import type { MobileCandyXpActivity } from "@/lib/api/mobile-api-client";

const activity: MobileCandyXpActivity = {
  asset: null,
  canSubmit: true,
  category: "Vocabulary",
  description: "Revise as cores.",
  id: "activity-1",
  interactiveFields: [],
  level: "A1",
  questions: [
    {
      id: "question-1",
      options: [{ text: "Blue" }, { text: "Green" }],
      prompt: "Choose a color",
      required: true,
      sortOrder: 0,
      type: "MULTIPLE_CHOICE",
    },
  ],
  submission: null,
  title: "Candy Colors",
  xpReward: 80,
};

describe("CandyXpActivityScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves a draft and submits an objective Candy XP answer", async () => {
    const getStudentCandyXpActivity = jest.fn(async () => activity);
    const saveCandyXpActivityDraft = jest.fn(async () => ({
      message: "Progresso Candy XP salvo.",
    }));
    const submitCandyXpActivity = jest.fn(async () => ({
      message: "Missao concluida. +80 XP.",
    }));
    const client = {
      getCandyXpAssetSource: jest.fn(),
      getStudentCandyXpActivity,
      saveCandyXpActivityDraft,
      submitCandyXpActivity,
    };
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
    const alert = jest
      .spyOn(Alert, "alert")
      .mockImplementation(() => undefined);
    const view = await render(
      <CandyXpActivityScreen
        activityId="activity-1"
        client={client}
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Candy Colors")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Blue"));
    await fireEvent.press(
      view.getByRole("button", { name: "Salvar rascunho" }),
    );

    await waitFor(() => {
      expect(saveCandyXpActivityDraft).toHaveBeenCalledWith("activity-1", [
        { questionId: "question-1", value: "Blue" },
      ]);
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    });

    await fireEvent.press(view.getByLabelText("Blue"));
    await fireEvent.press(
      view.getByRole("button", { name: "Entregar missao" }),
    );
    const buttons = alert.mock.calls.at(-1)?.[2];
    const confirm = buttons?.find(
      (button) => button.text === "Entregar agora",
    );

    await act(async () => {
      confirm?.onPress?.();
    });

    await waitFor(() => {
      expect(submitCandyXpActivity).toHaveBeenCalledWith("activity-1", [
        { questionId: "question-1", value: "Blue" },
      ]);
      expect(queryClient.isFetching()).toBe(0);
      expect(queryClient.isMutating()).toBe(0);
    });

    await view.unmount();
    queryClient.clear();
  }, 15_000);
});
