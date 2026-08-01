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

import { TeacherLessonEditorFields } from "@/features/teacher-lessons/teacher-lesson-editor-fields";
import { styles } from "@/features/teacher-lessons/teacher-lesson-editor-screen.styles";
import {
  buildTeacherLessonMutation,
  createEmptyTeacherLessonForm,
  teacherLessonEditorToForm,
  type TeacherLessonFormState,
} from "@/features/teacher-lessons/teacher-lesson-form-utils";
import { TeacherLessonMaterialEditor } from "@/features/teacher-lessons/teacher-lesson-material-editor";
import { TeacherLessonVocabularyEditor } from "@/features/teacher-lessons/teacher-lesson-vocabulary-editor";
import { getMobileApi } from "@/lib/api/mobile-api";
import {
  ApiError,
  type MobileTeacherLessonEditor,
  type MobileTeacherLessonMutationInput,
  type MobileTeacherLessonOptions,
} from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type TeacherLessonEditorScreenProps = {
  lessonId?: string;
  mode: "create" | "edit";
  onBack: () => void;
  onSaved: (lessonId: string) => void;
};

type LoadedEditorProps = Pick<
  TeacherLessonEditorScreenProps,
  "lessonId" | "mode" | "onSaved"
> & {
  initialLesson?: MobileTeacherLessonEditor;
  onReload: () => Promise<MobileTeacherLessonEditor | undefined>;
  options: MobileTeacherLessonOptions;
};

function saveErrorMessage(error: Error | null) {
  if (!error) {
    return "";
  }

  if (error instanceof ApiError && error.code === "LESSON_EDIT_CONFLICT") {
    return "A aula mudou no site ou em outro aparelho. Recarregue a versão atual antes de salvar.";
  }

  return error.message || "Não foi possível salvar esta aula agora.";
}

function LoadedTeacherLessonEditor({
  initialLesson,
  lessonId = "",
  mode,
  onReload,
  onSaved,
  options,
}: LoadedEditorProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TeacherLessonFormState>(() =>
    initialLesson
      ? teacherLessonEditorToForm(initialLesson, () => Crypto.randomUUID())
      : createEmptyTeacherLessonForm(),
  );
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(
    initialLesson?.updatedAt ?? null,
  );
  const [validationError, setValidationError] = useState("");
  const saveMutation = useMutation({
    mutationFn: async (input: MobileTeacherLessonMutationInput) => {
      if (mode === "edit") {
        if (!lessonId || !expectedUpdatedAt) {
          throw new Error("A versão desta aula ainda não foi carregada.");
        }

        return getMobileApi().updateTeacherLesson(lessonId, {
          ...input,
          expectedUpdatedAt,
        });
      }

      return getMobileApi().createTeacherLesson(input);
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: ["mobile-module", "lessons"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-lesson", result.lessonId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["teacher-lesson-editor", result.lessonId],
      });
      onSaved(result.lessonId);
    },
  });

  function changeForm(next: TeacherLessonFormState) {
    setForm(next);
    setValidationError("");
    saveMutation.reset();
  }

  function save() {
    const built = buildTeacherLessonMutation(form, operationId);

    if (!built.ok) {
      setValidationError(built.message);
      return;
    }

    setValidationError("");
    saveMutation.mutate(built.data);
  }

  async function reloadLatestVersion() {
    const refreshed = await onReload();

    if (refreshed) {
      setForm(
        teacherLessonEditorToForm(refreshed, () => Crypto.randomUUID()),
      );
      setExpectedUpdatedAt(refreshed.updatedAt);
      setOperationId(Crypto.randomUUID());
      setValidationError("");
      saveMutation.reset();
    }
  }

  const mutationError = saveErrorMessage(saveMutation.error);
  const isConflict =
    saveMutation.error instanceof ApiError &&
    saveMutation.error.code === "LESSON_EDIT_CONFLICT";

  return (
    <>
      <TeacherLessonEditorFields
        form={form}
        onChange={changeForm}
        options={options}
      />
      <TeacherLessonMaterialEditor
        materials={form.materials}
        onChange={(materials) => changeForm({ ...form, materials })}
      />
      <TeacherLessonVocabularyEditor
        items={form.vocabularyItems}
        onChange={(vocabularyItems) =>
          changeForm({ ...form, vocabularyItems })
        }
      />

      {validationError || mutationError ? (
        <View accessibilityRole="alert" style={styles.errorCard}>
          <Text style={styles.errorTitle}>Revise antes de salvar</Text>
          <Text style={styles.errorText}>
            {validationError || mutationError}
          </Text>
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
              ? "Criar aula"
              : "Salvar alterações"}
        </Text>
      </Pressable>
    </>
  );
}

export function TeacherLessonEditorScreen({
  lessonId = "",
  mode,
  onBack,
  onSaved,
}: TeacherLessonEditorScreenProps) {
  const optionsQuery = useQuery({
    queryFn: () => getMobileApi().getTeacherLessonOptions(),
    queryKey: ["teacher-lesson-options"],
  });
  const editorQuery = useQuery({
    enabled: mode === "edit" && lessonId.length > 0,
    queryFn: () => getMobileApi().getTeacherLessonEditor(lessonId),
    queryKey: ["teacher-lesson-editor", lessonId],
  });
  const isLoading =
    optionsQuery.isPending || (mode === "edit" && editorQuery.isPending);
  const hasLoadError =
    optionsQuery.isError || (mode === "edit" && editorQuery.isError);

  async function reloadEditor() {
    if (mode !== "edit") {
      return undefined;
    }

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
            accessibilityLabel="Voltar para a aula"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Aulas</Text>
          </Pressable>

          <Text style={styles.eyebrow}>PLANEJAMENTO SINCRONIZADO</Text>
          <Text accessibilityRole="header" style={styles.title}>
            {mode === "create" ? "Nova aula" : "Editar aula"}
          </Text>
          <Text style={styles.description}>
            O que for salvo aqui usa o mesmo banco do site Candy English.
          </Text>

          {isLoading ? (
            <ActivityIndicator
              accessibilityLabel="Carregando editor da aula"
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
                  if (mode === "edit") {
                    void editorQuery.refetch();
                  }
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
            <LoadedTeacherLessonEditor
              initialLesson={editorQuery.data}
              lessonId={lessonId}
              mode={mode}
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
