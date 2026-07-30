import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export default function SignInRoute() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Pressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <View style={styles.message}>
          <Text style={styles.eyebrow}>ACESSO CANDY ENGLISH</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Entre na sua conta
          </Text>
          <Text style={styles.description}>
            A conexão segura com o mesmo cadastro do site será ativada na
            próxima etapa.
          </Text>
        </View>

        <View accessibilityRole="summary" style={styles.notice}>
          <Text style={styles.noticeTitle}>Sua conta será a mesma</Text>
          <Text style={styles.noticeText}>
            Nenhum novo cadastro e nenhuma senha duplicada.
          </Text>
        </View>
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
    alignSelf: "center",
    flex: 1,
    maxWidth: 520,
    padding: spacing.lg,
    width: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "800",
  },
  message: {
    marginTop: spacing.xxl,
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.lead,
    lineHeight: 27,
    marginTop: spacing.md,
  },
  notice: {
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
});
