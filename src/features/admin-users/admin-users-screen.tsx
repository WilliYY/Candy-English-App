import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  AdminUsersInput,
  MobileAdminUserRole,
} from "@/lib/api/mobile-api-client";

type AdminUsersClient = Pick<ReturnType<typeof getMobileApi>, "getAdminUsers">;

type Props = {
  client?: AdminUsersClient;
  onBack: () => void;
  onOpenUser: (userId: string) => void;
};

const roleOptions: Array<{ label: string; value: MobileAdminUserRole | "ALL" }> = [
  { label: "Todos", value: "ALL" },
  { label: "Alunos", value: "STUDENT" },
  { label: "Teachers", value: "TEACHER" },
  { label: "Admins", value: "ADMIN" },
];

const statusOptions = [
  { label: "Todos", value: "ALL" },
  { label: "Ativos", value: "ACTIVE" },
  { label: "Inativos", value: "INACTIVE" },
] as const;

const roleLabels: Record<MobileAdminUserRole, string> = {
  ADMIN: "ADMIN",
  STUDENT: "ALUNO",
  TEACHER: "TEACHER",
};

export function AdminUsersScreen({ client, onBack, onOpenUser }: Props) {
  const api = client ?? getMobileApi();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<MobileAdminUserRole | "ALL">("ALL");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ALL");
  const users = useInfiniteQuery({
    initialPageParam: null as string | null,
    queryKey: ["admin-users", query, role, status],
    queryFn: ({ pageParam }) => {
      const input: AdminUsersInput = {
        cursor: pageParam ?? undefined,
        limit: 25,
        query: query || undefined,
        role: role === "ALL" ? undefined : role,
        status,
      };
      return api.getAdminUsers(input);
    },
    getNextPageParam: (page) => page.nextCursor,
  });
  const items = useMemo(
    () => users.data?.pages.flatMap((page) => page.items) ?? [],
    [users.data?.pages],
  );
  const total = users.data?.pages[0]?.total ?? 0;

  function applySearch() {
    setQuery(search.trim());
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => void users.refetch()}
            refreshing={users.isRefetching && !users.isFetchingNextPage}
          />
        }
      >
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · USUARIOS</Text>
        <Text accessibilityRole="header" style={styles.title}>Contas e acessos</Text>
        <Text style={styles.subtitle}>
          Consulte pessoas, roles, status e vinculos usando os mesmos dados do site.
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel="Buscar usuarios por nome ou email"
            autoCapitalize="none"
            onChangeText={setSearch}
            onSubmitEditing={applySearch}
            placeholder="Nome ou email"
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
          <Pressable
            accessibilityLabel="Aplicar busca de usuarios"
            accessibilityRole="button"
            onPress={applySearch}
            style={styles.searchButton}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </Pressable>
        </View>

        <Text style={styles.filterLabel}>PERFIL</Text>
        <View style={styles.chips}>
          {roleOptions.map((option) => {
            const selected = role === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => setRole(option.value)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.filterLabel}>STATUS</Text>
        <View style={styles.chips}>
          {statusOptions.map((option) => {
            const selected = status === option.value;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => setStatus(option.value)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {users.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando usuarios...</Text>
          </View>
        ) : users.isError ? (
          <Pressable onPress={() => void users.refetch()} style={styles.stateCard}>
            <Text style={styles.stateTitle}>Nao foi possivel carregar</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.resultSummary}>Exibindo {items.length} de {total}</Text>
            {items.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Nenhum usuario encontrado</Text>
                <Text style={styles.stateText}>Ajuste a busca ou os filtros.</Text>
              </View>
            ) : null}
            {items.map((item) => (
              <Pressable
                accessibilityLabel={`Abrir usuario ${item.name}`}
                accessibilityRole="button"
                key={item.id}
                onPress={() => onOpenUser(item.id)}
                style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardEmail}>{item.email}</Text>
                  </View>
                  <View style={[styles.badge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                    <Text style={styles.badgeText}>{item.isActive ? "ATIVO" : "INATIVO"}</Text>
                  </View>
                </View>
                <Text style={styles.cardMeta}>{roleLabels[item.role]}</Text>
                {!item.profileComplete ? (
                  <Text style={styles.warning}>Perfil ainda incompleto no site.</Text>
                ) : null}
              </Pressable>
            ))}
            {users.hasNextPage ? (
              <Pressable
                accessibilityRole="button"
                disabled={users.isFetchingNextPage}
                onPress={() => void users.fetchNextPage()}
                style={styles.loadMore}
              >
                <Text style={styles.loadMoreText}>
                  {users.isFetchingNextPage ? "Carregando..." : "Carregar mais"}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
