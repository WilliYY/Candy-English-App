import { Pressable, Text, View } from "react-native";

import { styles } from "@/features/notifications/notifications-screen.styles";
import type { MobileNotificationInbox } from "@/lib/api/mobile-api-client";

type NotificationItem = MobileNotificationInbox["items"][number];

const categoryLabels: Record<NotificationItem["type"], string> = {
  ACHIEVEMENT: "CONQUISTA",
  CLASS: "AULA",
  FEEDBACK: "CORREÇÃO",
  HOMEWORK: "TAREFA",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function NotificationCard({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (target: NotificationItem["target"]) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Abrir ${item.title}`}
      accessibilityRole="button"
      onPress={() => onOpen(item.target)}
      style={({ pressed }) => [
        styles.itemCard,
        pressed ? styles.itemCardPressed : null,
      ]}
    >
      <View style={styles.itemHeader}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>
            {categoryLabels[item.type]}
          </Text>
        </View>
        <Text style={styles.itemDate}>{formatDate(item.eventAt)}</Text>
      </View>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemSummary}>{item.summary}</Text>
      <Text style={styles.openHint}>Abrir no app →</Text>
    </Pressable>
  );
}
