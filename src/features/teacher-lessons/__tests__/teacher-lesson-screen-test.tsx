import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherLessonScreen } from "@/features/teacher-lessons/teacher-lesson-screen";
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

describe("TeacherLessonScreen", () => {
  it("shows the teacher's own lesson, materials and planning status", async () => {
    const getTeacherLesson = jest.fn(async () => ({
      description: "Practice a friendly introduction.",
      homeworks: [
        {
          dueDate: "2026-08-05T12:00:00.000Z",
          id: "homework-1",
          status: "DRAFT" as const,
          title: "Speaking prompts",
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
      ],
      scheduledAt: "2026-08-01T12:00:00.000Z",
      status: "DRAFT" as const,
      studentName: "Candy Student",
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
      getTeacherLesson,
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherLessonScreen lessonId="lesson-1" onBack={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Introductions")).toBeTruthy();
    expect(view.getByText("RASCUNHO")).toBeTruthy();
    expect(view.getByText("Aluno: Candy Student")).toBeTruthy();
    expect(view.getByText("Practice guide")).toBeTruthy();
    expect(view.getByText("Speaking prompts")).toBeTruthy();
    expect(view.getByText("meet")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });

  it("shows an empty general audience without exposing another student", async () => {
    jest.mocked(getMobileApi).mockReturnValue({
      getTeacherLesson: jest.fn(async () => ({
        description: null,
        homeworks: [],
        id: "lesson-general",
        materials: [],
        scheduledAt: null,
        status: "PUBLISHED" as const,
        studentName: null,
        teacherName: "Candy Teacher",
        title: "General lesson",
        vocabularyItems: [],
      })),
    } as unknown as ReturnType<typeof getMobileApi>);
    const { queryClient, Wrapper } = createWrapper();
    const view = await render(
      <TeacherLessonScreen lessonId="lesson-general" onBack={jest.fn()} />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Turma geral")).toBeTruthy();

    await view.unmount();
    queryClient.clear();
  });
});
