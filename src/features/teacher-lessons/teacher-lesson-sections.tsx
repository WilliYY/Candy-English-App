import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MobileTeacherLesson } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type TeacherLessonSectionsProps = Pick<
  MobileTeacherLesson,
  "homeworks" | "vocabularyItems"
> & {
  onCreateHomework?: () => void;
  onOpenHomework?: (homeworkId: string) => void;
};

const statusLabels: Record<
  MobileTeacherLesson["homeworks"][number]["status"],
  string
> = {
  ARCHIVED: "TAREFA ARQUIVADA",
  DRAFT: "TAREFA EM RASCUNHO",
  PUBLISHED: "TAREFA PUBLICADA",
};

function formatDueDate(value: string | null) {
  if (!value) {
    return "Sem prazo definido";
  }

  return `Prazo: ${new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(new Date(value))}`;
}

export function TeacherLessonSections({
  homeworks,
  onCreateHomework,
  onOpenHomework,
  vocabularyItems,
}: TeacherLessonSectionsProps) {
  return (
    <>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          Vocabulário planejado
        </Text>
        {vocabularyItems.length === 0 ? (
          <Text style={styles.empty}>Nenhum vocabulário foi adicionado.</Text>
        ) : (
          <View style={styles.list}>
            {vocabularyItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text selectable style={styles.cardTitle}>
                  {item.term}
                </Text>
                <Text selectable style={styles.translation}>
                  {item.translation}
                </Text>
                {item.example ? (
                  <Text selectable style={styles.detail}>
                    Exemplo: {item.example}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.headingRow}>
          <Text accessibilityRole="header" style={styles.heading}>
            Tarefas vinculadas
          </Text>
          {onCreateHomework ? (
            <Pressable
              accessibilityRole="button"
              onPress={onCreateHomework}
              style={styles.action}
            >
              <Text style={styles.actionText}>+ Nova tarefa</Text>
            </Pressable>
          ) : null}
        </View>
        {homeworks.length === 0 ? (
          <Text style={styles.empty}>Nenhuma tarefa foi vinculada.</Text>
        ) : (
          <View style={styles.list}>
            {homeworks.map((homework) => (
              <Pressable
                accessibilityRole={onOpenHomework ? "button" : undefined}
                disabled={!onOpenHomework}
                key={homework.id}
                onPress={() => onOpenHomework?.(homework.id)}
                style={({ pressed }) => [
                  styles.card,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{homework.title}</Text>
                  <Text style={styles.badge}>{statusLabels[homework.status]}</Text>
                </View>
                <Text style={styles.detail}>
                  {formatDueDate(homework.dueDate)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  heading: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  headingRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  action: {
    alignItems: "center",
    borderColor: colors.brand,
    borderRadius: radii.sm,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "900",
  },
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.brandDeep,
    flexShrink: 1,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  translation: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800",
  },
  detail: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  badge: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.brandDeep,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  pressed: {
    opacity: 0.7,
  },
});
