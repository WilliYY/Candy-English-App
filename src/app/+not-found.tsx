import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, typeScale } from "@/theme/tokens";

export default function NotFoundRoute() {
  return (
    <View style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>
        Essa área não foi encontrada.
      </Text>
      <Link href="/" style={styles.link}>
        Voltar ao Candy English
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "800",
    textAlign: "center",
  },
  link: {
    color: colors.focus,
    fontSize: typeScale.body,
    fontWeight: "800",
    marginTop: spacing.md,
  },
});
