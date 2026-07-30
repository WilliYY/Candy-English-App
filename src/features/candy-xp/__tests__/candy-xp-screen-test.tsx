import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react-native";

import { CandyXpScreen } from "@/features/candy-xp/candy-xp-screen";
import type { MobileStudentCandyXp } from "@/lib/api/mobile-api-client";

const candyXp: MobileStudentCandyXp = {
  activities: [
    {
      assetKind: "PDF",
      assetPageCount: 2,
      category: "Vocabulary",
      description: "Revise as cores.",
      id: "activity-1",
      interactiveFieldCount: 3,
      level: "A1",
      questionCount: 0,
      submission: null,
      title: "Candy Colors",
      xpReward: 80,
    },
  ],
  profile: {
    badgeCount: 2,
    level: 3,
    longestStreakDays: 5,
    progressPercent: 60,
    progressXp: 60,
    requiredXp: 100,
    streakDays: 3,
    totalXp: 500,
    xpToNextLevel: 40,
  },
  ranking: {
    currentUser: {
      hasXp: true,
      position: 2,
      totalInCategory: 10,
      totalXp: 500,
      xpToNextLevel: 40,
    },
    generatedAt: "2026-07-30T15:00:00.000Z",
    topEntries: [
      {
        isCurrentUser: true,
        level: 3,
        name: "Candy Student",
        position: 2,
        progressPercent: 60,
        totalXp: 500,
        xpToNextLevel: 40,
      },
    ],
    totalRanked: 10,
  },
  recentEvents: [
    {
      occurredAt: "2026-07-30T14:00:00.000Z",
      sourceLabel: "Homework enviado",
      xp: 150,
    },
  ],
  sources: [
    {
      label: "Homework enviado",
      value: 1,
      xp: 150,
    },
  ],
};

describe("CandyXpScreen", () => {
  it("shows student progress, activities and the private ranking", async () => {
    const client = {
      getStudentCandyXp: jest.fn(async () => candyXp),
    };
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const view = await render(
      <QueryClientProvider client={queryClient}>
        <CandyXpScreen client={client} onBack={jest.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(view.getByText("NÍVEL 3")).toBeTruthy();
      expect(view.getByText("Candy Colors")).toBeTruthy();
      expect(view.getByText("Candy Student · você")).toBeTruthy();
      expect(view.getByText("Homework enviado · 1")).toBeTruthy();
    });
    expect(client.getStudentCandyXp).toHaveBeenCalledTimes(1);
    expect(view.getByLabelText("Progresso do nível: 60%")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
