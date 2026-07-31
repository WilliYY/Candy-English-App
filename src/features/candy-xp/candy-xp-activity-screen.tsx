import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CandyXpAnswerForm,
  type CandyXpActivityMutationClient,
} from "@/features/candy-xp/candy-xp-answer-form";
import { styles } from "@/features/candy-xp/candy-xp-activity-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileCandyXpActivity } from "@/lib/api/mobile-api-client";
import {
  cacheProtectedLearningAsset,
  ProtectedLearningAssetError,
} from "@/lib/files/protected-learning-asset-cache";
import { colors } from "@/theme/tokens";

type CandyXpActivityClient = CandyXpActivityMutationClient & {
  getCandyXpAssetSource: (activityId: string) => Promise<{
    headers: Record<string, string>;
    uri: string;
  }>;
  getStudentCandyXpActivity: (
    activityId: string,
  ) => Promise<MobileCandyXpActivity>;
};

type CandyXpActivityScreenProps = {
  activityId: string;
  client?: CandyXpActivityClient;
  onBack: () => void;
};

const statusLabels = {
  DRAFT: "Rascunho",
  RETURNED: "Revise e tente novamente",
  REVIEWED: "Missao concluida",
  SUBMITTED: "Aguardando correcao",
} as const;

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CandyXpActivityScreen({
  activityId,
  client,
  onBack,
}: CandyXpActivityScreenProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const activityQuery = useQuery({
    queryFn: () => api.getStudentCandyXpActivity(activityId),
    queryKey: ["candy-xp-activity", activityId],
  });
  const [assetFeedback, setAssetFeedback] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const activity = activityQuery.data;

  async function downloadAndOpenAsset() {
    if (!activity?.asset) {
      return;
    }

    setAssetFeedback("");
    setDownloadProgress(0);
    setIsDownloading(true);

    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new ProtectedLearningAssetError(
          "Este aparelho nao oferece um aplicativo para abrir o material.",
        );
      }

      const source = await api.getCandyXpAssetSource(activity.id);
      const uri = await cacheProtectedLearningAsset({
        assetId: activity.id,
        fileName: activity.asset.fileName,
        mimeType: activity.asset.mimeType,
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) {
            setDownloadProgress(bytesWritten / totalBytes);
          }
        },
        sizeBytes: activity.asset.sizeBytes,
        source,
      });

      await Sharing.shareAsync(uri, {
        dialogTitle: activity.title,
        mimeType: activity.asset.mimeType,
        ...(activity.asset.kind === "PDF"
          ? { UTI: "com.adobe.pdf" }
          : {}),
      });
      setAssetFeedback("Material baixado com seguranca e pronto para abrir.");
    } catch (error) {
      setAssetFeedback(
        error instanceof ProtectedLearningAssetError
          ? error.message
          : "Nao foi possivel abrir este material agora.",
      );
    } finally {
      setDownloadProgress(null);
      setIsDownloading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void activityQuery.refetch()}
            refreshing={activityQuery.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <Pressable
          accessibilityLabel="Voltar para Candy XP"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        {activityQuery.isPending ? (
          <View
            accessibilityLabel="Carregando missao Candy XP"
            accessible
            style={styles.loadingCard}
          >
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.loadingText}>Preparando sua missao...</Text>
          </View>
        ) : null}

        {activityQuery.isError ? (
          <View accessibilityRole="alert" style={styles.loadingCard}>
            <Text style={styles.errorText}>
              {activityQuery.error instanceof Error
                ? activityQuery.error.message
                : "Nao foi possivel carregar esta atividade."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void activityQuery.refetch()}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {activity ? (
          <>
            <View style={styles.header}>
              <Text style={styles.category}>
                {activity.category || "CANDY XP"}
              </Text>
              <Text accessibilityRole="header" style={styles.headerTitle}>
                {activity.title}
              </Text>
              {activity.description ? (
                <Text style={styles.headerDescription}>
                  {activity.description}
                </Text>
              ) : null}
              <View style={styles.headerBadges}>
                <Text style={styles.headerPill}>
                  {activity.level || "Todos os niveis"}
                </Text>
                <Text style={styles.statusBadge}>
                  {activity.submission
                    ? statusLabels[activity.submission.status]
                    : "Nova missao"}
                </Text>
              </View>
            </View>

            <View style={styles.hero}>
              <View pointerEvents="none" style={styles.heroAccent} />
              <Text style={styles.heroXp}>+{activity.xpReward} XP</Text>
              <Text style={styles.heroCaption}>
                Responda com calma. Missoes objetivas podem liberar o XP na
                hora; textos seguem para correcao.
              </Text>
            </View>

            {activity.asset ? (
              <View style={styles.assetCard}>
                <Text style={styles.assetMeta}>
                  {activity.asset.kind === "PDF" ? "PDF" : "IMAGEM"} ·{" "}
                  {formatBytes(activity.asset.sizeBytes)}
                  {activity.asset.pageCount > 1
                    ? ` · ${activity.asset.pageCount} paginas`
                    : ""}
                </Text>
                <Text selectable style={styles.assetName}>
                  {activity.asset.fileName}
                </Text>
                <Text style={styles.assetDescription}>
                  O arquivo usa sua sessao e fica somente no cache temporario do
                  aplicativo.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isDownloading }}
                  disabled={isDownloading}
                  onPress={() => void downloadAndOpenAsset()}
                  style={[
                    styles.assetButton,
                    isDownloading ? styles.assetButtonDisabled : null,
                  ]}
                >
                  {isDownloading ? (
                    <View style={styles.assetButtonBusy}>
                      <ActivityIndicator color={colors.brand} />
                      <Text style={styles.assetButtonText}>
                        Baixando {Math.round((downloadProgress ?? 0) * 100)}%
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.assetButtonText}>
                      Baixar e abrir material
                    </Text>
                  )}
                </Pressable>
                {assetFeedback ? (
                  <Text accessibilityRole="alert" style={styles.assetDescription}>
                    {assetFeedback}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <CandyXpAnswerForm activity={activity} client={api} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
