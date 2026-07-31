import { useQuery } from "@tanstack/react-query";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  LiveClassMaintenanceCard,
  LiveClassSessionCard,
} from "@/features/live-class/live-class-cards";
import { styles } from "@/features/live-class/live-class-screen.styles";
import type { Role } from "@/lib/auth/auth-session";
import {
  ApiError,
  type MobileLiveClassOverview,
} from "@/lib/api/mobile-api-client";
import { getMobileApi } from "@/lib/api/mobile-api";
import { colors } from "@/theme/tokens";

type LiveClassScreenProps = {
  onBack: () => void;
  role: Role;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível carregar a aula ao vivo agora.";
}

function getRoleHint(role: Role) {
  if (role === "TEACHER") {
    return "Suas salas aparecem aqui quando a aula ao vivo estiver liberada.";
  }

  if (role === "ADMIN") {
    return "As salas da escola aparecem aqui para acompanhamento operacional.";
  }

  return "As salas gerais e as aulas liberadas para você aparecem aqui.";
}

export function LiveClassScreen({
  onBack,
  role,
}: LiveClassScreenProps) {
  const [feedback, setFeedback] = useState("");
  const liveClass = useQuery({
    queryFn: () => getMobileApi().getLiveClass(),
    queryKey: ["mobile-live-class", role],
  });

  async function joinSession(joinUrl: string) {
    setFeedback("");

    try {
      const parsed = new URL(joinUrl);

      if (parsed.protocol !== "https:") {
        throw new Error("unsafe live-class URL");
      }

      if (!(await Linking.canOpenURL(parsed.toString()))) {
        throw new Error("unsupported live-class URL");
      }

      await Linking.openURL(parsed.toString());
    } catch {
      setFeedback(
        "Não foi possível abrir a sala. Atualize a tela ou fale com a Candy English.",
      );
    }
  }

  const data: MobileLiveClassOverview | undefined = liveClass.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void liveClass.refetch()}
            refreshing={liveClass.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <Text style={styles.eyebrow}>AULA AO VIVO</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Sua sala Candy
        </Text>
        <Text style={styles.subtitle}>{getRoleHint(role)}</Text>

        {liveClass.isPending ? (
          <View
            accessibilityLabel="Carregando aula ao vivo"
            accessibilityRole="progressbar"
            style={styles.stateCard}
          >
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.stateText}>Consultando a sala...</Text>
          </View>
        ) : null}

        {liveClass.isError ? (
          <View accessibilityRole="alert" style={styles.stateCard}>
            <Text style={styles.errorTitle}>A sala não carregou</Text>
            <Text style={styles.stateText}>
              {getErrorMessage(liveClass.error)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void liveClass.refetch()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {data?.maintenance.enabled ? (
          <LiveClassMaintenanceCard
            message={data.maintenance.message}
          />
        ) : null}

        {data &&
        !data.maintenance.enabled &&
        data.sessions.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyTitle}>Nenhuma sala disponível</Text>
            <Text style={styles.stateText}>
              Puxe a tela para baixo para atualizar.
            </Text>
          </View>
        ) : null}

        {data && !data.maintenance.enabled
          ? data.sessions.map((session) => (
              <LiveClassSessionCard
                key={session.id}
                onJoin={(joinUrl) => void joinSession(joinUrl)}
                session={session}
              />
            ))
          : null}

        {feedback ? (
          <Text accessibilityRole="alert" style={styles.feedback}>
            {feedback}
          </Text>
        ) : null}

        <Text style={styles.securityNote}>
          Entre somente por esta tela. A Candy English nunca pede senha para
          abrir uma aula.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
