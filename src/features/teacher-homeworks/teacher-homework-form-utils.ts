import {
  formatDateTimeInput,
  parseDateTimeInput,
} from "@/features/teacher-lessons/teacher-lesson-form-utils";
import type {
  MobileTeacherHomeworkEditor,
  MobileTeacherHomeworkMutationInput,
} from "@/lib/api/mobile-api-client";

export type TeacherHomeworkQuestionDraft = {
  expectedAnswer: string;
  id: string;
  prompt: string;
};

export type TeacherHomeworkFormState = {
  dueDate: string;
  instructions: string;
  lessonId: string;
  questions: TeacherHomeworkQuestionDraft[];
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED";
  studentProfileIds: string[];
  title: string;
};

export function createEmptyTeacherHomeworkForm(
  lessonId = "",
  studentProfileIds: string[] = [],
  createId: () => string = () => "question-new",
): TeacherHomeworkFormState {
  return {
    dueDate: "",
    instructions: "",
    lessonId,
    questions: [{ expectedAnswer: "", id: createId(), prompt: "" }],
    status: "DRAFT",
    studentProfileIds,
    title: "",
  };
}

export function teacherHomeworkEditorToForm(
  homework: MobileTeacherHomeworkEditor,
): TeacherHomeworkFormState {
  return {
    dueDate: formatDateTimeInput(homework.dueDate),
    instructions: homework.instructions ?? "",
    lessonId: homework.lessonId,
    questions: homework.questions.map((question) => ({
      expectedAnswer: question.expectedAnswer ?? "",
      id: question.id,
      prompt: question.prompt,
    })),
    status: homework.status,
    studentProfileIds: homework.studentProfileIds,
    title: homework.title,
  };
}

export function buildTeacherHomeworkMutation(
  form: TeacherHomeworkFormState,
  kind: "INTERACTIVE" | "TEXT",
  operationId: string,
):
  | { data: MobileTeacherHomeworkMutationInput; ok: true }
  | { message: string; ok: false } {
  const title = form.title.trim();
  const instructions = form.instructions.trim();
  const lessonId = form.lessonId.trim();
  const dueDate = parseDateTimeInput(form.dueDate);
  const studentProfileIds = [...new Set(form.studentProfileIds)];

  if (title.length < 3 || title.length > 160) {
    return { message: "Use um título entre 3 e 160 caracteres.", ok: false };
  }
  if (instructions.length > 2000) {
    return {
      message: "As instruções podem ter no máximo 2000 caracteres.",
      ok: false,
    };
  }
  if (!lessonId) {
    return { message: "Selecione a aula desta tarefa.", ok: false };
  }
  if (dueDate === null) {
    return {
      message: "Use o prazo no formato DD/MM/AAAA HH:mm.",
      ok: false,
    };
  }
  if (
    studentProfileIds.length === 0 ||
    studentProfileIds.length > 50 ||
    studentProfileIds.some((id) => !id || id.length > 80)
  ) {
    return { message: "Selecione de 1 a 50 alunos.", ok: false };
  }

  const questions = form.questions.map((question) => ({
    expectedAnswer: question.expectedAnswer.trim() || null,
    prompt: question.prompt.trim(),
  }));
  if (kind === "TEXT") {
    if (questions.length === 0 || questions.length > 50) {
      return { message: "Adicione de 1 a 50 perguntas.", ok: false };
    }
    if (questions.some((question) => question.prompt.length < 3)) {
      return {
        message: "Cada pergunta precisa ter pelo menos 3 caracteres.",
        ok: false,
      };
    }
    if (
      questions.some(
        (question) =>
          question.prompt.length > 1000 ||
          (question.expectedAnswer?.length ?? 0) > 1000,
      )
    ) {
      return {
        message: "Perguntas e respostas podem ter no máximo 1000 caracteres.",
        ok: false,
      };
    }
  }

  return {
    data: {
      dueDate: dueDate || null,
      instructions: instructions || null,
      lessonId,
      operationId,
      questions: kind === "TEXT" ? questions : [],
      status: form.status,
      studentProfileIds,
      title,
    },
    ok: true,
  };
}
