import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";

import { TeacherCattyScreen } from "@/features/catty/teacher-catty-screen";
import type { MobileTeacherCattyManagement } from "@/lib/api/mobile-api-client";

const management: MobileTeacherCattyManagement = {
  approvedLearningCount: 12,
  artifacts: [
    {
      catchphrases: ["Level up!"],
      emojis: ["🎮"],
      example: "Gaming vocabulary",
      id: "artifact-1",
      isPrimary: true,
      label: "Games",
      sounds: ["pop"],
      status: "ACTIVE",
      studentId: "student-1",
      themeId: "games",
      toneRule: "Keep it light.",
      updatedAt: "2026-08-01T12:00:00.000Z",
    },
  ],
  learningCategories: ["VOCABULARY", "TEACHER_GUIDANCE"],
  learningItems: [
    {
      badReply: null,
      category: "VOCABULARY",
      createdAt: "2026-08-01T12:00:00.000Z",
      id: "learning-1",
      idealReply: null,
      intent: null,
      notes: "Explain with one short example.",
      status: "PENDING",
      tags: ["vocabulary"],
      title: "New word",
      updatedAt: "2026-08-01T12:00:00.000Z",
      userPrompt: "What does brave mean?",
    },
  ],
  students: [{ id: "student-1", name: "Ana" }],
  themeOptions: [
    {
      catchphrases: ["Level up!"],
      emojis: ["🎮"],
      id: "games",
      label: "Games",
      sounds: ["pop"],
    },
  ],
};

describe("TeacherCattyScreen", () => {
  it("submits reviewed learning and artifacts only for a linked student", async () => {
    const getTeacherCattyManagement = jest.fn(async () => management);
    const createTeacherCattyLearning = jest.fn(async () => ({
      message: "Sugestao enviada.",
      ok: true as const,
    }));
    const saveTeacherCattyArtifact = jest.fn(async () => ({
      message: "Artefato salvo.",
      ok: true as const,
    }));
    const updateTeacherCattyArtifactStatus = jest.fn(async () => ({
      message: "Status alterado.",
      ok: true as const,
    }));
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

    const view = await render(
      <TeacherCattyScreen
        client={{
          createTeacherCattyLearning,
          getTeacherCattyManagement,
          saveTeacherCattyArtifact,
          updateTeacherCattyArtifactStatus,
        }}
        onBack={jest.fn()}
      />,
      { wrapper: Wrapper },
    );

    expect(await view.findByText("Catty Learning")).toBeTruthy();
    expect(await view.findByText("Aguardando admin")).toBeTruthy();
    expect(await view.findByText("12")).toBeTruthy();
    expect(view.queryByText("ana@candy.example")).toBeNull();

    await fireEvent.changeText(
      view.getByLabelText("Titulo do aprendizado"),
      "Explain brave",
    );
    await fireEvent.changeText(
      view.getByLabelText("Conteudo do aprendizado"),
      "Use one short example and invite the student to practice.",
    );
    await fireEvent.press(
      view.getByLabelText("Enviar aprendizado para aprovacao"),
    );
    await waitFor(() => {
      expect(createTeacherCattyLearning).toHaveBeenCalledWith({
        category: "VOCABULARY",
        notes: "Use one short example and invite the student to practice.",
        title: "Explain brave",
        userPrompt: undefined,
      });
    });

    await fireEvent.press(view.getByLabelText("Ver artefatos dos alunos"));
    expect(await view.findByText("Personalizar para um aluno")).toBeTruthy();
    await fireEvent.press(view.getByLabelText("Salvar artefato da Catty"));
    await waitFor(() => {
      expect(saveTeacherCattyArtifact).toHaveBeenCalledWith(
        expect.objectContaining({
          label: "Games",
          status: "ACTIVE",
          targetUserId: "student-1",
          themeId: "games",
        }),
      );
    });
    await view.unmount();
  });
});
