import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type HomeworkScreenProps = {
  homeworkId: string;
  onBack: () => void;
};

const submissionLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  RETURNED: "Devolvida",
  REVIEWED: "Corrigida",
  SUBMITTED: "Enviada",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sem prazo definido";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HomeworkScreen({
  homeworkId,
  onBack,
}: HomeworkScreenProps) {
  const queryClient = useQueryClient();
  const [answerDraft, setAnswerDraft] = useState<{
    homeworkId: string;
    value: string;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const homework = useQuery({
    enabled: Boolean(homeworkId),
    queryFn: () => getMobileApi().getHomework(homeworkId),
    queryKey: ["homework", homeworkId],
  });
  const answer =
    answerDraft &&
    homework.data?.canSubmit &&
    answerDraft.homeworkId === homework.data.id
      ? answerDraft.value
      : (homework.data?.answer ?? "");
  const submit = useMutation({
    mutationFn: () => getMobileApi().submitHomework(homeworkId, answer.trim()),
    onSuccess: async (result) => {
      setSuccessMessage(result.message);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["mobile-module", "homeworks"],
        }),
        queryClient.invalidateQueries({ queryKey: ["mobile-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["homework", homeworkId] }),
      ]);
    },
  });

  function confirmSubmit() {
    if (!answer.trim() || submit.isPending) {
      return;
    }

    setSuccessMessage("");
    Alert.alert(
      "Enviar homework?",
      "Sua resposta ficará disponível para correção do teacher.",
      [
        { style: "cancel", text: "Continuar editando" },
        {
          onPress: () => submit.mutate(),
          text: "Enviar agora",
        },
      ],
    );
  }

  const data = homework.data;
  const canSubmitText =
    data?.kind === "TEXT" && data.canSubmit && answer.trim().length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.brand]}
              onRefresh={() => void homework.refetch()}
              refreshing={homework.isRefetching}
              tintColor={colors.brand}
            />
          }
        >
          <Pressable
            accessibilityLabel="Voltar para homeworks"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Homeworks</Text>
          </Pressable>

          {homework.isLoading ? (
            <ActivityIndicator
              color={colors.brand}
              size="large"
              style={styles.loader}
            />
          ) : null}

          {homework.isError ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>
                {homework.error instanceof Error
                  ? homework.error.message
                  : "Não foi possível abrir esta homework."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void homework.refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {data ? (
            <>
              <Text style={styles.eyebrow}>{data.lessonTitle}</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {data.title}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.deadline}>
                  Prazo: {formatDate(data.dueDate)}
                </Text>
                {data.submissionStatus ? (
                  <Text style={styles.status}>
                    {submissionLabels[data.submissionStatus] ??
                      data.submissionStatus}
                  </Text>
                ) : null}
              </View>

              {data.instructions ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>ORIENTAÇÕES</Text>
                  <Text style={styles.cardText}>{data.instructions}</Text>
                </View>
              ) : null}

              {data.questions.length > 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>PERGUNTA</Text>
                  {data.questions.map((question, index) => (
                    <Text key={question.id} style={styles.question}>
                      {data.questions.length > 1 ? `${index + 1}. ` : ""}
                      {question.prompt}
                    </Text>
                  ))}
                </View>
              ) : null}

              {data.kind === "TEXT" ? (
                <View style={styles.answerSection}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.answerTitle}>Sua resposta</Text>
                    <Text style={styles.counter}>{answer.length}/6000</Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Resposta da homework"
                    editable={data.canSubmit && !submit.isPending}
                    maxLength={6000}
                    multiline
                    onChangeText={(value) => {
                      setAnswerDraft({ homeworkId: data.id, value });
                      setSuccessMessage("");
                    }}
                    placeholder="Escreva sua resposta aqui..."
                    placeholderTextColor={colors.textMuted}
                    style={[
                      styles.input,
                      !data.canSubmit ? styles.inputDisabled : null,
                    ]}
                    textAlignVertical="top"
                    value={answer}
                  />

                  {submit.isError ? (
                    <Text accessibilityRole="alert" style={styles.submitError}>
                      {submit.error instanceof Error
                        ? submit.error.message
                        : "Não foi possível enviar sua resposta."}
                    </Text>
                  ) : null}

                  {successMessage ? (
                    <Text accessibilityRole="alert" style={styles.success}>
                      {successMessage}
                    </Text>
                  ) : null}

                  {!data.canSubmit ? (
                    <Text style={styles.locked}>
                      Esta homework já foi corrigida. A resposta fica disponível
                      somente para consulta.
                    </Text>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: !canSubmitText || submit.isPending,
                    }}
                    disabled={!canSubmitText || submit.isPending}
                    onPress={confirmSubmit}
                    style={({ pressed }) => [
                      styles.submitButton,
                      !canSubmitText || submit.isPending
                        ? styles.submitButtonDisabled
                        : null,
                      pressed && canSubmitText ? styles.pressed : null,
                    ]}
                  >
                    {submit.isPending ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <Text style={styles.submitText}>Enviar para correção</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>ATIVIDADE INTERATIVA</Text>
                  <Text style={styles.cardText}>
                    Esta atividade tem {data.interactiveFields.length} campo(s)
                    interativo(s). A edição nativa será disponibilizada na
                    próxima etapa do app.
                  </Text>
                </View>
              )}

              {data.feedback ? (
                <View style={styles.feedback}>
                  <Text style={styles.feedbackLabel}>FEEDBACK DO TEACHER</Text>
                  <Text style={styles.feedbackText}>{data.feedback}</Text>
                  {data.reviewedAt ? (
                    <Text style={styles.reviewedAt}>
                      Corrigida em {formatDate(data.reviewedAt)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: 720,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  back: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  loader: {
    marginTop: spacing.xxl,
  },
  error: {
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.surface,
    fontWeight: "900",
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: spacing.xl,
    textTransform: "uppercase",
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  deadline: {
    color: colors.textMuted,
    flexGrow: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  status: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  cardLabel: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1,
  },
  cardText: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 25,
  },
  question: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "800",
    lineHeight: 27,
  },
  answerSection: {
    marginTop: spacing.xl,
  },
  answerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  answerTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  counter: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginTop: spacing.sm,
    minHeight: 180,
    padding: spacing.md,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textMuted,
  },
  submitError: {
    color: colors.focus,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  success: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  locked: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.82,
  },
  feedback: {
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  feedbackLabel: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1,
  },
  feedbackText: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 25,
  },
  reviewedAt: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
  },
});
