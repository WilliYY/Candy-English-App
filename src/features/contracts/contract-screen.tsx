import { useQuery } from "@tanstack/react-query";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/contracts/contract-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import {
  cacheProtectedContract,
  isValidProtectedContractMetadata,
  ProtectedContractError,
} from "@/lib/files/protected-contract-cache";
import { colors } from "@/theme/tokens";

type ContractScreenProps = {
  contractId: string;
  onBack: () => void;
};

function formatBytes(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    style: "unit",
    unit: "megabyte",
  }).format(value / (1024 * 1024));
}

export function ContractScreen({
  contractId,
  onBack,
}: ContractScreenProps) {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const contractsQuery = useQuery({
    enabled: contractId.length > 0,
    queryFn: () => getMobileApi().getModule("contracts"),
    queryKey: ["mobile-module", "contracts"],
  });
  const contract = contractsQuery.data?.items.find(
    (item) => item.id === contractId,
  );
  const metadata =
    contract?.fileName && contract.mimeType && contract.sizeBytes
      ? {
          contractId,
          fileName: contract.fileName,
          mimeType: contract.mimeType,
          sizeBytes: contract.sizeBytes,
        }
      : null;
  const canDownload =
    metadata !== null && isValidProtectedContractMetadata(metadata);

  async function downloadAndOpen() {
    if (!metadata || !canDownload) {
      return;
    }

    setFeedback("");
    setDownloadProgress(0);
    setIsDownloading(true);

    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new ProtectedContractError(
          "Este aparelho não oferece um aplicativo para abrir o PDF.",
        );
      }

      const source = await getMobileApi().getContractDownloadSource(contractId);
      const uri = await cacheProtectedContract({
        ...metadata,
        onProgress: ({ bytesWritten, totalBytes }) => {
          if (totalBytes > 0) {
            setDownloadProgress(bytesWritten / totalBytes);
          }
        },
        source,
      });

      await Sharing.shareAsync(uri, {
        dialogTitle: contract?.title ?? "Contrato Candy English",
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });
      setFeedback("Contrato baixado com segurança e pronto para abrir.");
    } catch (error) {
      setFeedback(
        error instanceof ProtectedContractError
          ? error.message
          : "Não foi possível abrir este contrato agora.",
      );
    } finally {
      setDownloadProgress(null);
      setIsDownloading(false);
    }
  }

  const buttonLabel =
    isDownloading && downloadProgress !== null
      ? `Baixando ${Math.round(downloadProgress * 100)}%`
      : "Baixar e abrir PDF";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityLabel="Voltar para contratos"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>← Contratos</Text>
        </Pressable>

        {contractsQuery.isPending ? (
          <ActivityIndicator
            accessibilityLabel="Carregando contrato"
            color={colors.brand}
            size="large"
            style={styles.loading}
          />
        ) : null}

        {contract ? (
          <>
            <Text style={styles.eyebrow}>DOCUMENTO PROTEGIDO</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {contract.title}
            </Text>
            <View style={styles.card}>
              <Text selectable style={styles.fileName}>
                {contract.fileName}
              </Text>
              {contract.sizeBytes ? (
                <Text style={styles.metadata}>
                  PDF · {formatBytes(contract.sizeBytes)}
                </Text>
              ) : null}
              <Text style={styles.security}>
                O acesso usa sua sessão. O arquivo temporário é apagado ao
                sair da conta.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !canDownload || isDownloading }}
                disabled={!canDownload || isDownloading}
                onPress={() => void downloadAndOpen()}
                style={[
                  styles.button,
                  !canDownload || isDownloading
                    ? styles.buttonDisabled
                    : null,
                ]}
              >
                <Text style={styles.buttonText}>{buttonLabel}</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {!contractsQuery.isPending && !contract ? (
          <View accessibilityRole="alert">
            <Text style={styles.error}>Contrato não encontrado ou removido.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void contractsQuery.refetch()}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {feedback ? (
          <Text
            accessibilityRole="alert"
            style={
              feedback.startsWith("Contrato baixado")
                ? styles.message
                : styles.error
            }
          >
            {feedback}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
