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

import {
  formatMoney,
  formatMoneyInput,
  parseBrlToCents,
} from "@/features/admin-finance/admin-finance-utils";
import { styles } from "@/features/admin-users/admin-users.styles";
import type { MobileAdminFinanceItem } from "@/lib/api/admin-finance-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  "getAdminFinancePayment" | "updateAdminFinancePayment"
>;
type Props = { client?: Client; onBack: () => void; paymentId: string };

const statusLabels = {
  INCOMPLETE: "Cadastro incompleto",
  OVERDUE: "Atrasado",
  PAID: "Recebido",
  PENDING: "Pendente",
} as const;
const unitLabels = { DOURADINA: "Douradina", IVATE: "Ivaté" } as const;

function PaymentEditor({
  api,
  onBack,
  payment,
}: {
  api: Client;
  onBack: () => void;
  payment: MobileAdminFinanceItem;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(() => formatMoneyInput(payment.amountCents));
  const [note, setNote] = useState(payment.note ?? "");
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");
  const targetPaid = !payment.isPaid;
  const mutation = useMutation({
    mutationFn: () => {
      const amountCents = parseBrlToCents(amount);
      if (!amountCents) throw new Error("Informe um valor valido.");
      return api.updateAdminFinancePayment(payment.id, {
        amountCents,
        confirmChange: true,
        expectedUpdatedAt: payment.updatedAt,
        isPaid: targetPaid,
        note: note.trim() || null,
        operationId,
      });
    },
    onSuccess: async (result) => {
      queryClient.setQueryData(
        ["admin-finance-payment", payment.id],
        result.payment,
      );
      setAmount(formatMoneyInput(result.payment.amountCents));
      setNote(result.payment.note ?? "");
      setOperationId(Crypto.randomUUID());
      setSuccess(result.message);
      await queryClient.invalidateQueries({ queryKey: ["admin-finance"] });
    },
  });

  function renewAttempt() {
    setOperationId(Crypto.randomUUID());
    setSuccess("");
    setValidationError("");
    mutation.reset();
  }

  function confirmUpdate() {
    const amountCents = parseBrlToCents(amount);
    if (!amountCents) {
      setValidationError("Informe um valor valido, como 350,00.");
      return;
    }
    setValidationError("");
    Alert.alert(
      targetPaid ? "Confirmar recebimento?" : "Marcar como pendente?",
      `${payment.name} · ${formatMoney(amountCents)}. Esta alteracao tambem aparecera no site.`,
      [
        { style: "cancel", text: "Cancelar" },
        { text: "Confirmar", onPress: () => mutation.mutate() },
      ],
    );
  }

  const installment =
    payment.installmentNumber && payment.installmentsTotal
      ? `${payment.installmentNumber}/${payment.installmentsTotal}`
      : "Sem parcelamento";
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · FINANCEIRO</Text>
        <Text accessibilityRole="header" style={styles.title}>{payment.name}</Text>
        <Text style={styles.subtitle}>
          {unitLabels[payment.unit]} · {payment.month}/{payment.year} · vence dia {payment.paymentDay}
        </Text>

        <View style={styles.identityCard}>
          <Text style={styles.identityName}>{formatMoney(payment.amountCents)}</Text>
          <Text style={styles.identityEmail}>{statusLabels[payment.status]}</Text>
          <Text style={styles.identityMeta}>{installment} · {payment.paymentMethod}</Text>
        </View>

        <Text style={styles.sectionTitle}>Alterar pagamento</Text>
        <Text style={styles.formLabel}>VALOR</Text>
        <TextInput
          accessibilityLabel="Valor do pagamento"
          inputMode="decimal"
          onChangeText={(value) => { setAmount(value); renewAttempt(); }}
          placeholder="350,00"
          style={styles.formInput}
          value={amount}
        />
        <Text style={styles.formLabel}>OBSERVACAO</Text>
        <TextInput
          accessibilityLabel="Observacao do pagamento"
          maxLength={500}
          multiline
          onChangeText={(value) => { setNote(value); renewAttempt(); }}
          placeholder="Informacao interna opcional"
          style={[styles.formInput, styles.formInputMultiline]}
          value={note}
        />
        {validationError ? <Text style={styles.formError}>{validationError}</Text> : null}
        {mutation.isError ? (
          <Text style={styles.formError}>
            {mutation.error instanceof Error ? mutation.error.message : "Nao foi possivel alterar."}
          </Text>
        ) : null}
        {success ? <Text style={styles.warning}>{success}</Text> : null}
        <Pressable
          accessibilityLabel={targetPaid ? "Marcar pagamento como recebido" : "Marcar pagamento como pendente"}
          accessibilityRole="button"
          disabled={mutation.isPending}
          onPress={confirmUpdate}
          style={[styles.submitButton, mutation.isPending ? styles.submitButtonDisabled : null]}
        >
          <Text style={styles.submitButtonText}>
            {mutation.isPending ? "Salvando..." : targetPaid ? "Marcar como recebido" : "Marcar como pendente"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AdminFinancePaymentScreen({ client, onBack, paymentId }: Props) {
  const api = client ?? getMobileApi();
  const payment = useQuery({
    queryFn: () => api.getAdminFinancePayment(paymentId),
    queryKey: ["admin-finance-payment", paymentId],
  });
  if (payment.isPending) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando pagamento...</Text></View></SafeAreaView>;
  }
  if (payment.isError || !payment.data) {
    return <SafeAreaView style={styles.safeArea}><Pressable onPress={() => void payment.refetch()} style={styles.stateCard}><Text style={styles.stateTitle}>Pagamento indisponivel</Text><Text style={styles.stateText}>Toque para tentar novamente.</Text></Pressable></SafeAreaView>;
  }
  return <PaymentEditor api={api} key={payment.data.updatedAt} onBack={onBack} payment={payment.data} />;
}
