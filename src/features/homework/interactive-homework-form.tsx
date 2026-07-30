import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { InteractiveDrawingField } from "@/features/homework/interactive-drawing-field";
import { InteractiveListeningField } from "@/features/homework/interactive-listening-field";
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileHomework,
  MobileInteractiveAnswer,
} from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type InteractiveHomeworkFormProps = {
  homework: MobileHomework;
};

function valuesFromAnswers(answers: MobileInteractiveAnswer[]) {
  return Object.fromEntries(
    answers.map((answer) => [answer.fieldId, answer.value]),
  );
}

function hasDrawing(value: string) {
  try {
    const parsed = JSON.parse(value) as { strokes?: unknown };
    return (
      Array.isArray(parsed.strokes) &&
      parsed.strokes.some(
        (stroke) => Array.isArray(stroke) && stroke.length > 0,
      )
    );
  } catch {
    return false;
  }
}

function normalizeTinyText(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 2);
}

function missingRequiredField(
  homework: MobileHomework,
  values: Record<string, string>,
) {
  return homework.interactiveFields.find((field) => {
    if (!field.required || field.type === "LISTENING") {
      return false;
    }

    const value = values[field.id] ?? "";

    if (field.type === "CHECKBOX") {
      return value !== "true";
    }

    if (field.type === "DRAWING") {
      return !hasDrawing(value);
    }

    return !value.trim();
  });
}

export function InteractiveHomeworkForm({
  homework,
}: InteractiveHomeworkFormProps) {
  const queryClient = useQueryClient();
  const serverValues = useMemo(
    () => valuesFromAnswers(homework.interactiveAnswers),
    [homework.interactiveAnswers],
  );
  const [draft, setDraft] = useState<{
    homeworkId: string;
    values: Record<string, string>;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const values =
    homework.canSubmit && draft?.homeworkId === homework.id
      ? draft.values
      : serverValues;

  function buildPayload(source: Record<string, string>) {
    return homework.interactiveFields.map((field) => ({
      fieldId: field.id,
      value: source[field.id] ?? "",
    }));
  }

  const saveDraft = useMutation({
    mutationFn: (answers: MobileInteractiveAnswer[]) =>
      getMobileApi().saveInteractiveHomeworkDraft(homework.id, answers),
    onSuccess: async (result) => {
      setDirty(false);
      setMessage(result.message);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["homework", homework.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["mobile-module", "homeworks"],
        }),
      ]);
    },
  });
  const submit = useMutation({
    mutationFn: (answers: MobileInteractiveAnswer[]) =>
      getMobileApi().submitInteractiveHomework(homework.id, answers),
    onSuccess: async (result) => {
      setDirty(false);
      setMessage(result.message);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["homework", homework.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["mobile-module", "homeworks"],
        }),
        queryClient.invalidateQueries({ queryKey: ["mobile-overview"] }),
      ]);
    },
  });

  function updateValue(fieldId: string, value: string) {
    setDraft({
      homeworkId: homework.id,
      values: { ...values, [fieldId]: value },
    });
    setDirty(true);
    setMessage("");
    saveDraft.reset();
    submit.reset();
  }

  function confirmSubmit() {
    const missing = missingRequiredField(homework, values);

    if (missing) {
      setMessage(
        `Preencha o campo obrigatório: ${missing.label ?? "atividade"}.`,
      );
      return;
    }

    Alert.alert(
      "Entregar atividade?",
      "Depois do envio, a atividade ficará bloqueada para correção.",
      [
        { style: "cancel", text: "Continuar editando" },
        {
          onPress: () => submit.mutate(buildPayload(values)),
          text: "Entregar agora",
        },
      ],
    );
  }

  const busy = saveDraft.isPending || submit.isPending;
  const actionError = saveDraft.error ?? submit.error;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>ATIVIDADE INTERATIVA</Text>
          <Text style={styles.title}>Complete os campos</Text>
        </View>
        {dirty ? <Text style={styles.dirty}>Não salvo</Text> : null}
      </View>

      <View style={styles.fields}>
        {homework.interactiveFields.map((field, index) => {
          const label = `${field.label ?? `Campo ${index + 1}`}${
            field.required ? " *" : ""
          }`;
          const value = values[field.id] ?? "";

          if (field.type === "CHECKBOX") {
            const checked = value === "true";

            return (
              <Pressable
                accessibilityLabel={label}
                accessibilityRole="checkbox"
                accessibilityState={{
                  checked,
                  disabled: !homework.canSubmit || busy,
                }}
                disabled={!homework.canSubmit || busy}
                key={field.id}
                onPress={() => updateValue(field.id, checked ? "false" : "true")}
                style={[
                  styles.checkboxField,
                  !homework.canSubmit ? styles.disabled : null,
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    checked ? styles.checkboxChecked : null,
                  ]}
                >
                  {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.checkboxLabel}>{label}</Text>
              </Pressable>
            );
          }

          if (field.type === "DRAWING") {
            return (
              <InteractiveDrawingField
                disabled={!homework.canSubmit || busy}
                key={field.id}
                label={label}
                onChange={(next) => updateValue(field.id, next)}
                value={value}
              />
            );
          }

          if (field.type === "LISTENING") {
            return (
              <InteractiveListeningField
                fieldId={field.id}
                homeworkId={homework.id}
                key={field.id}
                label={label}
              />
            );
          }

          const tiny = field.type === "TINY_TEXT";
          const long = field.type === "LONG_TEXT";

          return (
            <View key={field.id} style={styles.textField}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                accessibilityLabel={label}
                autoCapitalize={tiny ? "characters" : "sentences"}
                editable={homework.canSubmit && !busy}
                maxLength={tiny ? 2 : 50_000}
                multiline={long}
                onChangeText={(next) =>
                  updateValue(
                    field.id,
                    tiny ? normalizeTinyText(next) : next,
                  )
                }
                placeholder={field.placeholder ?? "Digite sua resposta"}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  long ? styles.longInput : null,
                  tiny ? styles.tinyInput : null,
                  !homework.canSubmit ? styles.disabled : null,
                ]}
                textAlignVertical={long ? "top" : "center"}
                value={value}
              />
            </View>
          );
        })}
      </View>

      {actionError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError instanceof Error
            ? actionError.message
            : "Não foi possível atualizar a atividade."}
        </Text>
      ) : null}

      {message ? (
        <Text accessibilityRole="alert" style={styles.message}>
          {message}
        </Text>
      ) : null}

      {!homework.canSubmit ? (
        <Text style={styles.locked}>
          Atividade entregue. Aguarde a correção do teacher.
        </Text>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !dirty || busy }}
            disabled={!dirty || busy}
            onPress={() => saveDraft.mutate(buildPayload(values))}
            style={[
              styles.secondaryButton,
              !dirty || busy ? styles.buttonDisabled : null,
            ]}
          >
            {saveDraft.isPending ? (
              <ActivityIndicator color={colors.brand} />
            ) : (
              <Text style={styles.secondaryText}>Salvar rascunho</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={confirmSubmit}
            style={[
              styles.primaryButton,
              busy ? styles.buttonDisabled : null,
            ]}
          >
            {submit.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryText}>Entregar atividade</Text>
            )}
          </Pressable>
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
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
    marginTop: spacing.xxs,
  },
  dirty: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  fields: {
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  textField: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  longInput: {
    minHeight: 140,
  },
  tinyInput: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
    maxWidth: 110,
    textAlign: "center",
  },
  disabled: {
    backgroundColor: colors.background,
    opacity: 0.72,
  },
  checkboxField: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.md,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.brand,
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.brand,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  checkboxLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: "800",
  },
  error: {
    color: colors.focus,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
    marginTop: spacing.md,
  },
  message: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: spacing.md,
  },
  locked: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  buttonDisabled: {
    borderColor: colors.border,
    opacity: 0.5,
  },
});
