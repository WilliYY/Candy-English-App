import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import type {
  AdminAgendaAttendanceInput,
  AdminAgendaMakeupInput,
  MobileAdminAgendaLessonDetail,
} from "@/lib/api/admin-agenda-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  | "createAdminAgendaMakeup"
  | "getAdminAgendaLesson"
  | "updateAdminAgendaAttendance"
>;
type Props = { client?: Client; lessonId: string; onBack: () => void };
type AttendanceStatus = AdminAgendaAttendanceInput["status"];

const statusLabels = {
  ATTENDED: "Veio",
  MAKEUP_ATTENDED: "Reposicao feita",
  MAKEUP_SCHEDULED: "Reposicao marcada",
  MISSED: "Nao veio",
  SCHEDULED: "Previsto",
} as const;
const unitLabels = { DOURADINA: "Douradina", IVATE: "Ivaté" } as const;

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function LessonEditor({
  api,
  detail,
  onBack,
}: {
  api: Client;
  detail: MobileAdminAgendaLessonDetail;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [attendanceAttempt, setAttendanceAttempt] = useState<{
    operationId: string;
    status: AttendanceStatus;
  } | null>(null);
  const [makeupAttempt, setMakeupAttempt] = useState<{
    input: AdminAgendaMakeupInput;
    signature: string;
  } | null>(null);
  const [makeupDate, setMakeupDate] = useState("");
  const [makeupTime, setMakeupTime] = useState(detail.lesson.time);
  const [makeupNotes, setMakeupNotes] = useState("");
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");
  const lesson = detail.lesson;

  const attendance = useMutation({
    mutationFn: (attempt: { operationId: string; status: AttendanceStatus }) =>
      api.updateAdminAgendaAttendance(lesson.id, {
        confirmChange: true,
        expectedUpdatedAt: lesson.updatedAt,
        operationId: attempt.operationId,
        status: attempt.status,
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData<MobileAdminAgendaLessonDetail>(
        ["admin-agenda-lesson", lesson.id],
        (current) => (current ? { ...current, lesson: result.lesson } : current),
      );
      setAttendanceAttempt(null);
      setSuccess(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-agenda"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin-agenda-lesson", lesson.id],
        }),
      ]);
    },
  });
  const makeup = useMutation({
    mutationFn: (attempt: { input: AdminAgendaMakeupInput }) =>
      api.createAdminAgendaMakeup(lesson.id, attempt.input),
    onSuccess: async (result) => {
      setMakeupAttempt(null);
      setSuccess(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-agenda"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin-agenda-lesson", lesson.id],
        }),
      ]);
    },
  });

  function confirmAttendance(status: AttendanceStatus) {
    setValidationError("");
    setSuccess("");
    const attempt =
      attendanceAttempt?.status === status
        ? attendanceAttempt
        : { operationId: Crypto.randomUUID(), status };
    setAttendanceAttempt(attempt);
    const action =
      status === "ATTENDED"
        ? "marcar como veio"
        : status === "MISSED"
          ? "registrar falta"
          : "resetar a presenca";
    Alert.alert(
      "Confirmar alteracao?",
      `${lesson.studentName}: ${action}. A mudanca tambem aparecera no site.`,
      [
        { style: "cancel", text: "Cancelar" },
        { text: "Confirmar", onPress: () => attendance.mutate(attempt) },
      ],
    );
  }

  function renewMakeup() {
    setMakeupAttempt(null);
    setValidationError("");
    setSuccess("");
    makeup.reset();
  }

  function confirmMakeup() {
    if (!validDate(makeupDate)) {
      setValidationError("Informe a data no formato AAAA-MM-DD.");
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(makeupTime)) {
      setValidationError("Informe o horario no formato HH:MM.");
      return;
    }
    setValidationError("");
    setSuccess("");
    const signature = `${makeupDate}|${makeupTime}|${makeupNotes.trim()}`;
    const attempt =
      makeupAttempt?.signature === signature
        ? makeupAttempt
        : {
            input: {
              confirmCreate: true as const,
              date: makeupDate,
              expectedUpdatedAt: lesson.updatedAt,
              notes: makeupNotes.trim() || null,
              operationId: Crypto.randomUUID(),
              time: makeupTime,
            },
            signature,
          };
    setMakeupAttempt(attempt);
    Alert.alert(
      "Criar reposicao?",
      `${lesson.studentName} · ${displayDate(makeupDate)} as ${makeupTime}. A aula original sera marcada como falta.`,
      [
        { style: "cancel", text: "Cancelar" },
        { text: "Confirmar", onPress: () => makeup.mutate(attempt) },
      ],
    );
  }

  const operationError = attendance.error ?? makeup.error;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · AGENDA</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {lesson.studentName}
        </Text>
        <Text style={styles.subtitle}>
          {unitLabels[lesson.studentUnit]} · {displayDate(lesson.date)} · {lesson.time}
        </Text>

        <View style={styles.identityCard}>
          <Text style={styles.identityName}>{statusLabels[lesson.status]}</Text>
          <Text style={styles.identityEmail}>
            {lesson.isMakeup ? "Reposicao" : "Aula regular"}
          </Text>
          {lesson.studentPhone ? (
            <Text style={styles.identityMeta}>{lesson.studentPhone}</Text>
          ) : null}
          {lesson.studentNote ? (
            <Text style={styles.warning}>{lesson.studentNote}</Text>
          ) : null}
          {lesson.lessonNote ? (
            <Text style={styles.warning}>{lesson.lessonNote}</Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Presenca</Text>
        <View style={styles.chips}>
          <Pressable
            accessibilityLabel={`Marcar ${lesson.studentName} como veio`}
            accessibilityRole="button"
            disabled={attendance.isPending}
            onPress={() => confirmAttendance("ATTENDED")}
            style={[styles.chip, lesson.status === "ATTENDED" || lesson.status === "MAKEUP_ATTENDED" ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipText, lesson.status === "ATTENDED" || lesson.status === "MAKEUP_ATTENDED" ? styles.chipTextSelected : null]}>Veio</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Marcar ${lesson.studentName} como nao veio`}
            accessibilityRole="button"
            disabled={attendance.isPending}
            onPress={() => confirmAttendance("MISSED")}
            style={[styles.chip, lesson.status === "MISSED" ? styles.chipSelected : null]}
          >
            <Text style={[styles.chipText, lesson.status === "MISSED" ? styles.chipTextSelected : null]}>Nao veio</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Resetar presenca de ${lesson.studentName}`}
            accessibilityRole="button"
            disabled={attendance.isPending}
            onPress={() => confirmAttendance("SCHEDULED")}
            style={styles.chip}
          >
            <Text style={styles.chipText}>Resetar</Text>
          </Pressable>
        </View>

        {!lesson.isMakeup ? (
          <>
            <Text style={styles.sectionTitle}>Criar reposicao</Text>
            <Text style={styles.formLabel}>DATA</Text>
            <TextInput
              accessibilityLabel="Data da reposicao"
              maxLength={10}
              onChangeText={(value) => { setMakeupDate(value); renewMakeup(); }}
              placeholder="AAAA-MM-DD"
              style={styles.formInput}
              value={makeupDate}
            />
            <Text style={styles.formLabel}>HORARIO</Text>
            <TextInput
              accessibilityLabel="Horario da reposicao"
              maxLength={5}
              onChangeText={(value) => { setMakeupTime(value); renewMakeup(); }}
              placeholder="15:30"
              style={styles.formInput}
              value={makeupTime}
            />
            <Text style={styles.formLabel}>OBSERVACAO</Text>
            <TextInput
              accessibilityLabel="Observacao da reposicao"
              maxLength={500}
              multiline
              onChangeText={(value) => { setMakeupNotes(value); renewMakeup(); }}
              placeholder="Informacao interna opcional"
              style={[styles.formInput, styles.formInputMultiline]}
              value={makeupNotes}
            />
            <Pressable
              accessibilityLabel={`Criar reposicao para ${lesson.studentName}`}
              accessibilityRole="button"
              disabled={makeup.isPending}
              onPress={confirmMakeup}
              style={[styles.submitButton, makeup.isPending ? styles.submitButtonDisabled : null]}
            >
              <Text style={styles.submitButtonText}>
                {makeup.isPending ? "Criando..." : "Criar reposicao"}
              </Text>
            </Pressable>
          </>
        ) : null}

        {validationError ? <Text style={styles.formError}>{validationError}</Text> : null}
        {operationError ? (
          <Text style={styles.formError}>
            {operationError instanceof Error
              ? operationError.message
              : "Nao foi possivel concluir a operacao."}
          </Text>
        ) : null}
        {success ? <Text style={styles.warning}>{success}</Text> : null}

        <Text style={styles.sectionTitle}>Historico do aluno</Text>
        {detail.history.length ? (
          detail.history.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardName}>{item.description}</Text>
              <Text style={styles.cardMeta}>
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </Text>
              {item.actorName ? <Text style={styles.warning}>{item.actorName}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.stateText}>Nenhum historico registrado.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AdminAgendaLessonScreen({ client, lessonId, onBack }: Props) {
  const api = client ?? getMobileApi();
  const detail = useQuery({
    queryFn: () => api.getAdminAgendaLesson(lessonId),
    queryKey: ["admin-agenda-lesson", lessonId],
  });

  if (detail.isPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateCard}>
          <ActivityIndicator />
          <Text style={styles.stateText}>Carregando aula...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => void detail.refetch()} style={styles.stateCard}>
          <Text style={styles.stateTitle}>Aula indisponivel</Text>
          <Text style={styles.stateText}>Toque para tentar novamente.</Text>
        </Pressable>
      </SafeAreaView>
    );
  }
  return (
    <LessonEditor
      api={api}
      detail={detail.data}
      onBack={onBack}
    />
  );
}
