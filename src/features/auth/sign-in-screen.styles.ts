import { StyleSheet } from "react-native";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    alignSelf: "center",
    flexGrow: 1,
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
  logo: {
    height: 52,
    marginTop: spacing.xl,
    width: 156,
  },
  heading: {
    marginTop: spacing.xl,
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
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.focus,
    borderWidth: 2,
  },
  errorText: {
    color: colors.focus,
    fontSize: 13,
    fontWeight: "700",
  },
  submitError: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  submitErrorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  submitButtonPressed: {
    backgroundColor: colors.brandDeep,
    transform: [{ scale: 0.99 }],
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  securityNote: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 18,
    marginTop: spacing.lg,
    textAlign: "center",
  },
});
