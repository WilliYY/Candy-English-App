import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-candy-xp/admin-candy-xp.styles";
import type {
  AdminCandyXpActivityUpdateInput,
  AdminCandyXpReviewInput,
  MobileAdminCandyXpSubmission,
} from "@/lib/api/admin-candy-xp-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  | "getAdminCandyXpActivity"
  | "reviewAdminCandyXpSubmission"
  | "updateAdminCandyXpActivity"
>;
type Props = {
  activityId: string;
  client?: Client;
  createOperationId?: () => string;
  onBack: () => void;
};
type FormState = {
  category: string;
  description: string;
  level: string;
  releaseMode: "ALL" | "STUDENT";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  studentProfileId: string | null;
  title: string;
  xpReward: string;
};
type UpdateAttempt = { input: AdminCandyXpActivityUpdateInput; signature: string };
type ReviewAttempt = {
  input: AdminCandyXpReviewInput;
  signature: string;
  submissionId: string;
};

const emptyForm: FormState = {
  category: "",
  description: "",
  level: "",
  releaseMode: "ALL",
  status: "DRAFT",
  studentProfileId: null,
  title: "",
  xpReward: "",
};
const statusLabels = { ARCHIVED: "Arquivada", DRAFT: "Rascunho", PUBLISHED: "Publicada" } as const;

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a alteração.";
}

function showJson(value: unknown) {
  if (value === null || value === undefined || value === "") return "Não informado";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "Formato não exibível";
  }
}

export function AdminCandyXpActivityScreen({
  activityId,
  client,
  createOperationId = Crypto.randomUUID,
  onBack,
}: Props) {
  const api = client ?? getMobileApi();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<FormState>>({});
  const dirty = Object.keys(draft).length > 0;
  const [studentQuery, setStudentQuery] = useState("");
  const [feedbackBySubmission, setFeedbackBySubmission] = useState<Record<string, string>>({});
  const [updateAttempt, setUpdateAttempt] = useState<UpdateAttempt | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<ReviewAttempt | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const detail = useQuery({
    queryFn: () => api.getAdminCandyXpActivity(activityId),
    queryKey: ["admin-candy-xp-activity", activityId],
    refetchInterval: dirty ? false : 15_000,
  });
  const activity = detail.data?.activity;
  const form: FormState = activity
    ? {
        category: activity.category,
        description: activity.description ?? "",
        level: activity.level,
        releaseMode: activity.release.mode,
        status: activity.status,
        studentProfileId: activity.release.students[0]?.id ?? null,
        title: activity.title,
        xpReward: String(activity.xpReward),
        ...draft,
      }
    : { ...emptyForm, ...draft };

  const update = useMutation({
    mutationFn: (attempt: UpdateAttempt) =>
      api.updateAdminCandyXpActivity(activityId, attempt.input),
    onError: (cause) => {
      setSuccess("");
      setError(messageFrom(cause));
    },
    onSuccess: async (result) => {
      setUpdateAttempt(null);
      setDraft({});
      setError("");
      setSuccess(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-candy-xp"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-candy-xp-activity", activityId] }),
      ]);
    },
  });
  const review = useMutation({
    mutationFn: (attempt: ReviewAttempt) =>
      api.reviewAdminCandyXpSubmission(attempt.submissionId, attempt.input),
    onError: (cause) => {
      setSuccess("");
      setError(messageFrom(cause));
    },
    onSuccess: async (result, attempt) => {
      setReviewAttempt(null);
      setFeedbackBySubmission((current) => ({ ...current, [attempt.submissionId]: "" }));
      setError("");
      setSuccess(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-candy-xp"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-candy-xp-activity", activityId] }),
      ]);
    },
  });

  const visibleStudents = useMemo(() => {
    const normalized = studentQuery.trim().toLocaleLowerCase("pt-BR");
    return (detail.data?.students ?? [])
      .filter((student) => !normalized || student.name.toLocaleLowerCase("pt-BR").includes(normalized))
      .slice(0, 20);
  }, [detail.data?.students, studentQuery]);

  function changeForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setError("");
    setSuccess("");
    setUpdateAttempt(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function confirmUpdate() {
    if (!activity) return;
    const xpReward = Number(form.xpReward);
    if (
      form.title.trim().length < 3 ||
      form.category.trim().length < 2 ||
      !form.level.trim() ||
      !Number.isInteger(xpReward) ||
      xpReward < 1 ||
      xpReward > 500 ||
      (form.releaseMode === "STUDENT" && !form.studentProfileId)
    ) {
      setError("Preencha título, categoria, nível, XP de 1 a 500 e o aluno da liberação.");
      return;
    }
    const values = {
      category: form.category.trim(),
      confirmChange: true as const,
      description: form.description.trim() || null,
      expectedUpdatedAt: activity.updatedAt,
      level: form.level.trim(),
      releaseMode: form.releaseMode,
      status: form.status,
      studentProfileId: form.releaseMode === "STUDENT" ? form.studentProfileId : null,
      title: form.title.trim(),
      xpReward,
    };
    const signature = JSON.stringify(values);
    const attempt = updateAttempt?.signature === signature
      ? updateAttempt
      : { input: { ...values, operationId: createOperationId() }, signature };
    setUpdateAttempt(attempt);
    Alert.alert(
      "Confirmar alteração?",
      "Título, status, XP e liberação também mudarão no site.",
      [
        { style: "cancel", text: "Cancelar" },
        { onPress: () => update.mutate(attempt), text: "Confirmar" },
      ],
    );
  }

  function confirmReview(
    submission: MobileAdminCandyXpSubmission,
    outcome: AdminCandyXpReviewInput["outcome"],
  ) {
    const feedback = feedbackBySubmission[submission.id]?.trim() || null;
    const values = {
      confirmReview: true as const,
      expectedUpdatedAt: submission.updatedAt,
      feedback,
      outcome,
    };
    const signature = `${submission.id}|${JSON.stringify(values)}`;
    const attempt = reviewAttempt?.signature === signature
      ? reviewAttempt
      : {
          input: { ...values, operationId: createOperationId() },
          signature,
          submissionId: submission.id,
        };
    setReviewAttempt(attempt);
    Alert.alert(
      outcome === "APPROVE" ? "Aprovar e liberar XP?" : "Devolver atividade?",
      outcome === "APPROVE"
        ? `A aprovação libera ${activity?.xpReward ?? 0} XP uma única vez.`
        : "O aluno poderá corrigir e enviar novamente.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () => review.mutate(attempt),
          style: outcome === "RETURN" ? "destructive" : "default",
          text: "Confirmar",
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl onRefresh={() => void detail.refetch()} refreshing={detail.isRefetching} />
        }
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · CANDY XP</Text>
        <Text accessibilityRole="header" style={styles.title}>Gerenciar atividade</Text>
        <Text style={styles.subtitle}>Edite a liberação e corrija entregas sem expor dados pessoais.</Text>

        {detail.isPending ? (
          <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando atividade...</Text></View>
        ) : detail.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void detail.refetch()} style={styles.stateCard}>
            <Text style={styles.errorText}>{messageFrom(detail.error)}</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : activity ? (
          <>
            {success ? <Text accessibilityRole="alert" style={styles.success}>{success}</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Configuração</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>TÍTULO</Text>
              <TextInput accessibilityLabel="Título da atividade" maxLength={160} onChangeText={(value) => changeForm("title", value)} style={styles.input} value={form.title} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>DESCRIÇÃO</Text>
              <TextInput accessibilityLabel="Descrição da atividade" maxLength={1600} multiline onChangeText={(value) => changeForm("description", value)} style={[styles.input, styles.inputMultiline]} value={form.description} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CATEGORIA</Text>
              <TextInput accessibilityLabel="Categoria da atividade" maxLength={80} onChangeText={(value) => changeForm("category", value)} style={styles.input} value={form.category} />
            </View>
            <View style={styles.searchRow}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>NÍVEL</Text>
                <TextInput accessibilityLabel="Nível da atividade" maxLength={80} onChangeText={(value) => changeForm("level", value)} style={styles.input} value={form.level} />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>XP</Text>
                <TextInput accessibilityLabel="XP da atividade" keyboardType="number-pad" maxLength={3} onChangeText={(value) => changeForm("xpReward", value.replace(/\D/g, ""))} style={styles.input} value={form.xpReward} />
              </View>
            </View>

            <Text style={styles.label}>STATUS</Text>
            <View style={styles.chips}>
              {(Object.keys(statusLabels) as FormState["status"][]).map((value) => (
                <Pressable accessibilityRole="button" key={value} onPress={() => changeForm("status", value)} style={[styles.chip, form.status === value ? styles.chipSelected : null]}>
                  <Text style={[styles.chipText, form.status === value ? styles.chipTextSelected : null]}>{statusLabels[value]}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>LIBERAÇÃO</Text>
            <View style={styles.chips}>
              <Pressable accessibilityRole="button" onPress={() => changeForm("releaseMode", "ALL")} style={[styles.chip, form.releaseMode === "ALL" ? styles.chipSelected : null]}>
                <Text style={[styles.chipText, form.releaseMode === "ALL" ? styles.chipTextSelected : null]}>Todos os alunos</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => changeForm("releaseMode", "STUDENT")} style={[styles.chip, form.releaseMode === "STUDENT" ? styles.chipSelected : null]}>
                <Text style={[styles.chipText, form.releaseMode === "STUDENT" ? styles.chipTextSelected : null]}>Um aluno</Text>
              </Pressable>
            </View>
            {form.releaseMode === "STUDENT" ? (
              <>
                <TextInput accessibilityLabel="Buscar aluno para liberação" onChangeText={setStudentQuery} placeholder="Buscar aluno" style={styles.input} value={studentQuery} />
                <View style={styles.chips}>
                  {visibleStudents.map((student) => (
                    <Pressable accessibilityLabel={`Liberar para ${student.name}`} accessibilityRole="button" key={student.id} onPress={() => changeForm("studentProfileId", student.id)} style={[styles.chip, form.studentProfileId === student.id ? styles.chipSelected : null]}>
                      <Text style={[styles.chipText, form.studentProfileId === student.id ? styles.chipTextSelected : null]}>{student.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
            <Pressable accessibilityRole="button" disabled={update.isPending} onPress={confirmUpdate} style={[styles.primaryButton, update.isPending ? styles.buttonDisabled : null]}>
              <Text style={styles.primaryButtonText}>{update.isPending ? "Salvando..." : "Revisar e salvar"}</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Gabarito administrativo</Text>
            <Text style={styles.sectionHint}>As respostas corretas aparecem apenas nesta área ADMIN.</Text>
            {activity.questions.length ? activity.questions.map((question, index) => (
              <View key={question.id} style={styles.card}>
                <Text style={styles.cardTitle}>{index + 1}. {question.prompt}</Text>
                <Text style={styles.cardMeta}>{question.type} · {question.required ? "Obrigatória" : "Opcional"}</Text>
                <Text style={styles.label}>RESPOSTA CORRETA</Text>
                <Text style={styles.cardText}>{showJson(question.correctAnswer)}</Text>
              </View>
            )) : <View style={styles.stateCard}><Text style={styles.stateText}>Atividade sem perguntas automáticas.</Text></View>}

            <Text style={styles.sectionTitle}>Entregas e correções</Text>
            {activity.submissions.length ? activity.submissions.map((submission) => (
              <View key={submission.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardTitle}>{submission.studentName}</Text>
                    <Text style={styles.cardMeta}>{submission.status} · {submission.autoScorePercent ?? "—"}% automático</Text>
                  </View>
                  {submission.awardedXp !== null ? <Text style={styles.rankingXp}>+{submission.awardedXp} XP</Text> : null}
                </View>
                <View style={styles.answers}>
                  {submission.answers.map((answer) => {
                    const question = activity.questions.find((item) => item.id === answer.questionId);
                    return (
                      <View key={`${submission.id}-${answer.questionId}`} style={styles.answer}>
                        <Text style={styles.answerQuestion}>{question?.prompt ?? "Resposta"}</Text>
                        <Text style={styles.answerValue}>{answer.value || "Sem resposta"}</Text>
                      </View>
                    );
                  })}
                </View>
                {submission.feedback ? <Text style={styles.cardText}>Feedback: {submission.feedback}</Text> : null}
                {submission.status === "SUBMITTED" ? (
                  <>
                    <TextInput
                      accessibilityLabel={`Feedback para ${submission.studentName}`}
                      maxLength={3000}
                      multiline
                      onChangeText={(value) => setFeedbackBySubmission((current) => ({ ...current, [submission.id]: value }))}
                      placeholder="Feedback opcional"
                      style={[styles.input, styles.inputMultiline]}
                      value={feedbackBySubmission[submission.id] ?? ""}
                    />
                    <View style={styles.actionRow}>
                      <Pressable accessibilityLabel={`Aprovar entrega de ${submission.studentName}`} accessibilityRole="button" disabled={review.isPending} onPress={() => confirmReview(submission, "APPROVE")} style={[styles.primaryButton, { flex: 1 }, review.isPending ? styles.buttonDisabled : null]}>
                        <Text style={styles.primaryButtonText}>Aprovar + XP</Text>
                      </Pressable>
                      <Pressable accessibilityLabel={`Devolver entrega de ${submission.studentName}`} accessibilityRole="button" disabled={review.isPending} onPress={() => confirmReview(submission, "RETURN")} style={[styles.dangerButton, review.isPending ? styles.buttonDisabled : null]}>
                        <Text style={styles.dangerButtonText}>Devolver</Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Text style={styles.cardMeta}>Corrigida por {submission.reviewedByName ?? "equipe"}.</Text>
                )}
              </View>
            )) : <View style={styles.stateCard}><Text style={styles.stateText}>Nenhuma entrega nesta atividade.</Text></View>}

            {activity.asset ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Material protegido</Text>
                <Text style={styles.cardMeta}>{activity.asset.fileName} · {activity.asset.pageCount} página(s)</Text>
                <Text style={styles.sectionHint}>O app recebe apenas metadados seguros; caminhos internos do arquivo não são expostos.</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
