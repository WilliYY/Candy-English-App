import { StyleSheet } from "react-native";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: 720,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  back: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  loading: {
    marginTop: spacing.xxl,
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: spacing.xl,
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  fileName: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  metadata: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  security: {
    color: colors.focus,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  message: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.md,
  },
  error: {
    color: colors.focus,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.md,
  },
  retry: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
  },
});
