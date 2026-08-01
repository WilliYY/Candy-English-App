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
  type MobileTeacherPreRegistration,
} from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type Props = { onBack: () => void; requestId: string };

const statusLabels: Record<MobileTeacherPreRegistration["status"], string> = {
  APPROVED: "Convertido",
  CONTACTED: "Em contato",
  PENDING: "Pendente",
  READY_TO_CONVERT: "Pronto para converter",
  REJECTED: "Recusado",
  WAITING_PAYMENT: "Aguardando pagamento",
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.code === "PRE_REGISTRATION_CONFLICT") {
    return error.message;
  }
  return error instanceof Error
    ? error.message
    : "Não foi possível converter este pré-cadastro agora.";
}

function LoadedPreRegistration({
  preRegistration,
}: {
  preRegistration: MobileTeacherPreRegistration;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(preRegistration.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmMissingAgenda, setConfirmMissingAgenda] = useState(false);
  const [armed, setArmed] = useState(false);
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");

  const conversion = useMutation({
    mutationFn: () =>
      getMobileApi().convertTeacherPreRegistration(preRegistration.id, {
        confirmConversion: true,
        confirmMissingAgendaData:
          preRegistration.agenda.complete || confirmMissingAgenda,
        emailForLogin: email.trim(),
        initialPassword: password,
        operationId,
      }),
    onSuccess: async (result) => {
      if (result.preRegistration) {
        queryClient.setQueryData(
          ["teacher-pre-registration", preRegistration.id],
          result.preRegistration,
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["mobile-module", "secretary"],
      });
      setPassword("");
      setArmed(false);
      setOperationId(Crypto.randomUUID());
      setSuccess(result.message);
    },
  });

  function convert() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError("Informe um email válido para o login do aluno.");
      return;
    }
    if (password.trim().length < 8) {
      setValidationError("A senha inicial precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!preRegistration.agenda.complete && !confirmMissingAgenda) {
      setValidationError(
        "Confirme que dias e horário da agenda serão preenchidos depois.",
      );
      return;
    }
    setValidationError("");
    setSuccess("");
    conversion.reset();
    if (!armed) {
      setArmed(true);
      return;
    }
    conversion.mutate();
  }

  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>SECRETARIA PROTEGIDA</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {preRegistration.fullName}
        </Text>
        <Text style={styles.status}>{statusLabels[preRegistration.status]}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados permitidos</Text>
        <Text style={styles.line}>Telefone: {preRegistration.phone}</Text>
        <Text style={styles.line}>Unidade: {preRegistration.unit}</Text>
        <Text style={styles.line}>Objetivo: {preRegistration.englishGoal}</Text>
        <Text style={styles.line}>
          Nível: {preRegistration.estimatedLevel ?? "A definir"}
        </Text>
        {preRegistration.statusNote ? (
          <Text style={styles.note}>{preRegistration.statusNote}</Text>
        ) : null}
      </View>

      <View style={styles.readiness}>
        <View style={styles.readinessItem}>
          <Text style={styles.cardTitle}>Financeiro</Text>
          <Text style={styles.line}>
            {preRegistration.finance.complete
              ? "Dados completos para criar os snapshots."
              : "Será criado como Completar; valores pendentes não entram no fluxo de pagamento."}
          </Text>
        </View>
        <View style={styles.readinessItem}>
          <Text style={styles.cardTitle}>Agenda</Text>
          <Text style={styles.line}>
            {preRegistration.agenda.complete
              ? `${preRegistration.agenda.days} · ${preRegistration.agenda.time}`
              : "Sem dias/horário completos: não serão criadas ocorrências falsas."}
          </Text>
        </View>
      </View>

      {preRegistration.canConvert ? (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Criar acesso do aluno</Text>
          <Text style={styles.help}>
            Esta ação cria o login STUDENT e o vínculo com sua teacher. A senha
            não é exibida nem salva no app.
          </Text>
          <TextInput
            accessibilityLabel="Email para login"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={(value) => {
              setEmail(value);
              setArmed(false);
            }}
            placeholder="aluno@email.com"
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel="Senha inicial"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => {
              setPassword(value);
              setArmed(false);
            }}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {!preRegistration.agenda.complete ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmMissingAgenda }}
              onPress={() => {
                setConfirmMissingAgenda((current) => !current);
                setArmed(false);
              }}
              style={styles.confirmRow}
            >
              <View
                style={[
                  styles.checkbox,
                  confirmMissingAgenda ? styles.checkboxChecked : null,
                ]}
              />
              <Text style={styles.confirmText}>
                Confirmo converter sem agenda completa e preencher depois.
              </Text>
            </Pressable>
          ) : null}

          {validationError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {validationError}
            </Text>
          ) : null}
          {conversion.error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage(conversion.error)}
            </Text>
          ) : null}
          {success ? (
            <Text accessibilityRole="alert" style={styles.success}>
              {success}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={conversion.isPending}
            onPress={convert}
            style={[
              styles.convertButton,
              armed ? styles.convertArmed : null,
              conversion.isPending ? styles.disabled : null,
            ]}
          >
            {conversion.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.convertText}>
                {armed ? "Confirmar conversão agora" : "Tornar aluno"}
              </Text>
            )}
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {preRegistration.converted
              ? "Pré-cadastro já convertido"
              : "Conversão indisponível neste status"}
          </Text>
          <Text style={styles.line}>
            Nenhuma nova conta, cobrança ou agenda será criada por esta tela.
          </Text>
        </View>
      )}
    </>
  );
}

export function TeacherPreRegistrationScreen({ onBack, requestId }: Props) {
  const detail = useQuery({
    enabled: requestId.length > 0,
    queryFn: () => getMobileApi().getTeacherPreRegistration(requestId),
    queryKey: ["teacher-pre-registration", requestId],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityLabel="Voltar para secretaria"
            accessibilityRole="button"
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Secretaria</Text>
          </Pressable>
          {detail.isPending ? (
            <ActivityIndicator color={colors.brand} size="large" />
          ) : null}
          {detail.data ? (
            <LoadedPreRegistration preRegistration={detail.data} />
          ) : null}
          {detail.isError ? (
            <View accessibilityRole="alert" style={styles.card}>
              <Text style={styles.error}>
                Pré-cadastro não encontrado ou sem vínculo com sua teacher.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void detail.refetch()}
                style={styles.retry}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  flex: { flex: 1 },
  content: {
    alignSelf: "center",
    gap: spacing.md,
    maxWidth: 720,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  back: { alignSelf: "flex-start", paddingVertical: spacing.xs },
  backText: { color: colors.brand, fontSize: 15, fontWeight: "900" },
  heading: { gap: spacing.xs },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: { color: colors.brandDeep, fontSize: 30, fontWeight: "900" },
  status: { color: colors.textMuted, fontSize: 15, fontWeight: "800" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  line: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  note: { color: colors.text, fontSize: 14, fontStyle: "italic", lineHeight: 21 },
  readiness: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  readinessItem: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    flexGrow: 1,
    flexBasis: 240,
    gap: spacing.xs,
    padding: spacing.md,
  },
  form: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  help: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  confirmRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    borderColor: colors.brand,
    borderRadius: 4,
    borderWidth: 2,
    height: 22,
    width: 22,
  },
  checkboxChecked: { backgroundColor: colors.brand },
  confirmText: { color: colors.text, flex: 1, fontSize: 14, lineHeight: 20 },
  error: { color: "#A43D55", fontSize: 14, fontWeight: "800" },
  success: { color: colors.success, fontSize: 14, fontWeight: "900" },
  convertButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    minHeight: 50,
    justifyContent: "center",
    padding: spacing.md,
  },
  convertArmed: { backgroundColor: "#A43D55" },
  convertText: { color: colors.surface, fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  retry: {
    alignSelf: "flex-start",
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: { color: colors.brand, fontWeight: "900" },
});
