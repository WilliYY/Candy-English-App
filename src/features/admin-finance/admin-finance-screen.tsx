import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import type {
  AdminFinanceInput,
  MobileAdminFinance,
  MobileAdminFinanceItem,
  MobileAdminFinanceStatus,
} from "@/lib/api/admin-finance-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<ReturnType<typeof getMobileApi>, "getAdminFinance">;
type Props = {
  client?: Client;
  initialPeriod?: { month: number; year: number };
  onBack: () => void;
  onOpenActivity: () => void;
  onOpenPayment: (paymentId: string) => void;
};

const months = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
const statusLabels: Record<MobileAdminFinanceStatus, string> = {
  INCOMPLETE: "A completar",
  OVERDUE: "Atrasado",
  PAID: "Recebido",
  PENDING: "Pendente",
};
const statusFilters: {
  label: string;
  value: NonNullable<AdminFinanceInput["status"]>;
}[] = [
  { label: "Todos", value: "ALL" },
  { label: "Recebidos", value: "PAID" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Atrasados", value: "OVERDUE" },
  { label: "A completar", value: "INCOMPLETE" },
];
const unitFilters: {
  label: string;
  value: NonNullable<AdminFinanceInput["unit"]>;
}[] = [
  { label: "Todas", value: "ALL" },
  { label: "Ivaté", value: "IVATE" },
  { label: "Douradina", value: "DOURADINA" },
];
const unitLabels = { DOURADINA: "Douradina", IVATE: "Ivaté" } as const;

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function FinanceRow({
  item,
  onOpen,
}: {
  item: MobileAdminFinanceItem;
  onOpen: () => void;
}) {
  const installment =
    item.installmentNumber && item.installmentsTotal
      ? `${item.installmentNumber}/${item.installmentsTotal}`
      : "Sem parcelas";
  return (
    <Pressable
      accessibilityLabel={`Abrir pagamento de ${item.name}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardEmail}>
            {unitLabels[item.unit]} · vence dia {item.paymentDay}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            item.status === "PAID" ? styles.badgeActive : styles.badgeInactive,
          ]}
        >
          <Text style={styles.badgeText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>{money(item.amountCents)}</Text>
      <Text style={styles.warning}>{installment}</Text>
      <Text style={styles.warning}>{item.paymentMethod}</Text>
      {item.note ? <Text style={styles.warning}>{item.note}</Text> : null}
    </Pressable>
  );
}

export function AdminFinanceScreen({
  client,
  initialPeriod,
  onBack,
  onOpenActivity,
  onOpenPayment,
}: Props) {
  const api = client ?? getMobileApi();
  const now = new Date();
  const [month, setMonth] = useState(initialPeriod?.month ?? now.getMonth() + 1);
  const [year] = useState(initialPeriod?.year ?? now.getFullYear());
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] =
    useState<NonNullable<AdminFinanceInput["status"]>>("ALL");
  const [unit, setUnit] =
    useState<NonNullable<AdminFinanceInput["unit"]>>("ALL");
  const finance = useInfiniteQuery({
    getNextPageParam: (lastPage: MobileAdminFinance) =>
      lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }): Promise<MobileAdminFinance> =>
      api.getAdminFinance({
        cursor: pageParam,
        limit: 25,
        month,
        query: appliedQuery || undefined,
        status,
        unit,
        year,
      }),
    queryKey: ["admin-finance", year, month, unit, status, appliedQuery],
    refetchInterval: 15_000,
  });
  const pages = finance.data?.pages as MobileAdminFinance[] | undefined;
  const firstPage = pages?.[0];
  const items = useMemo(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages],
  );
  const summary = firstPage?.scopeSummary;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Abrir gastos e historico"
            accessibilityRole="button"
            onPress={onOpenActivity}
            style={styles.topAction}
          >
            <Text style={styles.topActionText}>Gastos e historico</Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>ADMIN · SECRETARIA</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Financeiro
        </Text>
        <Text style={styles.subtitle}>
          Visão interna por unidade. Nenhuma cobrança ou pagamento acontece no
          aplicativo.
        </Text>

        <Text style={styles.filterLabel}>MÊS · {year}</Text>
        <View style={styles.chips}>
          {months.map((label, index) => {
            const value = index + 1;
            return (
              <Pressable
                accessibilityLabel={`Filtrar mes ${label}`}
                accessibilityRole="button"
                key={label}
                onPress={() => setMonth(value)}
                style={[
                  styles.chip,
                  month === value ? styles.chipSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    month === value ? styles.chipTextSelected : null,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>UNIDADE</Text>
        <View style={styles.chips}>
          {unitFilters.map((filter) => (
            <Pressable
              accessibilityLabel={`Filtrar unidade ${filter.label}`}
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setUnit(filter.value)}
              style={[
                styles.chip,
                unit === filter.value ? styles.chipSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  unit === filter.value ? styles.chipTextSelected : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.filterLabel}>SITUAÇÃO</Text>
        <View style={styles.chips}>
          {statusFilters.map((filter) => (
            <Pressable
              accessibilityLabel={`Filtrar status ${filter.label}`}
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setStatus(filter.value)}
              style={[
                styles.chip,
                status === filter.value ? styles.chipSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  status === filter.value ? styles.chipTextSelected : null,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Buscar aluno no financeiro"
            autoCapitalize="words"
            onChangeText={setQuery}
            onSubmitEditing={() => setAppliedQuery(query.trim())}
            placeholder="Nome do aluno"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityLabel="Pesquisar financeiro"
            accessibilityRole="button"
            onPress={() => setAppliedQuery(query.trim())}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>

        {finance.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando financeiro...</Text>
          </View>
        ) : finance.isError ? (
          <Pressable onPress={() => void finance.refetch()} style={styles.stateCard}>
            <Text style={styles.stateTitle}>Financeiro indisponivel</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : (
          <>
            {summary ? (
              <>
                <Text style={styles.sectionTitle}>Resumo do mes</Text>
                <View style={styles.metrics}>
                  <SummaryMetric label="Previsto" value={money(summary.totalCents)} />
                  <SummaryMetric label="Recebido" value={money(summary.paidCents)} />
                  <SummaryMetric label="Pendente" value={money(summary.pendingCents)} />
                  <SummaryMetric label="Atrasado" value={money(summary.overdueCents)} />
                </View>
                {summary.incompleteCount > 0 ? (
                  <Text style={styles.formError}>
                    {summary.incompleteCount} cadastro(s) financeiro(s) a completar.
                  </Text>
                ) : null}
              </>
            ) : null}

            <Text style={styles.resultSummary}>
              {firstPage?.total ?? 0} resultado(s)
            </Text>
            {items.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Nenhum lançamento mensal</Text>
                <Text style={styles.stateText}>
                  Ajuste o mês, a unidade, a situação ou a busca.
                </Text>
              </View>
            ) : null}
            {items.map((item) => (
              <FinanceRow
                item={item}
                key={item.id}
                onOpen={() => onOpenPayment(item.id)}
              />
            ))}
            {finance.hasNextPage ? (
              <Pressable
                accessibilityRole="button"
                disabled={finance.isFetchingNextPage}
                onPress={() => void finance.fetchNextPage()}
                style={styles.loadMore}
              >
                <Text style={styles.loadMoreText}>
                  {finance.isFetchingNextPage ? "Carregando..." : "Carregar mais"}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
