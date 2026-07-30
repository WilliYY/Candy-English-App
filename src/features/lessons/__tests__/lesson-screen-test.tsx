import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { Linking } from "react-native";

import { LessonScreen } from "@/features/lessons/lesson-screen";
import { getMobileApi } from "@/lib/api/mobile-api";

jest.mock("@/lib/api/mobile-api", () => ({
  getMobileApi: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
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

describe("LessonScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows protected materials and opens lesson homework", async () => {
    const getLesson = jest.fn(async () => ({
      description: "Practice a friendly introduction.",
      homeworks: [
        {
          dueDate: "2026-08-05T12:00:00.000Z",
          id: "homework-1",
          submissionStatus: null,
          title: "Introduce yourself",
        },
      ],
      id: "lesson-1",
      materials: [
        {
          content: "Repeat each expression twice.",
          id: "material-text",
          title: "Practice guide",
          type: "TEXT" as const,
          url: null,
        },
        {
          content: null,
          id: "material-link",
          title: "Pronunciation video",
          type: "LINK" as const,
          url: "https://example.com/pronunciation",
        },
      ],
      scheduledAt: "2026-08-01T12:00:00.000Z",
      teacherName: "Candy Teacher",
      title: "Introductions",
      vocabularyItems: [
        {
          example: "Nice to meet you.",
          id: "word-1",
          term: "meet",
          translation: "conhecer",
        },
      ],
    }));
    jest.mocked(getMobileApi).mockReturnValue({
      getLesson,
    } as unknown as ReturnType<typeof getMobileApi>);
    const canOpenUrl = jest
      .spyOn(Linking, "canOpenURL")
      .mockResolvedValue(true);
    const openUrl = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValue(undefined);
    const onOpenHomework = jest.fn();
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <LessonScreen
        lessonId="lesson-1"
        onBack={jest.fn()}
        onOpenHomework={onOpenHomework}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Introductions")).toBeTruthy();
    expect(view.getByText("Repeat each expression twice.")).toBeTruthy();
    expect(view.getByText("meet")).toBeTruthy();

    await fireEvent.press(
      view.getByRole("link", { name: "Abrir material externo ↗" }),
    );

    await waitFor(() => {
      expect(canOpenUrl).toHaveBeenCalledWith(
        "https://example.com/pronunciation",
      );
      expect(openUrl).toHaveBeenCalledWith(
        "https://example.com/pronunciation",
      );
    });

    await fireEvent.press(
      view.getByRole("button", {
        name: "Abrir homework Introduce yourself",
      }),
    );
    expect(onOpenHomework).toHaveBeenCalledWith("homework-1");

    await view.unmount();
    queryClient.clear();
  });
});
