import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-operations/admin-operations.styles";
import type {
  AdminMaintenanceInput,
  AdminMaintenanceMutation,
  MobileAdminOperations,
} from "@/lib/api/admin-operations-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = {
  getAdminOperations: () => Promise<MobileAdminOperations>;
  updateAdminMaintenance: (
    input: AdminMaintenanceInput,
  ) => Promise<AdminMaintenanceMutation>;
};

type Props = {
  client?: Client;
  createOperationId?: () => string;
  onBack: () => void;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) {
    return `${(value / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB`;
  }
  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  }
  return `${(value / (1024 * 1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

function formatDate(value: string | null) {
  if (!value) return "Ainda sem alteração registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir a alteração.";
}

export function AdminOperationsScreen({
  client,
  createOperationId = Crypto.randomUUID,
  onBack,
}: Props) {
  const api = client ?? getMobileApi();
  const queryClient = useQueryClient();
  const pendingOperation = useRef<{ enabled: boolean; operationId: string } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const operations = useQuery({
    queryFn: () => api.getAdminOperations(),
    queryKey: ["admin-operations"],
    refetchInterval: 15_000,
  });
  const mutation = useMutation({
    mutationFn: (input: AdminMaintenanceInput) =>
      api.updateAdminMaintenance(input),
    onError: (cause) => {
      setFeedback(null);
      setError(messageFrom(cause));
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData<MobileAdminOperations>(
        ["admin-operations"],
        (current) =>
          current
            ? { ...current, maintenance: result.maintenance }
            : current,
      );
      if (pendingOperation.current?.operationId === variables.operationId) {
        pendingOperation.current = null;
      }
      setError(null);
      setFeedback(result.message);
    },
  });

  function requestMaintenanceChange(enabled: boolean) {
    let operation = pendingOperation.current;
    if (!operation || operation.enabled !== enabled) {
      operation = {
        enabled,
        operationId: createOperationId(),
      };
      pendingOperation.current = operation;
    }
    const operationId = operation.operationId;
    const expectedUpdatedAt = operations.data?.maintenance.updatedAt ?? null;
    const confirmText = enabled ? "Ativar" : "Desativar";

    Alert.alert(
      enabled ? "Ativar manutenção?" : "Desativar manutenção?",
      enabled
        ? "Alunos não conseguirão entrar no AVA. Admins e teachers continuarão com acesso."
        : "Os alunos voltarão a acessar o AVA imediatamente.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () =>
            mutation.mutate({
              confirmChange: true,
              enabled,
              expectedUpdatedAt,
              operationId,
            }),
          style: enabled ? "destructive" : "default",
          text: confirmText,
        },
      ],
    );
  }

  const maintenance = operations.data?.maintenance;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void operations.refetch()}
            refreshing={operations.isFetching && !operations.isLoading}
          />
        }
      >
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </Pressable>
        <Text style={styles.eyebrow}>CENTRAL ADMINISTRATIVA</Text>
        <Text style={styles.title}>Manutenção e operação</Text>
        <Text style={styles.subtitle}>
          Estado compartilhado com o site, atualização automática e controles limitados ao que é seguro no celular.
        </Text>

        {operations.isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando estado operacional…</Text>
          </View>
        ) : operations.isError || !operations.data ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Status indisponível</Text>
            <Text style={styles.stateText}>{messageFrom(operations.error)}</Text>
            <Pressable accessibilityRole="button" onPress={() => void operations.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.statusCard, maintenance?.enabled ? styles.statusCardActive : null]}>
              <Text style={styles.badge}>
                {maintenance?.enabled ? "MANUTENÇÃO ATIVA" : "OPERAÇÃO NORMAL"}
              </Text>
              <Text style={styles.cardTitle}>Acesso dos alunos</Text>
              <Text style={styles.cardText}>
                {maintenance?.enabled
                  ? "Alunos estão bloqueados; admins e teachers continuam acessando para ajustes."
                  : "Alunos, teachers e admins podem usar o AVA normalmente."}
              </Text>
              <Text style={styles.cardMeta}>
                Última alteração: {formatDate(maintenance?.updatedAt ?? null)}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={mutation.isPending}
                onPress={() => requestMaintenanceChange(!maintenance?.enabled)}
                style={[
                  styles.actionButton,
                  maintenance?.enabled ? styles.actionButtonActive : null,
                  mutation.isPending ? styles.disabled : null,
                ]}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color={maintenance?.enabled ? undefined : "#FFFFFF"} />
                ) : (
                  <Text style={[
                    styles.actionButtonText,
                    maintenance?.enabled ? styles.actionButtonTextActive : null,
                  ]}>
                    {maintenance?.enabled ? "Desativar manutenção" : "Ativar manutenção"}
                  </Text>
                )}
              </Pressable>
            </View>

            {feedback ? <Text style={styles.success}>{feedback}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>ARMAZENAMENTO PROTEGIDO</Text>
                <Text style={styles.summaryValue}>
                  {formatBytes(operations.data.storage.usageBytes)}
                </Text>
                <Text style={styles.cardText}>Uso total agregado, sem nomes ou caminhos de arquivos.</Text>
              </View>
            </View>

            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>APIs e senhas ficam somente no site</Text>
              <Text style={styles.noticeText}>
                O aplicativo não baixa chaves, credenciais, variáveis de ambiente nem detalhes internos do servidor.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
