import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherCandyXpScreen } from "@/features/candy-xp/teacher-candy-xp-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("@/lib/api/mobile-api", () => ({ getMobileApi: jest.fn() }));

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

test("shows only the authenticated teacher Candy XP journey", async () => {
  const getTeacherCandyXp = jest.fn(async () => ({
    nextGoals: ["Corrigir uma submissão pendente."],
    profile: {
      badgeCount: 1,
      level: 2,
      longestStreakDays: 2,
      progressPercent: 34,
      progressXp: 60,
      requiredXp: 175,
      streakDays: 2,
      totalXp: 180,
      xpToNextLevel: 115,
    },
    ranking: {
      currentUser: {
        hasXp: true,
        position: 1,
        totalInCategory: 2,
        totalXp: 180,
        xpToNextLevel: 115,
      },
      generatedAt: "2026-08-01T21:00:00.000Z",
      topEntries: [
        {
          isCurrentUser: true,
          level: 2,
          name: "Candy Teacher",
          position: 1,
          progressPercent: 34,
          totalXp: 180,
          xpToNextLevel: 115,
        },
      ],
      totalRanked: 2,
    },
    recentEvents: [
      {
        occurredAt: "2026-08-01T20:00:00.000Z",
        sourceLabel: "Feedbacks dados",
        xp: 35,
      },
    ],
    sources: [
      { label: "Aulas criadas", value: 1, xp: 30 },
      { label: "Feedbacks dados", value: 1, xp: 35 },
    ],
    spotlightCard: {
      description: "Corrigir respostas pendentes gera XP.",
      status: "1 pendente(s)",
      title: "Missões teacher",
      unlocked: false,
    },
  }));
  jest.mocked(getMobileApi).mockReturnValue({
    getTeacherCandyXp,
  } as unknown as ReturnType<typeof getMobileApi>);

  const view = await render(<TeacherCandyXpScreen onBack={jest.fn()} />, {
    wrapper: Wrapper,
  });

  expect(await view.findByText("Candy XP Teacher")).toBeTruthy();
  expect(view.getAllByText("180 XP").length).toBeGreaterThanOrEqual(1);
  expect(view.getByText("Missões teacher")).toBeTruthy();
  expect(view.getByText("Aulas criadas · 1")).toBeTruthy();
  expect(view.getByText("Candy Teacher · você")).toBeTruthy();
  expect(view.queryByText("Missões disponíveis")).toBeNull();
  expect(getTeacherCandyXp).toHaveBeenCalledTimes(1);
});
