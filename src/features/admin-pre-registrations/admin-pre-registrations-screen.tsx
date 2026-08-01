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
  AdminPreRegistrationsInput,
  MobileAdminPreRegistrationList,
  MobileAdminPreRegistrationListItem,
} from "@/lib/api/admin-pre-registrations-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  "getAdminPreRegistrations"
>;
type Props = {
  client?: Client;
  onBack: () => void;
  onOpenPreRegistration: (requestId: string) => void;
};

const statusLabels: Record<MobileAdminPreRegistrationListItem["status"], string> = {
  APPROVED: "Convertido",
  CONTACTED: "Em contato",
  PENDING: "Pendente",
  READY_TO_CONVERT: "Pronto para converter",
  REJECTED: "Recusado",
  WAITING_PAYMENT: "Aguardando pagamento",
};

const statusFilters: {
  label: string;
  value: NonNullable<AdminPreRegistrationsInput["status"]>;
}[] = [
  { label: "Em aberto", value: "OPEN" },
  { label: "Todos", value: "ALL" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Em contato", value: "CONTACTED" },
  { label: "Aguardando", value: "WAITING_PAYMENT" },
  { label: "Prontos", value: "READY_TO_CONVERT" },
  { label: "Convertidos", value: "APPROVED" },
  { label: "Recusados", value: "REJECTED" },
];

const unitFilters: {
  label: string;
  value: NonNullable<AdminPreRegistrationsInput["unit"]>;
}[] = [
  { label: "Todas", value: "ALL" },
  { label: "Ivaté", value: "IVATE" },
  { label: "Douradina", value: "DOURADINA" },
];

export function AdminPreRegistrationsScreen({
  client,
  onBack,
  onOpenPreRegistration,
}: Props) {
  const api = client ?? getMobileApi();
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [status, setStatus] =
    useState<NonNullable<AdminPreRegistrationsInput["status"]>>("OPEN");
  const [unit, setUnit] =
    useState<NonNullable<AdminPreRegistrationsInput["unit"]>>("ALL");
  const preRegistrations = useInfiniteQuery({
    getNextPageParam: (lastPage: MobileAdminPreRegistrationList) =>
      lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }): Promise<MobileAdminPreRegistrationList> =>
      api.getAdminPreRegistrations({
        cursor: pageParam,
        limit: 25,
        query: appliedQuery || undefined,
        status,
        unit,
      }),
    queryKey: ["admin-pre-registrations", appliedQuery, status, unit],
  });
  const pages = preRegistrations.data?.pages as
    | MobileAdminPreRegistrationList[]
    | undefined;
  const items = useMemo<MobileAdminPreRegistrationListItem[]>(
    () => pages?.flatMap((page) => page.items) ?? [],
    [pages],
  );
  const total = pages?.[0]?.total ?? 0;

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
        </View>

        <Text style={styles.eyebrow}>ADMIN · SECRETARIA</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Pré-cadastros
        </Text>
        <Text style={styles.subtitle}>
          Acompanhe contatos, documentação, financeiro e agenda antes da
          conversão em aluno.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Buscar pre-cadastros"
            autoCapitalize="words"
            onChangeText={setQuery}
            onSubmitEditing={() => setAppliedQuery(query.trim())}
            placeholder="Nome, email ou telefone"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityLabel="Pesquisar pre-cadastros"
            accessibilityRole="button"
            onPress={() => setAppliedQuery(query.trim())}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>

        <Text style={styles.filterLabel}>ETAPA</Text>
        <View style={styles.chips}>
          {statusFilters.map((filter) => (
            <Pressable
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setStatus(filter.value)}
              style={[styles.chip, status === filter.value && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipText,
                  status === filter.value && styles.chipTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.filterLabel}>UNIDADE</Text>
        <View style={styles.chips}>
          {unitFilters.map((filter) => (
            <Pressable
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setUnit(filter.value)}
              style={[styles.chip, unit === filter.value && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipText,
                  unit === filter.value && styles.chipTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {preRegistrations.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando pre-cadastros...</Text>
          </View>
        ) : preRegistrations.isError ? (
          <Pressable
            onPress={() => void preRegistrations.refetch()}
            style={styles.stateCard}
          >
            <Text style={styles.stateTitle}>Fila indisponível</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.resultSummary}>{total} resultado(s)</Text>
            {items.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Nenhum pre-cadastro</Text>
                <Text style={styles.stateText}>
                  Ajuste a busca, etapa ou unidade.
                </Text>
              </View>
            ) : null}
            {items.map((item) => (
              <Pressable
                accessibilityLabel={`Abrir pre-cadastro de ${item.fullName}`}
                accessibilityRole="button"
                key={item.id}
                onPress={() => onOpenPreRegistration(item.id)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardName}>{item.fullName}</Text>
                    <Text style={styles.cardEmail}>
                      {item.email ?? item.phone}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      item.converted ? styles.badgeActive : styles.badgeInactive,
                    ]}
                  >
                    <Text style={styles.badgeText}>{item.unit}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{statusLabels[item.status]}</Text>
                <Text style={styles.warning}>
                  {item.assignedTeacherName ?? "Teacher ainda nao atribuida"}
                </Text>
                {item.statusNote ? (
                  <Text style={styles.warning}>{item.statusNote}</Text>
                ) : null}
              </Pressable>
            ))}
            {preRegistrations.hasNextPage ? (
              <Pressable
                accessibilityRole="button"
                disabled={preRegistrations.isFetchingNextPage}
                onPress={() => void preRegistrations.fetchNextPage()}
                style={styles.loadMore}
              >
                <Text style={styles.loadMoreText}>
                  {preRegistrations.isFetchingNextPage
                    ? "Carregando..."
                    : "Carregar mais"}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
