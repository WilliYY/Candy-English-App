import type {
  MobileTeacherLessonEditor,
  MobileTeacherLessonMutationInput,
} from "@/lib/api/mobile-api-client";

export type TeacherLessonMaterialDraft = {
  content: string;
  key: string;
  title: string;
  type: "LINK" | "TEXT";
  url: string;
};

export type TeacherLessonVocabularyDraft = {
  example: string;
  key: string;
  term: string;
  translation: string;
};

export type TeacherLessonFormState = {
  description: string;
  materials: TeacherLessonMaterialDraft[];
  scheduledAt: string;
  status: "ARCHIVED" | "DRAFT" | "PUBLISHED";
  studentProfileId: string | null;
  title: string;
  vocabularyItems: TeacherLessonVocabularyDraft[];
};

export function createEmptyTeacherLessonForm(): TeacherLessonFormState {
  return {
    description: "",
    materials: [],
    scheduledAt: "",
    status: "DRAFT",
    studentProfileId: null,
    title: "",
    vocabularyItems: [],
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDateTimeInput(value: string): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(
    normalized,
  );

  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearValue, hourValue, minuteValue] =
    match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date.toISOString();
}

function isSafeLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function teacherLessonEditorToForm(
  lesson: MobileTeacherLessonEditor,
  createKey: () => string,
): TeacherLessonFormState {
  return {
    description: lesson.description ?? "",
    materials: lesson.materials.map((material) => ({
      content: material.content ?? "",
      key: createKey(),
      title: material.title,
      type: material.type,
      url: material.url ?? "",
    })),
    scheduledAt: formatDateTimeInput(lesson.scheduledAt),
    status: lesson.status,
    studentProfileId: lesson.studentProfileId,
    title: lesson.title,
    vocabularyItems: lesson.vocabularyItems.map((item) => ({
      example: item.example ?? "",
      key: createKey(),
      term: item.term,
      translation: item.translation,
    })),
  };
}

type BuildResult =
  | { data: MobileTeacherLessonMutationInput; ok: true }
  | { message: string; ok: false };

export function buildTeacherLessonMutation(
  form: TeacherLessonFormState,
  operationId: string,
): BuildResult {
  const title = form.title.trim();

  if (title.length < 3 || title.length > 160) {
    return {
      message: "Informe um título entre 3 e 160 caracteres.",
      ok: false,
    };
  }

  const scheduledAt = parseDateTimeInput(form.scheduledAt);

  if (scheduledAt === null) {
    return {
      message: "Use a data no formato DD/MM/AAAA HH:mm.",
      ok: false,
    };
  }

  const materials: MobileTeacherLessonMutationInput["materials"] = [];

  for (const [index, material] of form.materials.entries()) {
    const materialTitle = material.title.trim();

    if (!materialTitle) {
      return {
        message: `Informe o título do material ${index + 1}.`,
        ok: false,
      };
    }

    if (material.type === "TEXT" && !material.content.trim()) {
      return {
        message: `Informe o conteúdo do material ${index + 1}.`,
        ok: false,
      };
    }

    if (material.type === "LINK" && !isSafeLink(material.url.trim())) {
      return {
        message: `Use um link HTTPS seguro no material ${index + 1}.`,
        ok: false,
      };
    }

    materials.push({
      content: material.content.trim() || null,
      title: materialTitle,
      type: material.type,
      url: material.type === "LINK" ? material.url.trim() : null,
    });
  }

  const vocabularyItems: MobileTeacherLessonMutationInput["vocabularyItems"] =
    [];

  for (const [index, item] of form.vocabularyItems.entries()) {
    const term = item.term.trim();
    const translation = item.translation.trim();

    if (!term || !translation) {
      return {
        message: `Preencha o termo e a tradução do vocabulário ${index + 1}.`,
        ok: false,
      };
    }

    vocabularyItems.push({
      example: item.example.trim() || null,
      term,
      translation,
    });
  }

  return {
    data: {
      description: form.description.trim() || null,
      materials,
      operationId,
      scheduledAt: scheduledAt || null,
      status: form.status,
      studentProfileId: form.studentProfileId,
      title,
      vocabularyItems,
    },
    ok: true,
  };
}
