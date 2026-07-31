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
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileCandyXpActivity,
  MobileCandyXpAnswer,
} from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

export type CandyXpActivityMutationClient = {
  saveCandyXpActivityDraft: (
    activityId: string,
    answers: MobileCandyXpAnswer[],
  ) => Promise<{ message: string }>;
  submitCandyXpActivity: (
    activityId: string,
    answers: MobileCandyXpAnswer[],
  ) => Promise<{ message: string }>;
};

type CandyXpAnswerFormProps = {
  activity: MobileCandyXpActivity;
  client?: CandyXpActivityMutationClient;
};

function valuesFromAnswers(answers: MobileCandyXpAnswer[]) {
  return Object.fromEntries(
    answers.map((answer) => [answer.questionId, answer.value]),
  );
}

function parseSelectedArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseMatchingValue(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (typeof parsed !== "object" || parsed === null) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  } catch {
    return {};
  }
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

function getMissingRequired(
  activity: MobileCandyXpActivity,
  values: Record<string, string>,
) {
  for (const question of activity.questions) {
    if (!question.required) {
      continue;
    }

    const value = values[question.id] ?? "";
    const missing =
      question.type === "CHECKBOX"
        ? parseSelectedArray(value).length === 0
        : question.type === "MATCHING"
          ? Object.keys(parseMatchingValue(value)).length === 0
          : !value.trim();

    if (missing) {
      return question.prompt;
    }
  }

  for (const [index, field] of activity.interactiveFields.entries()) {
    if (!field.required) {
      continue;
    }

    const value = values[field.id] ?? "";
    const missing =
      field.type === "CHECKBOX"
        ? value !== "true"
        : field.type === "DRAWING"
          ? !hasDrawing(value)
          : !value.trim();

    if (missing) {
      return field.label ?? `Campo ${index + 1}`;
    }
  }

  return null;
}

function Choice({
  checked,
  disabled,
  label,
  onPress,
  role,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onPress: () => void;
  role: "checkbox" | "radio";
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={role}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.choice,
        checked ? styles.choiceSelected : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <View
        style={[
          role === "radio" ? styles.radio : styles.checkbox,
          checked ? styles.choiceMarkSelected : null,
        ]}
      >
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.choiceLabel}>{label}</Text>
    </Pressable>
  );
}

export function CandyXpAnswerForm({
  activity,
  client,
}: CandyXpAnswerFormProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const queryClient = useQueryClient();
  const serverValues = useMemo(
    () => valuesFromAnswers(activity.submission?.answers ?? []),
    [activity.submission?.answers],
  );
  const [draft, setDraft] = useState<{
    activityId: string;
    values: Record<string, string>;
  } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const values =
    activity.canSubmit && draft?.activityId === activity.id
      ? draft.values
      : serverValues;

  function buildPayload(source: Record<string, string>) {
    return [
      ...activity.questions.map((question) => ({
        questionId: question.id,
        value: source[question.id] ?? "",
      })),
      ...activity.interactiveFields.map((field) => ({
        questionId: field.id,
        value: source[field.id] ?? "",
      })),
    ];
  }

  async function refreshQueries() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["candy-xp-activity", activity.id],
      }),
      queryClient.invalidateQueries({ queryKey: ["student-candy-xp"] }),
      queryClient.invalidateQueries({ queryKey: ["mobile-overview"] }),
    ]);
  }

  const saveDraft = useMutation({
    mutationFn: (answers: MobileCandyXpAnswer[]) =>
      api.saveCandyXpActivityDraft(activity.id, answers),
    onSuccess: async (result) => {
      setDirty(false);
      setDraft(null);
      setMessage(result.message);
      await refreshQueries();
    },
  });
  const submit = useMutation({
    mutationFn: (answers: MobileCandyXpAnswer[]) =>
      api.submitCandyXpActivity(activity.id, answers),
    onSuccess: async (result) => {
      setDirty(false);
      setDraft(null);
      setMessage(result.message);
      await refreshQueries();
    },
  });
  const busy = saveDraft.isPending || submit.isPending;
  const actionError = saveDraft.error ?? submit.error;

  function updateValue(questionId: string, value: string) {
    setDraft({
      activityId: activity.id,
      values: { ...values, [questionId]: value },
    });
    setDirty(true);
    setMessage("");
    saveDraft.reset();
    submit.reset();
  }

  function confirmSubmit() {
    const missing = getMissingRequired(activity, values);

    if (missing) {
      setMessage(`Preencha o campo obrigatorio: ${missing}.`);
      return;
    }

    Alert.alert(
      "Entregar missao Candy XP?",
      "Depois do envio, respostas de texto ficam bloqueadas ate a correcao.",
      [
        { style: "cancel", text: "Continuar editando" },
        {
          onPress: () => submit.mutate(buildPayload(values)),
          text: "Entregar agora",
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>SUAS RESPOSTAS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Complete a missao
          </Text>
        </View>
        {dirty ? <Text style={styles.dirty}>Nao salvo</Text> : null}
      </View>

      {activity.questions.map((question, index) => {
        const value = values[question.id] ?? "";
        const disabled = !activity.canSubmit || busy;

        return (
          <View key={question.id} style={styles.questionCard}>
            <Text style={styles.questionNumber}>PERGUNTA {index + 1}</Text>
            <Text style={styles.questionPrompt}>
              {question.prompt}
              {question.required ? " *" : ""}
            </Text>

            {question.type === "SHORT_TEXT" ||
            question.type === "LONG_TEXT" ? (
              <TextInput
                accessibilityLabel={`${question.prompt}${
                  question.required ? " *" : ""
                }`}
                editable={!disabled}
                maxLength={20_000}
                multiline={question.type === "LONG_TEXT"}
                onChangeText={(next) => updateValue(question.id, next)}
                placeholder="Escreva sua resposta"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  question.type === "LONG_TEXT" ? styles.longInput : null,
                  disabled ? styles.disabled : null,
                ]}
                textAlignVertical={
                  question.type === "LONG_TEXT" ? "top" : "center"
                }
                value={value}
              />
            ) : null}

            {question.type === "MULTIPLE_CHOICE" ? (
              <View style={styles.options}>
                {question.options.map((option) => (
                  <Choice
                    checked={value === option.text}
                    disabled={disabled}
                    key={option.text}
                    label={option.text}
                    onPress={() => updateValue(question.id, option.text)}
                    role="radio"
                  />
                ))}
              </View>
            ) : null}

            {question.type === "CHECKBOX" ? (
              <View style={styles.options}>
                {question.options.map((option) => {
                  const selected = parseSelectedArray(value);
                  const checked = selected.includes(option.text);

                  return (
                    <Choice
                      checked={checked}
                      disabled={disabled}
                      key={option.text}
                      label={option.text}
                      onPress={() => {
                        const next = checked
                          ? selected.filter((item) => item !== option.text)
                          : [...selected, option.text];
                        updateValue(question.id, JSON.stringify(next));
                      }}
                      role="checkbox"
                    />
                  );
                })}
              </View>
            ) : null}

            {question.type === "MATCHING" ? (
              <View style={styles.matchingList}>
                {question.options.map((option) => {
                  const matching = parseMatchingValue(value);
                  const rightOptions = question.options.flatMap((item) =>
                    item.match ? [item.match] : [],
                  );

                  return (
                    <View key={option.text} style={styles.matchingCard}>
                      <Text style={styles.matchingLabel}>{option.text}</Text>
                      <View style={styles.matchingOptions}>
                        {rightOptions.map((right) => {
                          const checked = matching[option.text] === right;

                          return (
                            <Pressable
                              accessibilityLabel={`${option.text}: ${right}`}
                              accessibilityRole="radio"
                              accessibilityState={{ checked, disabled }}
                              disabled={disabled}
                              key={right}
                              onPress={() =>
                                updateValue(
                                  question.id,
                                  JSON.stringify({
                                    ...matching,
                                    [option.text]: right,
                                  }),
                                )
                              }
                              style={[
                                styles.matchingChip,
                                checked ? styles.matchingChipSelected : null,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.matchingChipText,
                                  checked
                                    ? styles.matchingChipTextSelected
                                    : null,
                                ]}
                              >
                                {right}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}

      {activity.interactiveFields.length > 0 ? (
        <View style={styles.interactiveSection}>
          <Text style={styles.eyebrow}>MATERIAL INTERATIVO</Text>
          <Text style={styles.sectionTitle}>Preencha as areas marcadas</Text>

          {activity.interactiveFields.map((field, index) => {
            const label = `${field.label ?? `Campo ${index + 1}`}${
              field.required ? " *" : ""
            }`;
            const value = values[field.id] ?? "";
            const disabled = !activity.canSubmit || busy;

            if (field.type === "CHECKBOX") {
              const checked = value === "true";
              return (
                <View key={field.id} style={styles.pdfField}>
                  <Text style={styles.pageLabel}>PAGINA {field.page}</Text>
                  <Choice
                    checked={checked}
                    disabled={disabled}
                    label={label}
                    onPress={() =>
                      updateValue(field.id, checked ? "false" : "true")
                    }
                    role="checkbox"
                  />
                </View>
              );
            }

            if (field.type === "DRAWING") {
              return (
                <View key={field.id} style={styles.pdfField}>
                  <Text style={styles.pageLabel}>PAGINA {field.page}</Text>
                  <InteractiveDrawingField
                    disabled={disabled}
                    label={label}
                    onChange={(next) => updateValue(field.id, next)}
                    value={value}
                  />
                </View>
              );
            }

            const tiny = field.type === "TINY_TEXT";
            const long = field.type === "LONG_TEXT";

            return (
              <View key={field.id} style={styles.pdfField}>
                <Text style={styles.pageLabel}>PAGINA {field.page}</Text>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  accessibilityLabel={label}
                  autoCapitalize={tiny ? "characters" : "sentences"}
                  editable={!disabled}
                  maxLength={tiny ? 2 : 20_000}
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
                    disabled ? styles.disabled : null,
                  ]}
                  textAlignVertical={long ? "top" : "center"}
                  value={value}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {activity.submission?.feedback ? (
        <View accessibilityRole="alert" style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Feedback</Text>
          <Text style={styles.feedbackText}>
            {activity.submission.feedback}
          </Text>
        </View>
      ) : null}

      {activity.submission?.awardedXp ? (
        <View style={styles.awardCard}>
          <Text style={styles.awardText}>
            +{activity.submission.awardedXp} XP recebido
          </Text>
        </View>
      ) : null}

      {actionError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {actionError instanceof Error
            ? actionError.message
            : "Nao foi possivel atualizar a atividade."}
        </Text>
      ) : null}

      {message ? (
        <Text accessibilityRole="alert" style={styles.message}>
          {message}
        </Text>
      ) : null}

      {!activity.canSubmit ? (
        <Text style={styles.locked}>
          Atividade entregue. Aguarde a correcao ou consulte o feedback.
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
              <Text style={styles.primaryText}>Entregar missao</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  awardCard: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF4C7",
    borderColor: "#E5B93F",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  awardText: {
    color: colors.brandDeep,
    fontSize: typeScale.caption,
    fontWeight: "900",
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  choice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.sm,
  },
  choiceLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  choiceMarkSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  choiceSelected: {
    backgroundColor: "#F7EFF8",
    borderColor: colors.energy,
  },
  container: {
    gap: spacing.md,
  },
  dirty: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  disabled: {
    opacity: 0.55,
  },
  error: {
    color: "#A03232",
    fontSize: typeScale.caption,
    lineHeight: 18,
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  feedbackCard: {
    backgroundColor: "#F7EFF8",
    borderColor: colors.energy,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  feedbackText: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  feedbackTitle: {
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  fieldLabel: {
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "800",
  },
  heading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  headingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: typeScale.body,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  interactiveSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  locked: {
    backgroundColor: "#F3EAF5",
    borderRadius: radii.md,
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "700",
    lineHeight: 20,
    padding: spacing.md,
  },
  longInput: {
    minHeight: 128,
  },
  matchingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  matchingChip: {
    backgroundColor: "#F3EAF5",
    borderColor: "transparent",
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  matchingChipSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  matchingChipText: {
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "700",
  },
  matchingChipTextSelected: {
    color: colors.surface,
  },
  matchingLabel: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "800",
  },
  matchingList: {
    gap: spacing.sm,
  },
  matchingOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  message: {
    color: colors.success,
    fontSize: typeScale.caption,
    fontWeight: "700",
    lineHeight: 18,
  },
  options: {
    gap: spacing.xs,
  },
  pageLabel: {
    color: colors.focus,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pdfField: {
    gap: spacing.xs,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    minHeight: 54,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primaryText: {
    color: colors.surface,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  questionCard: {
    backgroundColor: "#FEFCF7",
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  questionNumber: {
    color: colors.focus,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  questionPrompt: {
    color: colors.brandDeep,
    fontSize: typeScale.lead,
    fontWeight: "800",
    lineHeight: 26,
  },
  radio: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  secondaryText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "800",
  },
  sectionTitle: {
    color: colors.brandDeep,
    fontSize: 24,
    fontWeight: "900",
  },
  tinyInput: {
    alignSelf: "flex-start",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    width: 88,
  },
  title: {
    color: colors.brandDeep,
    fontSize: 28,
    fontWeight: "900",
  },
});
