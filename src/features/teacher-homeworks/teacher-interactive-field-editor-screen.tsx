import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import {
  ApiError,
  type MobileTeacherInteractiveFieldDraft,
  type MobileTeacherInteractiveFieldEditor,
} from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type Props = { homeworkId: string; onBack: () => void };
type FieldDraft = MobileTeacherInteractiveFieldDraft & { localKey: string };

const fieldTypes = [
  { label: "Texto curto", value: "SHORT_TEXT" as const },
  { label: "Texto longo", value: "LONG_TEXT" as const },
  { label: "2 caracteres", value: "TINY_TEXT" as const },
  { label: "Marcar opção", value: "CHECKBOX" as const },
  { label: "Desenho", value: "DRAWING" as const },
  { label: "Listening", value: "LISTENING" as const },
];

function fieldTypeLabel(type: FieldDraft["type"]) {
  return fieldTypes.find((choice) => choice.value === type)?.label ?? type;
}

function editorFields(editor: MobileTeacherInteractiveFieldEditor): FieldDraft[] {
  return editor.fields.map(({ sortOrder: _sortOrder, ...field }) => ({
    ...field,
    localKey: field.id,
  }));
}

function newField(index: number): FieldDraft {
  return {
    height: 8,
    id: null,
    label: null,
    localKey: Crypto.randomUUID(),
    page: 1,
    placeholder: null,
    required: false,
    type: "LONG_TEXT",
    width: 90,
    x: 5,
    y: Math.min(90, 5 + (index % 10) * 9),
  };
}

function mutationMessage(error: unknown) {
  if (error instanceof ApiError && error.code === "HOMEWORK_FIELDS_CONFLICT") {
    return "Os campos mudaram no site ou em outro aparelho. Recarregue a versão atual antes de salvar.";
  }
  if (error instanceof ApiError && error.code === "HOMEWORK_FIELDS_LOCKED") {
    return "Os campos estão bloqueados porque já existem entregas.";
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível salvar os campos agora.";
}

function LoadedEditor({
  editor,
  homeworkId,
  onReload,
}: {
  editor: MobileTeacherInteractiveFieldEditor;
  homeworkId: string;
  onReload: () => Promise<MobileTeacherInteractiveFieldEditor | undefined>;
}) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState(() => editorFields(editor));
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(editor.updatedAt);
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [advanced, setAdvanced] = useState(false);
  const [removeArmed, setRemoveArmed] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: MobileTeacherInteractiveFieldDraft[]) =>
      getMobileApi().updateTeacherInteractiveFields(homeworkId, {
        expectedUpdatedAt,
        fields: payload,
        operationId,
      }),
    onSuccess: async (result) => {
      setFields(editorFields(result.editor));
      setExpectedUpdatedAt(result.editor.updatedAt);
      setOperationId(Crypto.randomUUID());
      setRemoveArmed(null);
      setSuccess(result.message);
      queryClient.setQueryData(
        ["teacher-interactive-fields", homeworkId],
        result.editor,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["teacher-homework-editor", homeworkId],
        }),
        queryClient.invalidateQueries({ queryKey: ["mobile-module", "homeworks"] }),
      ]);
    },
  });

  function changeField(index: number, patch: Partial<FieldDraft>) {
    setFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    );
    setValidationError("");
    setSuccess("");
    setRemoveArmed(null);
    saveMutation.reset();
  }

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    setFields((current) => {
      const next = [...current];
      const sourceField = next[index];
      const targetField = next[target];
      if (!sourceField || !targetField) return current;
      next[index] = targetField;
      next[target] = sourceField;
      return next;
    });
    setValidationError("");
    setSuccess("");
    setRemoveArmed(null);
    saveMutation.reset();
  }

  function remove(field: FieldDraft) {
    if (removeArmed !== field.localKey) {
      setRemoveArmed(field.localKey);
      return;
    }
    setFields((current) => current.filter(({ localKey }) => localKey !== field.localKey));
    setValidationError("");
    setRemoveArmed(null);
    setSuccess("");
    saveMutation.reset();
  }

  function save() {
    if (fields.length > 120) {
      setValidationError("Use no máximo 120 campos.");
      return;
    }
    if (fields.some((field) => field.page < 1 || field.page > editor.pageCount)) {
      setValidationError(`Escolha páginas entre 1 e ${editor.pageCount}.`);
      return;
    }
    if (
      fields.some(
        (field) =>
          field.x < 0 ||
          field.x > 100 ||
          field.y < 0 ||
          field.y > 100 ||
          field.width < 1 ||
          field.width > 100 ||
          field.height < 1 ||
          field.height > 100,
      )
    ) {
      setValidationError("Revise a posição: use percentuais entre 0 e 100.");
      return;
    }
    if (
      fields.some(
        (field) => field.type === "LISTENING" && !field.placeholder?.trim(),
      )
    ) {
      setValidationError("Informe a frase de cada campo de listening.");
      return;
    }
    const payload = fields.map(({ localKey: _localKey, ...field }) => ({
      ...field,
      label: field.label?.trim() || null,
      placeholder: field.placeholder?.trim() || null,
      required: field.type === "LISTENING" ? false : field.required,
    }));
    setValidationError("");
    setSuccess("");
    saveMutation.mutate(payload);
  }

  async function reload() {
    const refreshed = await onReload();
    if (!refreshed) return;
    setFields(editorFields(refreshed));
    setExpectedUpdatedAt(refreshed.updatedAt);
    setOperationId(Crypto.randomUUID());
    setRemoveArmed(null);
    setValidationError("");
    setSuccess("");
    saveMutation.reset();
  }

  if (editor.hasSubmissions) {
    return (
      <View style={styles.lockedCard}>
        <Text style={styles.lockedTitle}>Estrutura protegida</Text>
        <Text style={styles.body}>
          Já existem entregas. Os campos continuam visíveis, mas não podem ser alterados para preservar as respostas e correções.
        </Text>
        <Text style={styles.fieldCount}>{fields.length} campo(s) cadastrados</Text>
        <View style={styles.fieldList}>
          {fields.map((field, index) => (
            <View key={field.localKey} style={styles.readOnlyField}>
              <Text style={styles.fieldTitle}>
                {index + 1}. {field.label ?? "Campo sem rótulo"}
              </Text>
              <Text style={styles.helper}>
                {fieldTypeLabel(field.type)} · página {field.page}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{editor.title}</Text>
        <Text style={styles.body}>
          {editor.assetFileName ?? "Arquivo interativo"} · {editor.pageCount} página(s)
        </Text>
        <Text style={styles.helper}>
          No app do aluno, os campos aparecem nesta ordem. A posição avançada também é mantida para o site.
        </Text>
      </View>

      <View style={styles.toolbar}>
        <Pressable
          accessibilityRole="button"
          disabled={fields.length >= 120}
          onPress={() => {
            setFields((current) => [...current, newField(current.length)]);
            setValidationError("");
            setSuccess("");
            setRemoveArmed(null);
            saveMutation.reset();
          }}
          style={[styles.primarySmall, fields.length >= 120 && styles.disabled]}
        >
          <Text style={styles.primaryText}>+ Adicionar campo</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: advanced }}
          onPress={() => setAdvanced((current) => !current)}
          style={styles.secondarySmall}
        >
          <Text style={styles.secondaryText}>
            {advanced ? "Ocultar posição" : "Posição avançada"}
          </Text>
        </Pressable>
      </View>

      {fields.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.summaryTitle}>Nenhum campo ainda</Text>
          <Text style={styles.body}>Adicione o primeiro campo para montar a atividade.</Text>
        </View>
      ) : null}

      <View style={styles.fieldList}>
        {fields.map((field, index) => (
          <View key={field.localKey} style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Text style={styles.fieldTitle}>Campo {index + 1}</Text>
              <View style={styles.orderButtons}>
                <Pressable
                  accessibilityLabel={`Mover campo ${index + 1} para cima`}
                  accessibilityRole="button"
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                  style={[styles.iconButton, index === 0 && styles.disabled]}
                >
                  <Text style={styles.iconText}>↑</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel={`Mover campo ${index + 1} para baixo`}
                  accessibilityRole="button"
                  disabled={index === fields.length - 1}
                  onPress={() => move(index, 1)}
                  style={[
                    styles.iconButton,
                    index === fields.length - 1 && styles.disabled,
                  ]}
                >
                  <Text style={styles.iconText}>↓</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Tipo de resposta</Text>
            <View style={styles.choices}>
              {fieldTypes.map((choice) => {
                const selected = field.type === choice.value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={choice.value}
                    onPress={() =>
                      changeField(index, {
                        required: choice.value === "LISTENING" ? false : field.required,
                        type: choice.value,
                      })
                    }
                    style={[styles.choice, selected && styles.choiceSelected]}
                  >
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Rótulo opcional</Text>
            <TextInput
              accessibilityLabel={`Rótulo do campo ${index + 1}`}
              maxLength={80}
              onChangeText={(label) => changeField(index, { label })}
              placeholder="Ex.: Responda em inglês"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={field.label ?? ""}
            />

            {field.type === "LISTENING" ? (
              <>
                <Text style={styles.label}>Frase do áudio</Text>
                <TextInput
                  accessibilityLabel={`Frase do listening ${index + 1}`}
                  maxLength={2000}
                  multiline
                  onChangeText={(placeholder) => changeField(index, { placeholder })}
                  placeholder="Digite exatamente o que o aluno deve ouvir"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.multiline]}
                  value={field.placeholder ?? ""}
                />
              </>
            ) : field.type !== "CHECKBOX" && field.type !== "DRAWING" ? (
              <>
                <Text style={styles.label}>Texto de ajuda opcional</Text>
                <TextInput
                  accessibilityLabel={`Texto de ajuda do campo ${index + 1}`}
                  maxLength={2000}
                  onChangeText={(placeholder) => changeField(index, { placeholder })}
                  placeholder="Ex.: Digite sua resposta"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={field.placeholder ?? ""}
                />
              </>
            ) : null}

            {field.type !== "LISTENING" ? (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: field.required }}
                onPress={() => changeField(index, { required: !field.required })}
                style={[styles.requiredChoice, field.required && styles.requiredSelected]}
              >
                <Text style={styles.requiredText}>
                  {field.required ? "✓ Obrigatório" : "Resposta opcional"}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.helper}>Listening é apenas para ouvir e não exige resposta.</Text>
            )}

            {advanced ? (
              <View style={styles.advancedGrid}>
                {(
                  [
                    ["Página", "page"],
                    ["X (%)", "x"],
                    ["Y (%)", "y"],
                    ["Largura (%)", "width"],
                    ["Altura (%)", "height"],
                  ] as const
                ).map(([label, key]) => (
                  <View key={key} style={styles.numberField}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      accessibilityLabel={`${label} do campo ${index + 1}`}
                      inputMode="decimal"
                      onChangeText={(value) => {
                        const number = Number(value.replace(",", "."));
                        if (Number.isFinite(number)) changeField(index, { [key]: number });
                      }}
                      style={styles.input}
                      value={String(field[key])}
                    />
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => remove(field)}
              style={[styles.removeButton, removeArmed === field.localKey && styles.removeConfirm]}
            >
              <Text style={styles.removeText}>
                {removeArmed === field.localKey ? "Confirmar remoção" : "Remover campo"}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      {validationError ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {validationError}
        </Text>
      ) : null}
      {saveMutation.error ? (
        <View style={styles.messageBlock}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {mutationMessage(saveMutation.error)}
          </Text>
          {saveMutation.error instanceof ApiError &&
          saveMutation.error.code === "HOMEWORK_FIELDS_CONFLICT" ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void reload()}
              style={styles.secondarySmall}
            >
              <Text style={styles.secondaryText}>Recarregar versão atual</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {success ? (
        <Text accessibilityRole="alert" style={styles.successText}>
          {success}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={saveMutation.isPending}
        onPress={save}
        style={[styles.saveButton, saveMutation.isPending && styles.disabled]}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.saveText}>Salvar campos interativos</Text>
        )}
      </Pressable>
    </>
  );
}

export function TeacherInteractiveFieldEditorScreen({ homeworkId, onBack }: Props) {
  const editorQuery = useQuery({
    enabled: homeworkId.length > 0,
    queryFn: () => getMobileApi().getTeacherInteractiveFields(homeworkId),
    queryKey: ["teacher-interactive-fields", homeworkId],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityLabel="Voltar para a tarefa"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Tarefa</Text>
          </Pressable>
          <Text style={styles.eyebrow}>ATIVIDADE INTERATIVA</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Campos da tarefa
          </Text>
          <Text style={styles.description}>
            Tipos, ordem e propriedades são compartilhados imediatamente com o site e o app do aluno após salvar.
          </Text>

          {editorQuery.isPending ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.brand} size="large" />
              <Text style={styles.body}>Carregando campos...</Text>
            </View>
          ) : editorQuery.isError || !editorQuery.data ? (
            <View style={styles.state}>
              <Text accessibilityRole="alert" style={styles.errorText}>
                {editorQuery.error?.message || "Não foi possível abrir os campos."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void editorQuery.refetch()}
                style={styles.secondarySmall}
              >
                <Text style={styles.secondaryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : (
            <LoadedEditor
              editor={editorQuery.data}
              homeworkId={homeworkId}
              onReload={async () => (await editorQuery.refetch()).data}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  advancedGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  back: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  backText: { color: colors.brand, fontSize: typeScale.body, fontWeight: "800" },
  body: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 24 },
  choice: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  choiceSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
  choiceText: { color: colors.textMuted, fontSize: typeScale.caption, fontWeight: "800" },
  choiceTextSelected: { color: colors.surface },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 760,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  description: { color: colors.textMuted, fontSize: typeScale.body, lineHeight: 24 },
  disabled: { opacity: 0.45 },
  emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radii.md, gap: spacing.xs, padding: spacing.lg },
  errorText: { color: "#A43D55", fontSize: typeScale.body, textAlign: "center" },
  eyebrow: { color: colors.focus, fontSize: typeScale.caption, fontWeight: "900", letterSpacing: 1.4 },
  fieldCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  fieldCount: { color: colors.focus, fontWeight: "900" },
  fieldHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  fieldList: { gap: spacing.md },
  fieldTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "900" },
  flex: { flex: 1 },
  helper: { color: colors.textMuted, fontSize: typeScale.caption, lineHeight: 18 },
  iconButton: { alignItems: "center", borderColor: colors.border, borderRadius: radii.pill, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
  iconText: { color: colors.brand, fontSize: typeScale.lead, fontWeight: "900" },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.sm, borderWidth: 1, color: colors.text, fontSize: typeScale.body, minHeight: 46, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { color: colors.text, fontSize: typeScale.caption, fontWeight: "900" },
  lockedCard: { backgroundColor: colors.coral, borderRadius: radii.md, gap: spacing.sm, padding: spacing.lg },
  lockedTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "900" },
  messageBlock: { alignItems: "center", gap: spacing.sm },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  numberField: { minWidth: 118 },
  orderButtons: { flexDirection: "row", gap: spacing.xs },
  primarySmall: { backgroundColor: colors.brand, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  primaryText: { color: colors.surface, fontWeight: "900" },
  readOnlyField: { backgroundColor: colors.surface, borderRadius: radii.sm, gap: spacing.xxs, padding: spacing.sm },
  removeButton: { alignItems: "center", borderColor: "#D9A7B3", borderRadius: radii.pill, borderWidth: 1, marginTop: spacing.xs, padding: spacing.sm },
  removeConfirm: { backgroundColor: "#F9DCE3" },
  removeText: { color: "#8A2942", fontWeight: "800" },
  requiredChoice: { alignSelf: "flex-start", backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  requiredSelected: { backgroundColor: "#DDF3E9" },
  requiredText: { color: colors.text, fontWeight: "800" },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  saveButton: { alignItems: "center", backgroundColor: colors.brand, borderRadius: radii.pill, minHeight: 52, padding: spacing.md },
  saveText: { color: colors.surface, fontSize: typeScale.body, fontWeight: "900" },
  secondarySmall: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.brand, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  secondaryText: { color: colors.brand, fontWeight: "900" },
  state: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxl },
  successText: { color: colors.success, fontSize: typeScale.body, fontWeight: "800", textAlign: "center" },
  summaryCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  summaryTitle: { color: colors.text, fontSize: typeScale.lead, fontWeight: "900" },
  title: { color: colors.text, fontSize: typeScale.title, fontWeight: "900", lineHeight: 42 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
