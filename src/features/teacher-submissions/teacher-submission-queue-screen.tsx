import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileTeacherSubmissionQueueItem } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type Props = {
  onBack: () => void;
  onOpenSubmission: (submissionId: string) => void;
};

type Filter = "ALL" | "RETURNED" | "REVIEWED" | "SUBMITTED";

const filters: { label: string; value: Filter }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Pendentes", value: "SUBMITTED" },
  { label: "Corrigidas", value: "REVIEWED" },
  { label: "Nova tentativa", value: "RETURNED" },
];

const statusLabels = {
  RETURNED: "NOVA TENTATIVA",
  REVIEWED: "CORRIGIDA",
  SUBMITTED: "AGUARDANDO",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function SubmissionCard({
  item,
  onOpen,
}: {
  item: MobileTeacherSubmissionQueueItem;
  onOpen: () => void;
}) {
  return (
    <Pressable
      accessibilityHint="Abre as respostas e os controles de feedback"
      accessibilityLabel={`Corrigir ${item.homeworkTitle}, entrega de ${item.studentName}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeading}>
          <Text numberOfLines={1} style={styles.studentName}>
            {item.studentName}
          </Text>
          <Text style={styles.level}>{item.studentLevel ?? "Nível não informado"}</Text>
        </View>
        <Text style={[styles.status, styles[`status${item.status}`]]}>
          {statusLabels[item.status]}
        </Text>
      </View>
      <Text style={styles.homeworkTitle}>{item.homeworkTitle}</Text>
      <Text style={styles.meta}>{item.lessonTitle}</Text>
      <Text style={styles.meta}>Enviada em {formatDate(item.submittedAt)}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.kind}>
          {item.homeworkKind === "TEXT" ? "TEXTO" : "ATIVIDADE INTERATIVA"}
        </Text>
        <Text style={styles.openLabel}>Abrir correção →</Text>
      </View>
    </Pressable>
  );
}

export function TeacherSubmissionQueueScreen({
  onBack,
  onOpenSubmission,
}: Props) {
  const [filter, setFilter] = useState<Filter>("SUBMITTED");
  const queueQuery = useQuery({
    queryFn: () => getMobileApi().getTeacherSubmissions(),
    queryKey: ["teacher-submissions"],
  });
  const submissions =
    queueQuery.data?.submissions.filter(
      (submission) => filter === "ALL" || submission.status === filter,
    ) ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void queueQuery.refetch()}
            refreshing={queueQuery.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <Pressable
          accessibilityLabel="Voltar ao início"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>← Início</Text>
        </Pressable>

        <Text style={styles.eyebrow}>CORREÇÕES SINCRONIZADAS</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Entregas dos alunos
        </Text>
        <Text style={styles.subtitle}>
          Abra uma resposta, envie feedback ou libere uma nova tentativa. O site e o app usam o mesmo histórico.
        </Text>

        <ScrollView
          accessibilityLabel="Filtros de correção"
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((option) => {
            const selected = option.value === filter;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={[styles.filter, selected && styles.filterSelected]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {queueQuery.isPending ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.stateText}>Carregando entregas...</Text>
          </View>
        ) : queueQuery.isError ? (
          <View style={styles.state}>
            <Text accessibilityRole="alert" style={styles.errorText}>
              {queueQuery.error.message || "Não foi possível carregar as entregas."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void queueQuery.refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : submissions.length === 0 ? (
          <View style={styles.state}>
            <Text style={styles.emptyTitle}>Tudo em dia por aqui</Text>
            <Text style={styles.stateText}>
              Não há entregas neste filtro. Puxe a tela para atualizar.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {submissions.map((submission) => (
              <SubmissionCard
                item={submission}
                key={submission.id}
                onOpen={() => onOpenSubmission(submission.id)}
              />
            ))}
          </View>
        )}

        {queueQuery.data?.hasMore ? (
          <Text style={styles.limitNotice}>
            Existem mais entregas no site. Corrija as primeiras para manter a fila leve no celular.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  backText: { color: colors.brand, fontSize: typeScale.body, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  cardHeader: { flexDirection: "row", gap: spacing.sm, justifyContent: "space-between" },
  cardHeading: { flex: 1 },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 760,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  emptyTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "800" },
  errorText: { color: "#A43D55", fontSize: typeScale.body, textAlign: "center" },
  eyebrow: { color: colors.focus, fontSize: typeScale.caption, fontWeight: "800", letterSpacing: 1.4 },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { color: colors.textMuted, fontWeight: "700" },
  filterTextSelected: { color: colors.surface },
  filters: { gap: spacing.xs, paddingVertical: spacing.xxs },
  homeworkTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "800" },
  kind: { color: colors.focus, fontSize: typeScale.caption, fontWeight: "800" },
  level: { color: colors.textMuted, fontSize: typeScale.caption, marginTop: spacing.xxs },
  limitNotice: { color: colors.textMuted, fontSize: typeScale.caption, textAlign: "center" },
  list: { gap: spacing.sm },
  meta: { color: colors.textMuted, fontSize: typeScale.caption },
  openLabel: { color: colors.brand, fontWeight: "800" },
  pressed: { opacity: 0.72 },
  retryButton: {
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: { color: colors.surface, fontWeight: "800" },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  state: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  stateText: { color: colors.textMuted, fontSize: typeScale.body, textAlign: "center" },
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
  statusSUBMITTED: { backgroundColor: "#F4E5F3", color: colors.focus },
  studentName: { color: colors.text, fontSize: typeScale.body, fontWeight: "800" },
  subtitle: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 24 },
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: "900", lineHeight: 42 },
});
