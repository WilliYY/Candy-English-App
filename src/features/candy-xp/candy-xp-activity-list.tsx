import { Pressable, Text, View } from "react-native";

import { styles } from "@/features/candy-xp/candy-xp-screen.styles";
import type { MobileStudentCandyXp } from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type Activity = MobileStudentCandyXp["activities"][number];

const statusMeta = {
  DRAFT: {
    backgroundColor: "#F3EAF5",
    color: colors.focus,
    label: "Em andamento",
  },
  RETURNED: {
    backgroundColor: colors.coral,
    color: colors.focus,
    label: "Refazer",
  },
  REVIEWED: {
    backgroundColor: "#E4F3ED",
    color: colors.success,
    label: "Concluída",
  },
  SUBMITTED: {
    backgroundColor: "#F3EAF5",
    color: colors.brand,
    label: "Em correção",
  },
} as const;

function getStatus(activity: Activity) {
  return activity.submission
    ? statusMeta[activity.submission.status]
    : {
        backgroundColor: colors.coral,
        color: colors.brand,
        label: "Nova missão",
      };
}

function getActivityMeta(activity: Activity) {
  const responseCount =
    activity.interactiveFieldCount + activity.questionCount;
  const parts = [
    activity.level || "Todos os níveis",
    activity.category || "Candy English",
  ];

  if (responseCount > 0) {
    parts.push(`${responseCount} ${responseCount === 1 ? "resposta" : "respostas"}`);
  }

  if (activity.assetKind) {
    const pages =
      activity.assetPageCount && activity.assetPageCount > 1
        ? ` · ${activity.assetPageCount} páginas`
        : "";
    parts.push(`${activity.assetKind === "IMAGE" ? "Imagem" : "PDF"}${pages}`);
  }

  return parts.join(" · ");
}

export function CandyXpActivityList({
  activities,
  onOpenActivity,
}: {
  activities: MobileStudentCandyXp["activities"];
  onOpenActivity: (activityId: string) => void;
}) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Missões disponíveis
        </Text>
        <Text style={styles.sectionDescription}>
          Acompanhe as atividades liberadas pela sua teacher e o status de cada
          missão.
        </Text>
      </View>

      {activities.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Nenhuma missão foi liberada agora. Puxe a tela para atualizar quando
            sua teacher publicar uma atividade.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {activities.map((activity) => {
            const status = getStatus(activity);

            return (
              <Pressable
                accessibilityLabel={`${activity.title}, ${status.label}, ${activity.xpReward} XP`}
                accessibilityHint="Abre os detalhes e respostas da missao"
                accessibilityRole="button"
                key={activity.id}
                onPress={() => onOpenActivity(activity.id)}
                style={styles.activityCard}
              >
                <View style={styles.activityTitleRow}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <View
                    style={[
                      styles.activityStatus,
                      { backgroundColor: status.backgroundColor },
                    ]}
                  >
                    <Text
                      style={[styles.activityStatusText, { color: status.color }]}
                    >
                      {status.label}
                    </Text>
                  </View>
                </View>

                {activity.description ? (
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                ) : null}

                <View style={styles.activityMetaRow}>
                  <Text style={styles.activityMeta}>
                    {getActivityMeta(activity)}
                  </Text>
                  <Text style={styles.activityXp}>+{activity.xpReward} XP</Text>
                </View>
                <Text style={styles.activityOpenText}>Abrir missao →</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
