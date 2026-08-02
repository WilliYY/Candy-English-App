import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
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
  AdminCandyXpInput,
  MobileAdminCandyXpActivity,
} from "@/lib/api/admin-candy-xp-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<ReturnType<typeof getMobileApi>, "getAdminCandyXp">;
type Props = {
  client?: Client;
  onBack: () => void;
  onOpenActivity?: (activityId: string) => void;
};

const statusFilters: { label: string; value: NonNullable<AdminCandyXpInput["status"]> }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Publicadas", value: "PUBLISHED" },
  { label: "Rascunhos", value: "DRAFT" },
  { label: "Arquivadas", value: "ARCHIVED" },
];
const statusLabels = {
  ARCHIVED: "Arquivada",
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
} as const;

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível carregar o Candy XP.";
}

function ActivityCard({
  activity,
  onOpen,
}: {
  activity: MobileAdminCandyXpActivity;
  onOpen?: () => void;
}) {
  const content = (
    <>
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{activity.title}</Text>
          <Text style={styles.cardMeta}>{activity.category} · {activity.level}</Text>
        </View>
        <View
          style={[
            styles.badge,
            activity.status === "PUBLISHED"
              ? styles.badgePublished
              : activity.status === "DRAFT"
                ? styles.badgeDraft
                : styles.badgeArchived,
          ]}
        >
          <Text style={styles.badgeText}>{statusLabels[activity.status]}</Text>
        </View>
      </View>
      {activity.description ? <Text style={styles.cardText}>{activity.description}</Text> : null}
      <Text style={styles.cardMeta}>
        {activity.xpReward} XP · {activity.submissionCount} entregas · {activity.release.mode === "ALL" ? "Todos os alunos" : activity.release.students.map((student) => student.name).join(", ")}
      </Text>
    </>
  );
  if (!onOpen) return <View style={styles.card}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={`Abrir atividade ${activity.title}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      {content}
    </Pressable>
  );
}

export function AdminCandyXpScreen({ client, onBack, onOpenActivity }: Props) {
  const api = client ?? getMobileApi();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] = useState<NonNullable<AdminCandyXpInput["status"]>>("ALL");
  const [cursor, setCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<(string | undefined)[]>([]);
  const candyXp = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => api.getAdminCandyXp({ cursor, limit: 20, query: appliedQuery || undefined, status }),
    queryKey: ["admin-candy-xp", cursor, appliedQuery, status],
    refetchInterval: 15_000,
  });

  function applySearch() {
    setCursor(undefined);
    setHistory([]);
    setAppliedQuery(query.trim());
  }

  function selectStatus(value: NonNullable<AdminCandyXpInput["status"]>) {
    setCursor(undefined);
    setHistory([]);
    setStatus(value);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => void candyXp.refetch()}
            refreshing={candyXp.isRefetching}
          />
        }
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · PEDAGÓGICO</Text>
        <Text accessibilityRole="header" style={styles.title}>Candy XP</Text>
        <Text style={styles.subtitle}>Atividades, liberações, correções e indicadores sincronizados com o site.</Text>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Buscar atividade Candy XP"
            onChangeText={setQuery}
            onSubmitEditing={applySearch}
            placeholder="Buscar atividade"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
          <Pressable accessibilityRole="button" onPress={applySearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>
        <View style={styles.chips}>
          {statusFilters.map((filter) => (
            <Pressable
              accessibilityLabel={`Filtrar ${filter.label}`}
              accessibilityRole="button"
              key={filter.value}
              onPress={() => selectStatus(filter.value)}
              style={[styles.chip, status === filter.value ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, status === filter.value ? styles.chipTextSelected : null]}>{filter.label}</Text>
            </Pressable>
          ))}
        </View>

        {candyXp.isPending ? (
          <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando Candy XP...</Text></View>
        ) : candyXp.isError ? (
          <Pressable accessibilityRole="button" onPress={() => void candyXp.refetch()} style={styles.stateCard}>
            <Text style={styles.errorText}>{messageFrom(candyXp.error)}</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : candyXp.data ? (
          <>
            <Text style={styles.sectionTitle}>Indicadores</Text>
            <View style={styles.summaryGrid}>
              {[
                ["Atividades", candyXp.data.summary.total],
                ["Publicadas", candyXp.data.summary.published],
                ["Rascunhos", candyXp.data.summary.draft],
                ["Correções pendentes", candyXp.data.summary.pendingReviews],
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{value}</Text>
                  <Text style={styles.summaryLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Ranking privado</Text>
            <Text style={styles.sectionHint}>Somente nome, posição, nível e XP. Dados pessoais não saem do servidor.</Text>
            <View style={styles.card}>
              {candyXp.data.ranking.topEntries.length ? candyXp.data.ranking.topEntries.map((entry) => (
                <View key={`${entry.position}-${entry.name}`} style={styles.rankingRow}>
                  <Text style={styles.rankingPosition}>#{entry.position}</Text>
                  <Text style={styles.rankingName}>{entry.name} · Nível {entry.level}</Text>
                  <Text style={styles.rankingXp}>{entry.totalXp} XP</Text>
                </View>
              )) : <Text style={styles.stateText}>Ranking ainda sem participantes.</Text>}
            </View>

            <Text style={styles.sectionTitle}>Atividades</Text>
            {candyXp.data.activities.length ? candyXp.data.activities.map((activity) => (
              <ActivityCard
                activity={activity}
                key={activity.id}
                onOpen={onOpenActivity ? () => onOpenActivity(activity.id) : undefined}
              />
            )) : <View style={styles.stateCard}><Text style={styles.stateText}>Nenhuma atividade encontrada.</Text></View>}

            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                disabled={!history.length}
                onPress={() => {
                  const previous = history.at(-1);
                  setHistory((items) => items.slice(0, -1));
                  setCursor(previous);
                }}
                style={[styles.secondaryButton, !history.length ? styles.buttonDisabled : null]}
              >
                <Text style={styles.secondaryButtonText}>Anterior</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!candyXp.data.hasMore || !candyXp.data.nextCursor}
                onPress={() => {
                  setHistory((items) => [...items, cursor]);
                  setCursor(candyXp.data.nextCursor ?? undefined);
                }}
                style={[styles.secondaryButton, !candyXp.data.hasMore ? styles.buttonDisabled : null]}
              >
                <Text style={styles.secondaryButtonText}>Próxima</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
