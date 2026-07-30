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
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  backText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: spacing.md,
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  statusCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.xl,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 23,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  avatarCard: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  avatar: {
    borderRadius: 58,
    height: 116,
    width: 116,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.brand,
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: "900",
  },
  avatarButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  avatarButtonPressed: {
    opacity: 0.72,
  },
  avatarButtonText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    lineHeight: 18,
    textAlign: "center",
  },
  readonlyRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xxs,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  readonlyLabel: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  readonlyValue: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "700",
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.brandDeep,
    fontSize: typeScale.lead,
    fontWeight: "900",
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
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    minHeight: 112,
  },
  inputError: {
    borderColor: "#B84963",
  },
  errorText: {
    color: "#9E2F4B",
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
  notice: {
    backgroundColor: "#E8F5EF",
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noticeError: {
    backgroundColor: "#FCE8ED",
  },
  noticeText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  noticeErrorText: {
    color: "#9E2F4B",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  saveButtonPressed: {
    opacity: 0.78,
  },
  saveButtonText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
});
