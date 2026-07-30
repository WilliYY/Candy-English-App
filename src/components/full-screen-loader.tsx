import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typeScale } from "@/theme/tokens";

export function FullScreenLoader() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <ActivityIndicator color={colors.brand} size="large" />
        <Text style={styles.text}>Conectando ao Candy English...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  text: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    fontWeight: "700",
    textAlign: "center",
  },
});
