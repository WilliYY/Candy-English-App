import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { ApiError } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type Props = { onBack: () => void; submissionId: string };

const statusLabels = {
  RETURNED: "NOVA TENTATIVA LIBERADA",
  REVIEWED: "FEEDBACK ENVIADO",
  SUBMITTED: "AGUARDANDO CORREÇÃO",
} as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function isSafeDrawing(value: string) {
  return (
    value.length <= 50_000 &&
    /^data:image\/(?:jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)
  );
}

function mutationMessage(error: unknown) {
  if (
    error instanceof ApiError &&
    (error.code === "SUBMISSION_REVIEW_CONFLICT" ||
      error.code === "SUBMISSION_REDO_CONFLICT")
  ) {
    return "Esta entrega mudou no site ou foi reenviada. Recarregue a versão atual antes de continuar.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir esta ação agora.";
}

export function TeacherSubmissionDetailScreen({ onBack, submissionId }: Props) {
  const queryClient = useQueryClient();
  const [feedbackDraft, setFeedbackDraft] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [redoArmed, setRedoArmed] = useState(false);
  const reviewOperationId = useRef(Crypto.randomUUID());
  const redoOperationId = useRef(Crypto.randomUUID());
  const detailQuery = useQuery({
    enabled: submissionId.length > 0,
    queryFn: () => getMobileApi().getTeacherSubmission(submissionId),
    queryKey: ["teacher-submission", submissionId],
  });

  const feedback = feedbackDraft ?? detailQuery.data?.feedback ?? "";

  async function refreshAfterMutation(message: string) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["teacher-submission", submissionId] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-submissions"] }),
      queryClient.invalidateQueries({ queryKey: ["mobile-module", "submissions"] }),
    ]);
    setFeedbackDraft(null);
    setActionSuccess(message);
    setValidationError("");
    setRedoArmed(false);
  }

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const submission = detailQuery.data;
      if (!submission || submission.status === "RETURNED") {
        throw new Error("Esta entrega não está disponível para correção.");
      }
      return getMobileApi().reviewTeacherSubmission(submissionId, {
        expectedReviewedAt: submission.reviewedAt,
        expectedStatus: submission.status,
        expectedSubmittedAt: submission.submittedAt,
        feedback: feedback.trim(),
        operationId: reviewOperationId.current,
      });
    },
    onSuccess: async (result) => {
      reviewOperationId.current = Crypto.randomUUID();
      redoOperationId.current = Crypto.randomUUID();
      await refreshAfterMutation(result.message);
    },
  });

  const redoMutation = useMutation({
    mutationFn: async () => {
      const submission = detailQuery.data;
      if (!submission || submission.status === "RETURNED") {
        throw new Error("A nova tentativa já foi liberada.");
      }
      return getMobileApi().redoTeacherSubmission(submissionId, {
        expectedReviewedAt: submission.reviewedAt,
        expectedStatus: submission.status,
        expectedSubmittedAt: submission.submittedAt,
        feedback: feedback.trim() || null,
        operationId: redoOperationId.current,
      });
    },
    onSuccess: async (result) => {
      reviewOperationId.current = Crypto.randomUUID();
      redoOperationId.current = Crypto.randomUUID();
      await refreshAfterMutation(result.message);
    },
  });

  function sendFeedback() {
    if (feedback.trim().length < 2) {
      setValidationError("Escreva um feedback com pelo menos 2 caracteres.");
      return;
    }
    setValidationError("");
    setActionSuccess("");
    setRedoArmed(false);
    reviewMutation.reset();
    redoMutation.reset();
    reviewMutation.mutate();
  }

  function requestRedo() {
    setActionSuccess("");
    setValidationError("");
    reviewMutation.reset();
    redoMutation.reset();
    if (!redoArmed) {
      setRedoArmed(true);
      return;
    }
    redoMutation.mutate();
  }

  const mutationError = reviewMutation.error ?? redoMutation.error;
  const isConflict =
    mutationError instanceof ApiError &&
    (mutationError.code === "SUBMISSION_REVIEW_CONFLICT" ||
      mutationError.code === "SUBMISSION_REDO_CONFLICT");
  const submission = detailQuery.data;
  const isMutating = reviewMutation.isPending || redoMutation.isPending;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.brand]}
              onRefresh={() => void detailQuery.refetch()}
              refreshing={detailQuery.isRefetching}
              tintColor={colors.brand}
            />
          }
        >
          <Pressable
            accessibilityLabel="Voltar para as correções"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Correções</Text>
          </Pressable>

          {detailQuery.isPending ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.brand} size="large" />
              <Text style={styles.muted}>Carregando resposta...</Text>
            </View>
          ) : detailQuery.isError || !submission ? (
            <View style={styles.state}>
              <Text accessibilityRole="alert" style={styles.errorText}>
                {detailQuery.error?.message || "Não foi possível abrir esta entrega."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void detailQuery.refetch()}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>ENTREGA DE {submission.student.name.toUpperCase()}</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {submission.homework.title}
                </Text>
                <Text style={styles.subtitle}>{submission.homework.lessonTitle}</Text>
                <View style={styles.statusRow}>
                  <Text style={[styles.status, styles[`status${submission.status}`]]}>
                    {statusLabels[submission.status]}
                  </Text>
                  <Text style={styles.date}>Enviada em {formatDate(submission.submittedAt)}</Text>
                </View>
                {submission.reviewedAt ? (
                  <Text style={styles.date}>Corrigida em {formatDate(submission.reviewedAt)}</Text>
                ) : null}
              </View>

              {submission.homework.instructions ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Orientações da tarefa</Text>
                  <Text style={styles.body}>{submission.homework.instructions}</Text>
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resposta do aluno</Text>
                {submission.answers.length === 0 ? (
                  <Text style={styles.muted}>Nenhuma resposta reconhecida.</Text>
                ) : (
                  <View style={styles.answers}>
                    {submission.answers.map((answer) => (
                      <View key={answer.id} style={styles.answerCard}>
                        <Text style={styles.answerLabel}>{answer.label}</Text>
                        {answer.type === "DRAWING" && isSafeDrawing(answer.value) ? (
                          <Image
                            accessibilityLabel={`Desenho enviado em ${answer.label}`}
                            contentFit="contain"
                            source={{ uri: answer.value }}
                            style={styles.drawing}
                          />
                        ) : (
                          <Text selectable style={styles.answerValue}>
                            {answer.value || "Sem resposta"}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {submission.homework.questions.some((question) => question.expectedAnswer) ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Referência da teacher</Text>
                  {submission.homework.questions.map((question) =>
                    question.expectedAnswer ? (
                      <View key={question.id} style={styles.reference}>
                        <Text style={styles.answerLabel}>{question.prompt}</Text>
                        <Text style={styles.body}>{question.expectedAnswer}</Text>
                      </View>
                    ) : null,
                  )}
                </View>
              ) : null}

              {submission.hasAnnotations ? (
                <Text style={styles.annotationNotice}>
                  Esta entrega possui anotações feitas no site; elas continuam preservadas no histórico.
                </Text>
              ) : null}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feedback para o aluno</Text>
                <TextInput
                  accessibilityLabel="Feedback para o aluno"
                  editable={!isMutating && submission.status !== "RETURNED"}
                  maxLength={6000}
                  multiline
                  onChangeText={(value) => {
                    setFeedbackDraft(value);
                    setValidationError("");
                    setActionSuccess("");
                    setRedoArmed(false);
                  }}
                  placeholder="Explique o que ficou bom e o que pode melhorar..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  textAlignVertical="top"
                  value={feedback}
                />
                <Text style={styles.counter}>{feedback.length}/6000</Text>

                {validationError ? (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {validationError}
                  </Text>
                ) : null}
                {mutationError ? (
                  <View style={styles.messageBlock}>
                    <Text accessibilityRole="alert" style={styles.errorText}>
                      {mutationMessage(mutationError)}
                    </Text>
                    {isConflict ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          reviewMutation.reset();
                          redoMutation.reset();
                          void detailQuery.refetch().then(() => setFeedbackDraft(null));
                        }}
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>Recarregar versão atual</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
                {actionSuccess ? (
                  <Text accessibilityRole="alert" style={styles.successText}>
                    {actionSuccess}
                  </Text>
                ) : null}

                {submission.status === "RETURNED" ? (
                  <Text style={styles.returnedNotice}>
                    O aluno já pode editar e reenviar esta tarefa. O feedback volta a ser editável na próxima entrega.
                  </Text>
                ) : (
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      disabled={isMutating}
                      onPress={sendFeedback}
                      style={[styles.primaryButton, isMutating && styles.disabled]}
                    >
                      {reviewMutation.isPending ? (
                        <ActivityIndicator color={colors.surface} />
                      ) : (
                        <Text style={styles.primaryButtonText}>Enviar feedback</Text>
                      )}
                    </Pressable>
                    <Pressable
                      accessibilityHint={
                        redoArmed
                          ? "Confirma que o aluno poderá responder novamente"
                          : "Solicita confirmação antes de liberar"
                      }
                      accessibilityRole="button"
                      disabled={isMutating}
                      onPress={requestRedo}
                      style={[
                        styles.secondaryButton,
                        redoArmed && styles.redoConfirm,
                        isMutating && styles.disabled,
                      ]}
                    >
                      {redoMutation.isPending ? (
                        <ActivityIndicator color={colors.brand} />
                      ) : (
                        <Text style={styles.secondaryButtonText}>
                          {redoArmed ? "Confirmar nova tentativa" : "Liberar nova tentativa"}
                        </Text>
                      )}
                    </Pressable>
                    {redoArmed ? (
                      <Text style={styles.confirmText}>
                        Toque novamente para confirmar. O aluno poderá alterar e reenviar a resposta.
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  annotationNotice: {
    backgroundColor: colors.coral,
    borderRadius: radii.sm,
    color: colors.text,
    padding: spacing.md,
  },
  answerCard: { backgroundColor: colors.background, borderRadius: radii.sm, gap: spacing.xs, padding: spacing.md },
  answerLabel: { color: colors.focus, fontSize: typeScale.caption, fontWeight: "800" },
  answers: { gap: spacing.sm },
  answerValue: { color: colors.text, fontSize: typeScale.body, lineHeight: 24 },
  back: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  backText: { color: colors.brand, fontSize: typeScale.body, fontWeight: "700" },
  body: { color: colors.text, fontSize: typeScale.body, lineHeight: 24 },
  confirmText: { color: colors.textMuted, fontSize: typeScale.caption, textAlign: "center" },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 760,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  counter: { color: colors.textMuted, fontSize: typeScale.caption, textAlign: "right" },
  date: { color: colors.textMuted, fontSize: typeScale.caption },
  disabled: { opacity: 0.55 },
  drawing: { backgroundColor: colors.surface, borderRadius: radii.sm, height: 280, width: "100%" },
  errorText: { color: "#A43D55", fontSize: typeScale.body, textAlign: "center" },
  eyebrow: { color: colors.focus, fontSize: typeScale.caption, fontWeight: "800", letterSpacing: 1.2 },
  flex: { flex: 1 },
  hero: { gap: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 150,
    padding: spacing.md,
  },
  messageBlock: { alignItems: "center", gap: spacing.sm },
  muted: { color: colors.textMuted, fontSize: typeScale.body, textAlign: "center" },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  primaryButtonText: { color: colors.surface, fontSize: typeScale.body, fontWeight: "800" },
  redoConfirm: { backgroundColor: colors.coral, borderColor: colors.focus },
  reference: { borderLeftColor: colors.energy, borderLeftWidth: 3, gap: spacing.xs, paddingLeft: spacing.md },
  returnedNotice: {
    backgroundColor: "#DDF3E9",
    borderRadius: radii.sm,
    color: colors.success,
    lineHeight: 22,
    padding: spacing.md,
  },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: { color: colors.brand, fontSize: typeScale.body, fontWeight: "800" },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "900" },
  state: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  status: {
    borderRadius: radii.pill,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusRETURNED: { backgroundColor: colors.coral, color: colors.text },
  statusREVIEWED: { backgroundColor: "#DDF3E9", color: colors.success },
  statusRow: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  statusSUBMITTED: { backgroundColor: "#F4E5F3", color: colors.focus },
  subtitle: { color: colors.textMuted, fontSize: typeScale.lead },
  successText: { color: colors.success, fontSize: typeScale.body, fontWeight: "700", textAlign: "center" },
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: "900", lineHeight: 42 },
});
