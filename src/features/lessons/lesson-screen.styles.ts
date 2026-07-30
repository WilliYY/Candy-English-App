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
  error: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  retry: {
    alignSelf: "flex-start",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900",
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
  metadata: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 25,
    marginTop: spacing.lg,
  },
  linkError: {
    color: colors.focus,
    fontSize: 14,
    fontWeight: "800",
    marginTop: spacing.md,
  },
});
