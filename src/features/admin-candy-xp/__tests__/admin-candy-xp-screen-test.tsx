import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { AdminCandyXpScreen } from "@/features/admin-candy-xp/admin-candy-xp-screen";
import type { MobileAdminCandyXp } from "@/lib/api/admin-candy-xp-contracts";

const catalog: MobileAdminCandyXp = {
  activities: [
    {
      asset: null,
      category: "Conversation",
      createdAt: "2026-08-02T10:00:00.000Z",
      description: "Practice greetings.",
      id: "activity/1",
      level: "A1",
      publishedAt: "2026-08-02T10:00:00.000Z",
      release: { mode: "ALL", students: [] },
      status: "PUBLISHED",
      submissionCount: 1,
      title: "Greetings",
      updatedAt: "2026-08-02T11:00:00.000Z",
      xpReward: 50,
    },
  ],
  generatedAt: "2026-08-02T12:00:00.000Z",
  hasMore: false,
  nextCursor: null,
  ranking: {
    generatedAt: "2026-08-02T12:00:00.000Z",
    topEntries: [
      { level: 3, name: "Ana Candy", position: 1, role: "STUDENT", totalXp: 500 },
    ],
    totalRanked: 1,
  },
  summary: { archived: 0, draft: 0, pendingReviews: 1, published: 1, total: 1 },
};

it("shows safe Candy XP indicators and opens an administrative activity", async () => {
  const onOpenActivity = jest.fn();
  const client = { getAdminCandyXp: jest.fn(async () => catalog) };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <AdminCandyXpScreen
        client={client}
        onBack={jest.fn()}
        onOpenActivity={onOpenActivity}
      />
    </QueryClientProvider>,
  );

  expect(await view.findByText("Greetings")).toBeTruthy();
  expect(view.getByText("Correções pendentes")).toBeTruthy();
  expect(view.getByText("Ana Candy · Nível 3")).toBeTruthy();
  await fireEvent.press(view.getByLabelText("Abrir atividade Greetings"));
  expect(onOpenActivity).toHaveBeenCalledWith("activity/1");
  await waitFor(() => expect(client.getAdminCandyXp).toHaveBeenCalledWith({
    cursor: undefined,
    limit: 20,
    query: undefined,
    status: "ALL",
  }));
  await view.unmount();
});
