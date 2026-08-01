import {
  keepPreviousData,
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useRef, useState } from "react";
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

import { styles } from "@/features/admin-contracts/admin-contracts.styles";
import type {
  AdminContractsInput,
  AdminContractUploadFile,
  AdminContractUploadInput,
  AdminContractUploadResult,
  MobileAdminContract,
  MobileAdminContractCatalog,
} from "@/lib/api/admin-contracts-contracts";
import { getMobileApi } from "@/lib/api/mobile-api";

const MAX_CONTRACT_BYTES = 8 * 1024 * 1024;
type Client = {
  getAdminContracts: (
    input?: AdminContractsInput,
  ) => Promise<MobileAdminContractCatalog>;
  uploadAdminContract: (
    input: AdminContractUploadInput,
  ) => Promise<AdminContractUploadResult>;
};
type Props = {
  client?: Client;
  createOperationId?: () => string;
  onBack: () => void;
  onOpenContract: (contractId: string) => void;
  pickDocument?: () => Promise<AdminContractUploadFile | null>;
};

const assignmentFilters: {
  label: string;
  value: NonNullable<AdminContractsInput["assignment"]>;
}[] = [
  { label: "Todos", value: "ALL" },
  { label: "Gerais", value: "GENERAL" },
  { label: "De alunos", value: "STUDENT" },
];

function formatBytes(value: number) {
  return `${(value / (1024 * 1024)).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

async function pickPdf() {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: "application/pdf",
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.mimeType && asset.mimeType !== "application/pdf") {
    throw new Error("Selecione um arquivo PDF.");
  }
  return {
    mimeType: "application/pdf" as const,
    name: asset.name,
    size: asset.size ?? 0,
    uri: asset.uri,
  };
}

function ContractCard({
  contract,
  onOpen,
}: {
  contract: MobileAdminContract;
  onOpen: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`Abrir ${contract.title}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.cardTitle}>{contract.title}</Text>
          <Text selectable style={styles.cardFile}>{contract.fileName}</Text>
        </View>
        <Text style={styles.badge}>
          {contract.student ? "ALUNO" : "GERAL"}
        </Text>
      </View>
      <Text style={styles.cardMeta}>
        {contract.student?.name ?? "Documento geral"} · {formatBytes(contract.sizeBytes)}
      </Text>
      <Text style={styles.cardMeta}>
        Enviado por {contract.uploadedByName} em {formatDate(contract.createdAt)}
      </Text>
    </Pressable>
  );
}

export function AdminContractsScreen({
  client,
  createOperationId = Crypto.randomUUID,
  onBack,
  onOpenContract,
  pickDocument = pickPdf,
}: Props) {
  const api = client ?? getMobileApi();
  const queryClient = useQueryClient();
  const [assignment, setAssignment] = useState<
    NonNullable<AdminContractsInput["assignment"]>
  >("ALL");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [title, setTitle] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentProfileId, setStudentProfileId] = useState<string | null>(null);
  const [file, setFile] = useState<AdminContractUploadFile | null>(null);
  const [feedback, setFeedback] = useState("");
  const pendingAttempt = useRef<AdminContractUploadInput | null>(null);

  const catalog = useInfiniteQuery<
    MobileAdminContractCatalog,
    Error,
    InfiniteData<MobileAdminContractCatalog>,
    readonly unknown[],
    string | undefined
  >({
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    initialPageParam: undefined as string | undefined,
    placeholderData: keepPreviousData,
    queryFn: ({ pageParam }) =>
      api.getAdminContracts({
        assignment,
        ...(pageParam ? { cursor: pageParam } : {}),
        limit: 30,
        ...(appliedQuery ? { query: appliedQuery } : {}),
      }),
    queryKey: ["admin-contracts", assignment, appliedQuery],
    refetchInterval: 15_000,
  });
  const pages = catalog.data?.pages ?? [];
  const contracts = pages.flatMap((page) => page.contracts);
  const firstPage = pages[0];
  const filteredStudents = useMemo(() => {
    const normalized = studentQuery.trim().toLocaleLowerCase("pt-BR");
    return (firstPage?.students ?? [])
      .filter((student) =>
        normalized
          ? student.name.toLocaleLowerCase("pt-BR").includes(normalized)
          : true,
      )
      .slice(0, 30);
  }, [firstPage?.students, studentQuery]);

  const upload = useMutation({
    mutationFn: (input: AdminContractUploadInput) =>
      api.uploadAdminContract(input),
    onError: () => {
      setFeedback(
        "Nao foi possivel enviar. Tente novamente para repetir a mesma operacao com seguranca.",
      );
    },
    onSuccess: async (result) => {
      pendingAttempt.current = null;
      setFeedback(result.message);
      setFile(null);
      setStudentProfileId(null);
      setStudentQuery("");
      setTitle("");
      await queryClient.invalidateQueries({ queryKey: ["admin-contracts"] });
    },
  });

  async function selectPdf() {
    setFeedback("");
    try {
      const selected = await pickDocument();
      if (!selected) return;
      if (
        selected.mimeType !== "application/pdf" ||
        !Number.isInteger(selected.size) ||
        selected.size <= 0 ||
        selected.size > MAX_CONTRACT_BYTES
      ) {
        setFeedback("Selecione um PDF valido de ate 8 MB.");
        return;
      }
      pendingAttempt.current = null;
      setFile(selected);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Nao foi possivel selecionar o PDF.",
      );
    }
  }

  function confirmUpload() {
    const normalizedTitle = title.trim();
    if (normalizedTitle.length < 3 || !file) {
      setFeedback("Informe o titulo e selecione um PDF valido.");
      return;
    }
    const attempt =
      pendingAttempt.current ??
      ({
        confirmUpload: true,
        file,
        operationId: createOperationId(),
        studentProfileId,
        title: normalizedTitle,
      } satisfies AdminContractUploadInput);
    pendingAttempt.current = attempt;
    const studentName = firstPage?.students.find(
      (student) => student.id === attempt.studentProfileId,
    )?.name;
    Alert.alert(
      "Confirmar envio",
      `${attempt.title}\n${studentName ?? "Documento geral"}\n${attempt.file.name}`,
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () => upload.mutate(attempt),
          text: "Enviar",
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Voltar</Text>
        </Pressable>
        <Text style={styles.eyebrow}>ADMIN · DOCUMENTOS</Text>
        <Text accessibilityRole="header" style={styles.title}>Contratos</Text>
        <Text style={styles.subtitle}>
          PDFs privados sincronizados com o site, alunos e teachers autorizados.
        </Text>

        <View style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>Enviar contrato</Text>
          <TextInput
            accessibilityLabel="Titulo do contrato"
            maxLength={160}
            onChangeText={(value) => {
              pendingAttempt.current = null;
              setTitle(value);
            }}
            placeholder="Ex.: Contrato de matricula 2026"
            style={styles.input}
            value={title}
          />
          <Text style={styles.label}>VINCULO</Text>
          <TextInput
            accessibilityLabel="Buscar aluno para o contrato"
            onChangeText={setStudentQuery}
            placeholder="Buscar aluno"
            style={styles.input}
            value={studentQuery}
          />
          <View style={styles.chips}>
            <Pressable
              accessibilityLabel="Selecionar contrato geral"
              accessibilityRole="button"
              onPress={() => {
                pendingAttempt.current = null;
                setStudentProfileId(null);
              }}
              style={[styles.chip, studentProfileId === null ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, studentProfileId === null ? styles.chipTextSelected : null]}>Geral</Text>
            </Pressable>
            {filteredStudents.map((student) => (
              <Pressable
                accessibilityLabel={`Selecionar aluno ${student.name}`}
                accessibilityRole="button"
                key={student.id}
                onPress={() => {
                  pendingAttempt.current = null;
                  setStudentProfileId(student.id);
                }}
                style={[styles.chip, studentProfileId === student.id ? styles.chipSelected : null]}
              >
                <Text style={[styles.chipText, studentProfileId === student.id ? styles.chipTextSelected : null]}>{student.name}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable accessibilityLabel="Selecionar PDF" accessibilityRole="button" onPress={() => void selectPdf()} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Selecionar PDF</Text>
          </Pressable>
          {file ? <Text selectable style={styles.selectedFile}>{file.name} · {formatBytes(file.size)}</Text> : null}
          <Pressable
            accessibilityLabel="Enviar contrato"
            accessibilityRole="button"
            accessibilityState={{ disabled: upload.isPending }}
            disabled={upload.isPending}
            onPress={confirmUpload}
            style={[styles.primaryButton, upload.isPending ? styles.disabled : null]}
          >
            <Text style={styles.primaryButtonText}>{upload.isPending ? "Enviando..." : "Enviar contrato"}</Text>
          </Pressable>
          {feedback ? <Text accessibilityRole="alert" style={feedback.includes("sucesso") || feedback.includes("confirmado") ? styles.success : styles.error}>{feedback}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Catalogo</Text>
        <View style={styles.chips}>
          {assignmentFilters.map((filter) => (
            <Pressable
              accessibilityLabel={filter.value === "STUDENT" ? "Filtrar contratos de alunos" : `Filtrar contratos ${filter.label}`}
              accessibilityRole="button"
              key={filter.value}
              onPress={() => setAssignment(filter.value)}
              style={[styles.chip, assignment === filter.value ? styles.chipSelected : null]}
            >
              <Text style={[styles.chipText, assignment === filter.value ? styles.chipTextSelected : null]}>{filter.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.searchRow}>
          <TextInput accessibilityLabel="Buscar contratos" onChangeText={setQuery} onSubmitEditing={() => setAppliedQuery(query.trim())} placeholder="Titulo, arquivo, aluno ou autor" returnKeyType="search" style={[styles.input, styles.searchInput]} value={query} />
          <Pressable accessibilityLabel="Pesquisar contratos" accessibilityRole="button" onPress={() => setAppliedQuery(query.trim())} style={styles.searchButton}><Text style={styles.searchButtonText}>Buscar</Text></Pressable>
        </View>

        {firstPage ? (
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{firstPage.summary.total}</Text><Text style={styles.metricLabel}>total</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{firstPage.summary.general}</Text><Text style={styles.metricLabel}>gerais</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{firstPage.summary.studentSpecific}</Text><Text style={styles.metricLabel}>de alunos</Text></View>
          </View>
        ) : null}
        {catalog.isPending ? <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando contratos...</Text></View> : null}
        {catalog.isError ? <Pressable accessibilityRole="button" onPress={() => void catalog.refetch()} style={styles.stateCard}><Text style={styles.stateTitle}>Contratos indisponiveis</Text><Text style={styles.stateText}>Toque para tentar novamente.</Text></Pressable> : null}
        {!catalog.isPending && !catalog.isError && contracts.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Nenhum contrato encontrado</Text><Text style={styles.stateText}>Ajuste a busca ou envie o primeiro PDF.</Text></View> : null}
        {contracts.map((contract) => <ContractCard contract={contract} key={contract.id} onOpen={() => onOpenContract(contract.id)} />)}
        {catalog.hasNextPage ? <Pressable accessibilityRole="button" disabled={catalog.isFetchingNextPage} onPress={() => void catalog.fetchNextPage()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{catalog.isFetchingNextPage ? "Carregando..." : "Carregar mais"}</Text></Pressable> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
