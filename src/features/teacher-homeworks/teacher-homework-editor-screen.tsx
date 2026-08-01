import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TeacherHomeworkEditorFields } from "@/features/teacher-homeworks/teacher-homework-editor-fields";
import { styles } from "@/features/teacher-homeworks/teacher-homework-editor-screen.styles";
import {
  buildTeacherHomeworkMutation,
  createEmptyTeacherHomeworkForm,
  teacherHomeworkEditorToForm,
  type TeacherHomeworkFormState,
} from "@/features/teacher-homeworks/teacher-homework-form-utils";
import { TeacherHomeworkQuestionEditor } from "@/features/teacher-homeworks/teacher-homework-question-editor";
import { getMobileApi } from "@/lib/api/mobile-api";
import {
  ApiError,
  type MobileTeacherHomeworkEditor,
  type MobileTeacherHomeworkMutationInput,
  type MobileTeacherHomeworkOptions,
} from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type Props = {
  homeworkId?: string;
  lessonId?: string;
  mode: "create" | "edit";
  onBack: () => void;
  onDeleted: () => void;
  onEditInteractiveFields?: (homeworkId: string) => void;
  onSaved: (homeworkId: string) => void;
};

type LoadedProps = Pick<
  Props,
  | "homeworkId"
  | "lessonId"
  | "mode"
  | "onDeleted"
  | "onEditInteractiveFields"
  | "onSaved"
> & {
  initialHomework?: MobileTeacherHomeworkEditor;
  onReload: () => Promise<MobileTeacherHomeworkEditor | undefined>;
  options: MobileTeacherHomeworkOptions;
};

function mutationMessage(error: Error | null) {
  if (!error) return "";
  if (error instanceof ApiError && error.code === "HOMEWORK_EDIT_CONFLICT") {
    return "A tarefa mudou no site ou em outro aparelho. Recarregue a versão atual antes de continuar.";
  }
  if (
    error instanceof ApiError &&
    error.code === "HOMEWORK_ASSIGNMENTS_LOCKED"
  ) {
    return "Os alunos não podem ser alterados porque já existem entregas.";
  }
  return error.message || "Não foi possível concluir esta ação agora.";
}

function initialForm(
  initialHomework: MobileTeacherHomeworkEditor | undefined,
  options: MobileTeacherHomeworkOptions,
  preferredLessonId: string,
) {
  if (initialHomework) return teacherHomeworkEditorToForm(initialHomework);
  const lesson =
    options.lessons.find(({ id }) => id === preferredLessonId) ??
    options.lessons[0];
  const onlyStudent =
    options.students.length === 1 ? options.students[0] : undefined;
  const students = lesson?.studentProfileId
    ? [lesson.studentProfileId]
    : onlyStudent
      ? [onlyStudent.id]
      : [];
  return createEmptyTeacherHomeworkForm(
    lesson?.id ?? "",
    students,
    () => Crypto.randomUUID(),
  );
}

function LoadedTeacherHomeworkEditor({
  homeworkId = "",
  initialHomework,
  lessonId = "",
  mode,
  onDeleted,
  onEditInteractiveFields,
  onReload,
  onSaved,
  options,
}: LoadedProps) {
  const queryClient = useQueryClient();
  const kind = initialHomework?.kind ?? "TEXT";
  const [form, setForm] = useState<TeacherHomeworkFormState>(() =>
    initialForm(initialHomework, options, lessonId),
  );
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(
    initialHomework?.updatedAt ?? null,
  );
  const [savedFormSnapshot, setSavedFormSnapshot] = useState(() =>
    initialHomework
      ? JSON.stringify(teacherHomeworkEditorToForm(initialHomework))
      : "",
  );
  const [validationError, setValidationError] = useState("");
  const [duplicateStudentIds, setDuplicateStudentIds] = useState<string[]>([]);
  const [actionSuccess, setActionSuccess] = useState("");
  const [deleteArmed, setDeleteArmed] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (input: MobileTeacherHomeworkMutationInput) => {
      if (mode === "edit") {
        if (!homeworkId || !expectedUpdatedAt) {
          throw new Error("A versão desta tarefa ainda não foi carregada.");
        }
        return getMobileApi().updateTeacherHomework(homeworkId, {
          ...input,
          expectedUpdatedAt,
        });
      }
      return getMobileApi().createTeacherHomework(input);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: ["mobile-module", "homeworks"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-lesson", form.lessonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-homework-editor", result.homeworkId],
      });
      if (mode === "edit") {
        setExpectedUpdatedAt(result.updatedAt);
        setSavedFormSnapshot(JSON.stringify(form));
        setOperationId(Crypto.randomUUID());
        setActionSuccess(result.message);
        return;
      }
      onSaved(result.homeworkId);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () =>
      getMobileApi().duplicateTeacherHomework(homeworkId, {
        operationId: Crypto.randomUUID(),
        studentProfileIds: duplicateStudentIds,
      }),
    onSuccess: (result) => {
      setActionSuccess(result.message);
      setDuplicateStudentIds([]);
      void queryClient.invalidateQueries({
        queryKey: ["mobile-module", "homeworks"],
      });
      void queryClient.invalidateQueries({ queryKey: ["mobile-module", "lessons"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!expectedUpdatedAt) throw new Error("Versão da tarefa indisponível.");
      return getMobileApi().deleteTeacherHomework(homeworkId, {
        expectedUpdatedAt,
        operationId: Crypto.randomUUID(),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["mobile-module", "homeworks"],
      });
      void queryClient.invalidateQueries({ queryKey: ["mobile-module", "lessons"] });
      onDeleted();
    },
  });

  function changeForm(next: TeacherHomeworkFormState) {
    setForm(next);
    setValidationError("");
    setActionSuccess("");
    saveMutation.reset();
  }

  function save() {
    const built = buildTeacherHomeworkMutation(form, kind, operationId);
    if (!built.ok) {
      setValidationError(built.message);
      return;
    }
    setValidationError("");
    setActionSuccess("");
    saveMutation.mutate(built.data);
  }

  async function reloadLatestVersion() {
    const refreshed = await onReload();
    if (!refreshed) return;
    setForm(teacherHomeworkEditorToForm(refreshed));
    setSavedFormSnapshot(JSON.stringify(teacherHomeworkEditorToForm(refreshed)));
    setExpectedUpdatedAt(refreshed.updatedAt);
    setOperationId(Crypto.randomUUID());
    setDeleteArmed(false);
    setValidationError("");
    saveMutation.reset();
    deleteMutation.reset();
  }

  function toggleDuplicateStudent(studentId: string) {
    setActionSuccess("");
    duplicateMutation.reset();
    setDuplicateStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  }

  const saveError = mutationMessage(saveMutation.error);
  const isConflict =
    saveMutation.error instanceof ApiError &&
    saveMutation.error.code === "HOMEWORK_EDIT_CONFLICT";
  const actionError =
    mutationMessage(duplicateMutation.error) || mutationMessage(deleteMutation.error);
  const hasUnsavedMetadata =
    mode === "edit" && JSON.stringify(form) !== savedFormSnapshot;

  return (
    <>
      <TeacherHomeworkEditorFields
        assignmentsLocked={initialHomework?.hasSubmissions ?? false}
        form={form}
        onChange={changeForm}
        options={options}
      />

      {kind === "TEXT" ? (
        <TeacherHomeworkQuestionEditor
          createId={() => Crypto.randomUUID()}
          onChange={(questions) => changeForm({ ...form, questions })}
          questions={form.questions}
        />
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Homework interativa protegida</Text>
          <Text style={styles.infoText}>
            {initialHomework?.assetFileName ?? "Arquivo interativo"} · {initialHomework?.interactiveFieldCount ?? 0} área(s). O app edita os dados, alunos e prazo sem alterar o arquivo ou as áreas.
          </Text>
          {mode === "edit" && onEditInteractiveFields ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={hasUnsavedMetadata}
                onPress={() => onEditInteractiveFields(homeworkId)}
                style={[
                  styles.secondary,
                  hasUnsavedMetadata ? styles.submitDisabled : null,
                ]}
              >
                <Text style={styles.secondaryText}>Editar campos interativos</Text>
              </Pressable>
              {hasUnsavedMetadata ? (
                <Text style={styles.infoText}>
                  Salve as alterações desta tarefa antes de abrir os campos.
                </Text>
              ) : null}
            </>
          ) : null}
        </View>
      )}

      {validationError || saveError ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={styles.errorTitle}>Revise antes de salvar</Text>
          <Text style={styles.errorText}>{validationError || saveError}</Text>
          {isConflict ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void reloadLatestVersion()}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Recarregar versão atual</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={saveMutation.isPending}
        onPress={save}
        style={({ pressed }) => [
          styles.submit,
          saveMutation.isPending ? styles.submitDisabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.submitText}>
          {saveMutation.isPending
            ? "Salvando..."
            : mode === "create"
              ? "Criar tarefa"
              : "Salvar alterações"}
        </Text>
      </Pressable>

      {mode === "edit" ? (
        <>
          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Duplicar para outros alunos
            </Text>
            <Text style={styles.sectionDescription}>
              A cópia mantém perguntas, arquivo interativo, prazo e situação.
            </Text>
            <View style={styles.choices}>
              {options.students
                .filter((student) => !form.studentProfileIds.includes(student.id))
                .map((student) => {
                const selected = duplicateStudentIds.includes(student.id);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={student.id}
                    onPress={() => toggleDuplicateStudent(student.id)}
                    style={[styles.choice, selected ? styles.choiceSelected : null]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selected ? styles.choiceTextSelected : null,
                      ]}
                    >
                      {selected ? "✓ " : ""}{student.name}
                    </Text>
                  </Pressable>
                );
                })}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={duplicateStudentIds.length === 0 || duplicateMutation.isPending}
              onPress={() => duplicateMutation.mutate()}
              style={[
                styles.secondary,
                duplicateStudentIds.length === 0 || duplicateMutation.isPending
                  ? styles.submitDisabled
                  : null,
              ]}
            >
              <Text style={styles.secondaryText}>
                {duplicateMutation.isPending ? "Duplicando..." : "Duplicar tarefa"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              Excluir tarefa
            </Text>
            <Text style={styles.sectionDescription}>
              A exclusão também remove entregas e feedbacks vinculados. Esta ação não pode ser desfeita.
            </Text>
            {!deleteArmed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setDeleteArmed(true)}
                style={styles.danger}
              >
                <Text style={styles.dangerText}>Quero excluir</Text>
              </Pressable>
            ) : (
              <View style={styles.buttonRow}>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleteMutation.isPending}
                  onPress={() => deleteMutation.mutate()}
                  style={[styles.danger, styles.dangerConfirm]}
                >
                  <Text style={styles.dangerConfirmText}>
                    {deleteMutation.isPending ? "Excluindo..." : "Confirmar exclusão"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDeleteArmed(false)}
                  style={styles.secondary}
                >
                  <Text style={styles.secondaryText}>Cancelar</Text>
                </Pressable>
              </View>
            )}
          </View>
        </>
      ) : null}

      {actionSuccess ? (
        <View accessibilityRole="alert" style={styles.successCard}>
          <Text style={styles.successText}>{actionSuccess}</Text>
        </View>
      ) : null}
      {actionError ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={styles.errorTitle}>Ação não concluída</Text>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}
    </>
  );
}

export function TeacherHomeworkEditorScreen({
  homeworkId = "",
  lessonId = "",
  mode,
  onBack,
  onDeleted,
  onEditInteractiveFields,
  onSaved,
}: Props) {
  const optionsQuery = useQuery({
    queryFn: () => getMobileApi().getTeacherHomeworkOptions(),
    queryKey: ["teacher-homework-options"],
  });
  const editorQuery = useQuery({
    enabled: mode === "edit" && homeworkId.length > 0,
    queryFn: () => getMobileApi().getTeacherHomeworkEditor(homeworkId),
    queryKey: ["teacher-homework-editor", homeworkId],
  });
  const isLoading =
    optionsQuery.isPending || (mode === "edit" && editorQuery.isPending);
  const hasLoadError =
    optionsQuery.isError || (mode === "edit" && editorQuery.isError);

  async function reloadEditor() {
    if (mode !== "edit") return undefined;
    return (await editorQuery.refetch()).data;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            accessibilityLabel="Voltar para tarefas"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Tarefas</Text>
          </Pressable>
          <Text style={styles.eyebrow}>HOMEWORK SINCRONIZADA</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {mode === "create" ? "Nova tarefa" : "Editar tarefa"}
          </Text>
          <Text style={styles.description}>
            Tudo o que for salvo aqui aparece no mesmo banco usado pelo site Candy English.
          </Text>

          {isLoading ? (
            <ActivityIndicator
              accessibilityLabel="Carregando editor da tarefa"
              color={colors.brand}
              size="large"
              style={styles.loading}
            />
          ) : null}
          {hasLoadError ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <Text style={styles.errorTitle}>Editor indisponível</Text>
              <Text style={styles.errorText}>
                Verifique sua conexão e tente novamente.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void optionsQuery.refetch();
                  if (mode === "edit") void editorQuery.refetch();
                }}
                style={styles.retry}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading &&
          !hasLoadError &&
          optionsQuery.data &&
          (mode === "create" || editorQuery.data) ? (
            <LoadedTeacherHomeworkEditor
              homeworkId={homeworkId}
              initialHomework={editorQuery.data}
              lessonId={lessonId}
              mode={mode}
              onDeleted={onDeleted}
              onEditInteractiveFields={onEditInteractiveFields}
              onReload={reloadEditor}
              onSaved={onSaved}
              options={optionsQuery.data}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
