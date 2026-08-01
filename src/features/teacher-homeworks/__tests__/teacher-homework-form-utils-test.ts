import {
  buildTeacherHomeworkMutation,
  createEmptyTeacherHomeworkForm,
} from "@/features/teacher-homeworks/teacher-homework-form-utils";

describe("teacher homework form utils", () => {
  it("builds a strict native text-homework mutation", () => {
    const form = createEmptyTeacherHomeworkForm(
      "lesson-1",
      ["student-1"],
      () => "question-1",
    );
    form.title = "Daily conversation";
    form.instructions = " Answer in English. ";
    form.dueDate = "10/08/2026 18:00";
    form.questions[0] = {
      expectedAnswer: " I am fine. ",
      id: "question-1",
      prompt: " How are you? ",
    };

    const result = buildTeacherHomeworkMutation(
      form,
      "TEXT",
      "11111111-1111-4111-8111-111111111111",
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({
        instructions: "Answer in English.",
        lessonId: "lesson-1",
        questions: [
          { expectedAnswer: "I am fine.", prompt: "How are you?" },
        ],
        studentProfileIds: ["student-1"],
        title: "Daily conversation",
      });
      expect(result.data.dueDate).toBe(new Date(2026, 7, 10, 18).toISOString());
    }
  });

  it("rejects impossible dates and incomplete text questions", () => {
    const form = createEmptyTeacherHomeworkForm(
      "lesson-1",
      ["student-1"],
    );
    form.title = "Daily conversation";
    form.dueDate = "31/02/2026 18:00";

    expect(
      buildTeacherHomeworkMutation(form, "TEXT", crypto.randomUUID()),
    ).toEqual({
      message: "Use o prazo no formato DD/MM/AAAA HH:mm.",
      ok: false,
    });

    form.dueDate = "";
    expect(
      buildTeacherHomeworkMutation(form, "TEXT", crypto.randomUUID()),
    ).toEqual({
      message: "Cada pergunta precisa ter pelo menos 3 caracteres.",
      ok: false,
    });
  });
});
