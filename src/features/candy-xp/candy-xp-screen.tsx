import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CandyXpActivityList } from "@/features/candy-xp/candy-xp-activity-list";
import { CandyXpRankingList } from "@/features/candy-xp/candy-xp-ranking-list";
import { styles } from "@/features/candy-xp/candy-xp-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileStudentCandyXp } from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type CandyXpClient = {
  getStudentCandyXp: () => Promise<MobileStudentCandyXp>;
};

type CandyXpScreenProps = {
  client?: CandyXpClient;
  onBack: () => void;
  onOpenActivity?: (activityId: string) => void;
};

function formatEventDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View accessibilityLabel={`${label}: ${value}`} accessible style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function CandyXpScreen({
  client,
  onBack,
  onOpenActivity = () => undefined,
}: CandyXpScreenProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const candyXp = useQuery({
    queryFn: () => api.getStudentCandyXp(),
    queryKey: ["student-candy-xp"],
  });
  const data = candyXp.data;
  const progressPercent = data
    ? Math.min(100, Math.max(0, Math.round(data.profile.progressPercent)))
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void candyXp.refetch()}
            refreshing={candyXp.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <View>
          <Pressable
            accessibilityLabel="Voltar para o início"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>

          <Text style={styles.headerEyebrow}>MINHA JORNADA</Text>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Candy XP
          </Text>
          <Text style={styles.headerDescription}>
            Acompanhe seu nível, sequência, conquistas e missões em um só lugar.
          </Text>
        </View>

        {candyXp.isPending ? (
          <View
            accessibilityLabel="Carregando Candy XP"
            accessible
            style={styles.statusCard}
          >
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.statusText}>
              Preparando sua jornada Candy…
            </Text>
          </View>
        ) : null}

        {candyXp.isError ? (
          <View accessibilityRole="alert" style={styles.statusCard}>
            <Text style={styles.statusText}>
              {candyXp.error instanceof Error
                ? candyXp.error.message
                : "Não foi possível carregar o Candy XP agora."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void candyXp.refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {data ? (
          <>
            <View style={styles.hero}>
              <View pointerEvents="none" style={styles.heroAccent} />
              <Text style={styles.heroLevel}>NÍVEL {data.profile.level}</Text>
              <Text style={styles.heroTotal}>{data.profile.totalXp} XP</Text>
              <Text style={styles.heroCaption}>
                Faltam {data.profile.xpToNextLevel} XP para o próximo nível.
              </Text>
              <View
                accessibilityLabel={`Progresso do nível: ${progressPercent}%`}
                accessibilityRole="progressbar"
                accessibilityValue={{
                  max: 100,
                  min: 0,
                  now: progressPercent,
                }}
                style={styles.heroProgress}
              >
                <View
                  style={[
                    styles.heroProgressFill,
                    { width: `${progressPercent}%` as `${number}%` },
                  ]}
                />
              </View>
              <View style={styles.heroProgressRow}>
                <Text style={styles.heroProgressText}>
                  {data.profile.progressXp} XP
                </Text>
                <Text style={styles.heroProgressText}>
                  {data.profile.requiredXp} XP
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Sequência atual"
                value={`${data.profile.streakDays}d`}
              />
              <MetricCard
                label="Melhor sequência"
                value={`${data.profile.longestStreakDays}d`}
              />
              <MetricCard
                label="Conquistas"
                value={String(data.profile.badgeCount)}
              />
            </View>

            <CandyXpActivityList
              activities={data.activities}
              onOpenActivity={onOpenActivity}
            />
            <CandyXpRankingList ranking={data.ranking} />

            {data.sources.length > 0 ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    De onde vem seu XP
                  </Text>
                  <Text style={styles.sectionDescription}>
                    Cada atividade aparece uma vez no seu histórico.
                  </Text>
                </View>
                <View style={styles.list}>
                  {data.sources.map((source) => (
                    <View key={source.label} style={styles.sourceCard}>
                      <Text style={styles.sourceLabel}>
                        {source.label} · {source.value}
                      </Text>
                      <Text style={styles.sourceValue}>{source.xp} XP</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {data.recentEvents.length > 0 ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    XP recente
                  </Text>
                  <Text style={styles.sectionDescription}>
                    Suas últimas conquistas sincronizadas com o site.
                  </Text>
                </View>
                {data.recentEvents.map((event, index) => (
                  <View
                    key={`${event.occurredAt}-${event.sourceLabel}-${index}`}
                    style={styles.eventCard}
                  >
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventLabel}>{event.sourceLabel}</Text>
                      <Text style={styles.eventDate}>
                        {formatEventDate(event.occurredAt)}
                      </Text>
                    </View>
                    <Text style={styles.eventXp}>+{event.xp} XP</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
