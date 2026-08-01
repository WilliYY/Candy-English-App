import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import type { MobileAdminPreRegistration } from "@/lib/api/admin-pre-registrations-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  "convertAdminPreRegistration" | "getAdminPreRegistration"
>;
type Props = { client?: Client; onBack: () => void; requestId: string };

const statusLabels: Record<MobileAdminPreRegistration["status"], string> = {
  APPROVED: "Convertido",
  CONTACTED: "Em contato",
  PENDING: "Pendente",
  READY_TO_CONVERT: "Pronto para converter",
  REJECTED: "Recusado",
  WAITING_PAYMENT: "Aguardando pagamento",
};

function value(value: string | number | null) {
  if (value === null || value === "") return "Nao informado";
  return String(value);
}

function money(cents: number | null) {
  if (cents === null) return "Nao informado";
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function InfoRow({ label, value: content }: { label: string; value: string }) {
  return (
    <>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{content}</Text>
      <View style={styles.infoDivider} />
    </>
  );
}

function conversionErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Nao foi possivel converter este pre-cadastro agora.";
}

function ConversionForm({
  api,
  preRegistration,
}: {
  api: Client;
  preRegistration: MobileAdminPreRegistration;
}) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(preRegistration.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmMissingAgenda, setConfirmMissingAgenda] = useState(false);
  const [confirmMissingFinance, setConfirmMissingFinance] = useState(false);
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");

  const conversion = useMutation({
    mutationFn: () =>
      api.convertAdminPreRegistration(preRegistration.id, {
        confirmConversion: true,
        confirmMissingAgendaData:
          preRegistration.agenda.complete || confirmMissingAgenda,
        confirmMissingFinancialData:
          preRegistration.finance.complete || confirmMissingFinance,
        emailForLogin: email.trim(),
        expectedUpdatedAt: preRegistration.updatedAt,
        initialPassword: password,
        operationId,
      }),
    onSuccess: async (result) => {
      setPassword("");
      setOperationId(Crypto.randomUUID());
      setSuccess(result.message);
      await queryClient.invalidateQueries({
        queryKey: ["admin-pre-registrations"],
      });
    },
  });

  function renewAttempt() {
    setOperationId(Crypto.randomUUID());
    setSuccess("");
    conversion.reset();
  }

  function requestConversion() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError("Informe um email valido para o login do aluno.");
      return;
    }
    if (password.length < 8) {
      setValidationError("A senha inicial precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!preRegistration.finance.complete && !confirmMissingFinance) {
      setValidationError(
        "Confirme que os dados financeiros serao preenchidos depois.",
      );
      return;
    }
    if (!preRegistration.agenda.complete && !confirmMissingAgenda) {
      setValidationError(
        "Confirme que os dias e o horario serao preenchidos depois.",
      );
      return;
    }

    setValidationError("");
    setSuccess("");
    conversion.reset();
    const pendingWarnings = [
      !preRegistration.finance.complete ? "financeiro incompleto" : null,
      !preRegistration.agenda.complete ? "agenda incompleta" : null,
    ].filter(Boolean);
    Alert.alert(
      `Converter ${preRegistration.fullName} em aluno?`,
      [
        "Sera criada uma conta STUDENT. A senha nao sera exibida nem salva no app.",
        pendingWarnings.length > 0
          ? `Confirmacao registrada: ${pendingWarnings.join(" e ")}.`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () => conversion.mutate(),
          style: "destructive",
          text: "Converter",
        },
      ],
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Criar acesso do aluno</Text>
      <View style={styles.infoCard}>
        <Text style={styles.warning}>
          A conversao cria o login STUDENT. A senha e usada somente nesta
          operacao e e apagada do formulario ao concluir.
        </Text>

        <Text style={styles.formLabel}>EMAIL PARA LOGIN</Text>
        <TextInput
          accessibilityLabel="Email para login do aluno"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={(nextEmail) => {
            setEmail(nextEmail);
            renewAttempt();
          }}
          placeholder="aluno@email.com"
          style={styles.formInput}
          value={email}
        />

        <Text style={styles.formLabel}>SENHA INICIAL</Text>
        <TextInput
          accessibilityLabel="Senha inicial do aluno"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(nextPassword) => {
            setPassword(nextPassword);
            renewAttempt();
          }}
          placeholder="Minimo de 8 caracteres"
          secureTextEntry
          style={styles.formInput}
          value={password}
        />

        {!preRegistration.finance.complete ? (
          <Pressable
            accessibilityLabel="Confirmar conversao sem financeiro completo"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmMissingFinance }}
            onPress={() => {
              setConfirmMissingFinance((current) => !current);
              renewAttempt();
            }}
            style={[
              styles.chip,
              confirmMissingFinance ? styles.chipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                confirmMissingFinance ? styles.chipTextSelected : null,
              ]}
            >
              Confirmo converter sem financeiro completo e preencher depois.
            </Text>
          </Pressable>
        ) : null}

        {!preRegistration.agenda.complete ? (
          <Pressable
            accessibilityLabel="Confirmar conversao sem agenda completa"
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmMissingAgenda }}
            onPress={() => {
              setConfirmMissingAgenda((current) => !current);
              renewAttempt();
            }}
            style={[
              styles.chip,
              confirmMissingAgenda ? styles.chipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                confirmMissingAgenda ? styles.chipTextSelected : null,
              ]}
            >
              Confirmo converter sem agenda completa e preencher depois.
            </Text>
          </Pressable>
        ) : null}

        {validationError ? (
          <Text accessibilityRole="alert" style={styles.formError}>
            {validationError}
          </Text>
        ) : null}
        {conversion.error ? (
          <Text accessibilityRole="alert" style={styles.formError}>
            {conversionErrorMessage(conversion.error)}
          </Text>
        ) : null}
        {success ? (
          <View style={styles.infoCard}>
            <Text accessibilityRole="alert" style={styles.infoValue}>
              {success}
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel="Converter pre-cadastro em aluno"
          accessibilityRole="button"
          disabled={conversion.isPending || Boolean(success)}
          onPress={requestConversion}
          style={[
            styles.submitButton,
            conversion.isPending || success ? styles.submitButtonDisabled : null,
          ]}
        >
          {conversion.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.submitButtonText}>
              {success ? "Aluno criado" : "Converter em aluno"}
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

export function AdminPreRegistrationDetailScreen({
  client,
  onBack,
  requestId,
}: Props) {
  const api = client ?? getMobileApi();
  const detail = useQuery({
    queryFn: () => api.getAdminPreRegistration(requestId),
    queryKey: ["admin-pre-registration", requestId],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>

        {detail.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando pre-cadastro...</Text>
          </View>
        ) : detail.isError ? (
          <Pressable onPress={() => void detail.refetch()} style={styles.stateCard}>
            <Text style={styles.stateTitle}>Pre-cadastro indisponível</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.eyebrow}>ADMIN · SECRETARIA</Text>
            <View style={styles.identityCard}>
              <Text accessibilityRole="header" style={styles.identityName}>
                {detail.data.fullName}
              </Text>
              <Text style={styles.identityEmail}>
                {detail.data.email ?? detail.data.phone}
              </Text>
              <Text style={styles.identityMeta}>
                {statusLabels[detail.data.status].toUpperCase()} · {detail.data.unit}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Prontidão</Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {detail.data.finance.complete ? "OK" : "—"}
                </Text>
                <Text style={styles.metricLabel}>Financeiro</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>
                  {detail.data.agenda.complete ? "OK" : "—"}
                </Text>
                <Text style={styles.metricLabel}>Agenda</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>
                {detail.data.canConvert
                  ? "Pronto para conversao"
                  : detail.data.converted
                    ? "Pre-cadastro ja convertido"
                    : "Conversao indisponivel nesta etapa"}
              </Text>
            </View>

            {detail.data.canConvert ? (
              <ConversionForm api={api} preRegistration={detail.data} />
            ) : null}

            <Text style={styles.sectionTitle}>Contato e aluno</Text>
            <View style={styles.infoCard}>
              <InfoRow label="TELEFONE PRINCIPAL" value={detail.data.phone} />
              <InfoRow
                label="TELEFONE DO ALUNO"
                value={value(detail.data.studentPhone)}
              />
              <InfoRow
                label="CONTATO SECUNDARIO"
                value={value(detail.data.secondaryContact)}
              />
              <InfoRow
                label="NASCIMENTO"
                value={value(detail.data.birthDate)}
              />
              <InfoRow label="ENDERECO" value={value(detail.data.address)} />
              <InfoRow label="CIDADE" value={value(detail.data.city)} />
              <InfoRow
                label="OBJETIVO DE INGLES"
                value={detail.data.englishGoal}
              />
              <Text style={styles.infoLabel}>NIVEL ESTIMADO</Text>
              <Text style={styles.infoValue}>
                {value(detail.data.estimatedLevel)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Responsável</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="NOME"
                value={value(detail.data.guardianName)}
              />
              <InfoRow
                label="DOCUMENTO"
                value={value(detail.data.guardianDocument)}
              />
              <Text style={styles.infoLabel}>TELEFONE</Text>
              <Text style={styles.infoValue}>
                {value(detail.data.guardianPhone)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Financeiro e agenda</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="MENSALIDADE"
                value={money(detail.data.tuitionCents)}
              />
              <InfoRow
                label="VENCIMENTO"
                value={value(detail.data.paymentDay)}
              />
              <InfoRow
                label="FORMA DE PAGAMENTO"
                value={value(detail.data.paymentMethod)}
              />
              <InfoRow
                label="PARCELAS"
                value={value(detail.data.installmentsTotal)}
              />
              <Text style={styles.infoLabel}>DIAS E HORARIO</Text>
              <Text style={styles.infoValue}>
                {detail.data.agenda.complete
                  ? `${detail.data.agenda.days.join(", ")} · ${detail.data.agenda.time}`
                  : "Agenda a completar"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Responsabilidade interna</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="TEACHER ATRIBUIDA"
                value={value(detail.data.assignedTeacherName)}
              />
              <InfoRow
                label="CRIADO POR"
                value={detail.data.createdBy?.name ?? "Origem publica"}
              />
              <InfoRow
                label="REVISADO POR"
                value={value(detail.data.reviewedByName)}
              />
              <InfoRow
                label="NOTA DE STATUS"
                value={value(detail.data.statusNote)}
              />
              <Text style={styles.infoLabel}>OBSERVACOES</Text>
              <Text style={styles.infoValue}>{value(detail.data.notes)}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
