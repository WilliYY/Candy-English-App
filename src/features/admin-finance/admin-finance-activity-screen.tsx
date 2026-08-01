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
  parseBrlToCents,
} from "@/features/admin-finance/admin-finance-utils";
import { styles } from "@/features/admin-users/admin-users.styles";
import type {
  AdminFinanceActivityInput,
  MobileAdminFinanceActivity,
  MobileAdminFinanceUnit,
} from "@/lib/api/admin-finance-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  "createAdminFinanceExpense" | "getAdminFinanceActivity"
>;
type Props = {
  client?: Client;
  initialPeriod?: { month: number; year: number };
  onBack: () => void;
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const unitLabels = { DOURADINA: "Douradina", IVATE: "Ivaté" } as const;
const unitFilters: { label: string; value: NonNullable<AdminFinanceActivityInput["unit"]> }[] = [
  { label: "Todas", value: "ALL" },
  { label: "Ivaté", value: "IVATE" },
  { label: "Douradina", value: "DOURADINA" },
];

function defaultDateForPeriod(year: number, selectedMonth: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const month = String(selectedMonth).padStart(2, "0");
  if (year !== now.getFullYear() || selectedMonth !== currentMonth) {
    return `${year}-${month}-01`;
  }
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ActivityContent({
  activity,
  api,
  month,
  unit,
  year,
}: {
  activity: MobileAdminFinanceActivity;
  api: Client;
  month: number;
  unit: NonNullable<AdminFinanceActivityInput["unit"]>;
  year: number;
}) {
  const queryClient = useQueryClient();
  const [itemName, setItemName] = useState("");
  const [actorName, setActorName] = useState("");
  const [amount, setAmount] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(() =>
    defaultDateForPeriod(year, month),
  );
  const [expenseUnit, setExpenseUnit] = useState<MobileAdminFinanceUnit>(
    unit === "DOURADINA" ? "DOURADINA" : "IVATE",
  );
  const [note, setNote] = useState("");
  const [operationId, setOperationId] = useState(() => Crypto.randomUUID());
  const [validationError, setValidationError] = useState("");
  const [success, setSuccess] = useState("");
  const mutation = useMutation({
    mutationFn: () => {
      const amountCents = parseBrlToCents(amount);
      if (!amountCents) throw new Error("Informe um valor valido.");
      return api.createAdminFinanceExpense({
        actorName: actorName.trim(),
        amountCents,
        confirmCreate: true,
        itemName: itemName.trim(),
        month,
        note: note.trim() || null,
        operationId,
        purchasedAt,
        unit: expenseUnit,
        year,
      });
    },
    onSuccess: async (result) => {
      setItemName("");
      setAmount("");
      setNote("");
      setOperationId(Crypto.randomUUID());
      setSuccess(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-finance-activity"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-finance"] }),
      ]);
    },
  });

  function renewAttempt() {
    setOperationId(Crypto.randomUUID());
    setValidationError("");
    setSuccess("");
    mutation.reset();
  }

  function confirmCreate() {
    const amountCents = parseBrlToCents(amount);
    if (!itemName.trim() || !actorName.trim()) {
      setValidationError("Informe o gasto e quem pagou.");
      return;
    }
    if (!amountCents) {
      setValidationError("Informe um valor valido, como 129,90.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchasedAt)) {
      setValidationError("Use a data no formato AAAA-MM-DD.");
      return;
    }
    const [dateYear, dateMonth] = purchasedAt.split("-").map(Number);
    if (dateYear !== year || dateMonth !== month) {
      setValidationError("A data precisa pertencer ao mes selecionado.");
      return;
    }
    setValidationError("");
    Alert.alert(
      "Registrar gasto?",
      `${itemName.trim()} · ${formatMoney(amountCents)} · ${unitLabels[expenseUnit]}. Esta informacao tambem aparecera no site.`,
      [
        { style: "cancel", text: "Cancelar" },
        { text: "Confirmar", onPress: () => mutation.mutate() },
      ],
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>Novo gasto</Text>
      <Text style={styles.formLabel}>GASTO</Text>
      <TextInput accessibilityLabel="Nome do gasto" maxLength={160} onChangeText={(value) => { setItemName(value); renewAttempt(); }} placeholder="Ex.: Internet" style={styles.formInput} value={itemName} />
      <Text style={styles.formLabel}>QUEM PAGOU</Text>
      <TextInput accessibilityLabel="Quem pagou" maxLength={120} onChangeText={(value) => { setActorName(value); renewAttempt(); }} placeholder="Nome do responsavel" style={styles.formInput} value={actorName} />
      <Text style={styles.formLabel}>VALOR</Text>
      <TextInput accessibilityLabel="Valor do gasto" inputMode="decimal" onChangeText={(value) => { setAmount(value); renewAttempt(); }} placeholder="129,90" style={styles.formInput} value={amount} />
      <Text style={styles.formLabel}>DATA DA COMPRA</Text>
      <TextInput accessibilityLabel="Data da compra" autoCapitalize="none" onChangeText={(value) => { setPurchasedAt(value); renewAttempt(); }} placeholder="AAAA-MM-DD" style={styles.formInput} value={purchasedAt} />
      <Text style={styles.filterLabel}>UNIDADE DO GASTO</Text>
      <View style={styles.chips}>
        {(["IVATE", "DOURADINA"] as const).map((value) => (
          <Pressable accessibilityLabel={`Unidade do gasto ${unitLabels[value]}`} accessibilityRole="button" key={value} onPress={() => { setExpenseUnit(value); renewAttempt(); }} style={[styles.chip, expenseUnit === value ? styles.chipSelected : null]}>
            <Text style={[styles.chipText, expenseUnit === value ? styles.chipTextSelected : null]}>{unitLabels[value]}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.formLabel}>OBSERVACAO</Text>
      <TextInput accessibilityLabel="Observacao do gasto" maxLength={600} multiline onChangeText={(value) => { setNote(value); renewAttempt(); }} placeholder="Opcional" style={[styles.formInput, styles.formInputMultiline]} value={note} />
      {validationError ? <Text style={styles.formError}>{validationError}</Text> : null}
      {mutation.isError ? <Text style={styles.formError}>{mutation.error instanceof Error ? mutation.error.message : "Nao foi possivel registrar."}</Text> : null}
      {success ? <Text style={styles.warning}>{success}</Text> : null}
      <Pressable accessibilityLabel="Registrar gasto" accessibilityRole="button" disabled={mutation.isPending} onPress={confirmCreate} style={[styles.submitButton, mutation.isPending ? styles.submitButtonDisabled : null]}>
        <Text style={styles.submitButtonText}>{mutation.isPending ? "Registrando..." : "Registrar gasto"}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Gastos do periodo</Text>
      <Text style={styles.resultSummary}>{activity.expenseSummary.count} gasto(s) · {formatMoney(activity.expenseSummary.totalCents)}</Text>
      {activity.expenses.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Nenhum gasto neste periodo</Text></View> : null}
      {activity.expenses.map((expense) => (
        <View key={expense.id} style={styles.card}>
          <Text style={styles.cardName}>{expense.itemName}</Text>
          <Text style={styles.cardMeta}>{formatMoney(expense.amountCents)}</Text>
          <Text style={styles.cardEmail}>{unitLabels[expense.unit]} · {expense.purchasedAt} · {expense.actorName}</Text>
          {expense.note ? <Text style={styles.warning}>{expense.note}</Text> : null}
        </View>
      ))}

      <Text style={styles.sectionTitle}>Historico global recente</Text>
      <Text style={styles.subtitle}>Os registros abaixo abrangem todas as unidades e os ultimos 50 eventos.</Text>
      {activity.logs.map((log) => (
        <View key={log.id} style={styles.infoCard}>
          <Text style={styles.infoLabel}>{log.action}</Text>
          <Text style={styles.infoValue}>{log.description}</Text>
          {log.studentName ? <Text style={styles.warning}>{log.studentName}</Text> : null}
        </View>
      ))}
    </>
  );
}

export function AdminFinanceActivityScreen({ client, initialPeriod, onBack }: Props) {
  const api = client ?? getMobileApi();
  const now = new Date();
  const [month, setMonth] = useState(initialPeriod?.month ?? now.getMonth() + 1);
  const [year] = useState(initialPeriod?.year ?? now.getFullYear());
  const [unit, setUnit] = useState<NonNullable<AdminFinanceActivityInput["unit"]>>("ALL");
  const activity = useQuery({
    queryFn: () => api.getAdminFinanceActivity({ month, unit, year }),
    queryKey: ["admin-finance-activity", year, month, unit],
    refetchInterval: 15_000,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}><Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></Pressable></View>
        <Text style={styles.eyebrow}>ADMIN · FINANCEIRO</Text>
        <Text accessibilityRole="header" style={styles.title}>Gastos e historico</Text>
        <Text style={styles.subtitle}>Registros internos sincronizados com o mesmo backend do site.</Text>
        <Text style={styles.filterLabel}>MES · {year}</Text>
        <View style={styles.chips}>{months.map((label, index) => { const value = index + 1; return <Pressable accessibilityLabel={`Filtrar mes ${label}`} accessibilityRole="button" key={label} onPress={() => setMonth(value)} style={[styles.chip, month === value ? styles.chipSelected : null]}><Text style={[styles.chipText, month === value ? styles.chipTextSelected : null]}>{label}</Text></Pressable>; })}</View>
        <Text style={styles.filterLabel}>UNIDADE DOS GASTOS</Text>
        <View style={styles.chips}>{unitFilters.map((filter) => <Pressable accessibilityLabel={`Filtrar unidade ${filter.label}`} accessibilityRole="button" key={filter.value} onPress={() => setUnit(filter.value)} style={[styles.chip, unit === filter.value ? styles.chipSelected : null]}><Text style={[styles.chipText, unit === filter.value ? styles.chipTextSelected : null]}>{filter.label}</Text></Pressable>)}</View>
        {activity.isPending ? <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando gastos...</Text></View> : activity.isError || !activity.data ? <Pressable onPress={() => void activity.refetch()} style={styles.stateCard}><Text style={styles.stateTitle}>Gastos indisponiveis</Text><Text style={styles.stateText}>Toque para tentar novamente.</Text></Pressable> : <ActivityContent activity={activity.data} api={api} key={`${year}-${month}-${unit}`} month={month} unit={unit} year={year} />}
      </ScrollView>
    </SafeAreaView>
  );
}
