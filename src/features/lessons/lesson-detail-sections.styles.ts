import { StyleSheet } from "react-native";

import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export const styles = StyleSheet.create({
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
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  term: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  translation: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  example: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 21,
  },
  homeworkTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  homeworkTitle: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  status: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  dueDate: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
  },
  open: {
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.68,
  },
});
