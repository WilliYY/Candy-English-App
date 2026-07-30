import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MobileLesson } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type LessonMaterialListProps = {
  materials: MobileLesson["materials"];
  onOpenLink: (url: string) => void;
};

export function LessonMaterialList({
  materials,
  onOpenLink,
}: LessonMaterialListProps) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Materiais da aula
      </Text>

      {materials.length === 0 ? (
        <Text style={styles.empty}>Nenhum material foi adicionado.</Text>
      ) : (
        <View style={styles.list}>
          {materials.map((material) => {
            const linkUrl =
              material.type === "LINK" ? material.url : null;

            return (
              <View key={material.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>{material.title}</Text>
                  <Text style={styles.badge}>
                    {material.type === "TEXT" ? "TEXTO" : "LINK"}
                  </Text>
                </View>

                {material.content ? (
                  <Text selectable style={styles.content}>
                    {material.content}
                  </Text>
                ) : null}

                {linkUrl ? (
                  <Pressable
                    accessibilityHint="Abre no navegador externo"
                    accessibilityRole="link"
                    onPress={() => onOpenLink(linkUrl)}
                    style={({ pressed }) => [
                      styles.linkButton,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={styles.linkText}>Abrir material externo ↗</Text>
                  </Pressable>
                ) : null}

                {material.type === "LINK" && !linkUrl ? (
                  <Text accessibilityRole="alert" style={styles.unavailable}>
                    Link indisponível ou não seguro.
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
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
  empty: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  badge: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  content: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: "flex-start",
    borderColor: colors.brand,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.68,
  },
  unavailable: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "800",
  },
});
