import { StyleSheet } from "react-native";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  backText: {
    color: colors.brand,
    fontSize: 24,
    fontWeight: "700",
  },
  cattyAvatar: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  cattyAvatarText: {
    color: colors.brandDeep,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  headerCopy: {
    flex: 1,
    justifyContent: "center",
  },
  teacherToolsButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  teacherToolsText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    marginTop: 2,
  },
  content: {
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  introCard: {
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  introTitle: {
    color: colors.brandDeep,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  introText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  quickList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  quickButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  quickButtonText: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    maxWidth: "86%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  messageAuthor: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "800",
    marginBottom: spacing.xxs,
  },
  messageText: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 23,
  },
  messageTextMine: {
    color: colors.surface,
  },
  thinking: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  thinkingText: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
  loadingCard: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 240,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorCard: {
    alignItems: "center",
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.brandDeep,
    fontSize: 14,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.surface,
    fontWeight: "800",
  },
  composerWrap: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  composer: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: colors.energy,
    borderRadius: radii.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: colors.brandDeep,
    fontSize: 22,
    fontWeight: "900",
  },
  composerMeta: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  helperText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 11,
  },
  counter: {
    color: colors.textMuted,
    fontSize: 11,
  },
  sendError: {
    color: "#9A2634",
    fontSize: 13,
    fontWeight: "700",
  },
});
