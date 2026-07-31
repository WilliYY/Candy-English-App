import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationCard } from "@/features/notifications/notification-card";
import { styles } from "@/features/notifications/notifications-screen.styles";
import {
  ApiError,
  type MobileNotificationInbox,
  type MobileNotificationTarget,
} from "@/lib/api/mobile-api-client";
import { getMobileApi } from "@/lib/api/mobile-api";
import { colors } from "@/theme/tokens";

type NotificationsScreenProps = {
  onBack: () => void;
  onOpenTarget: (target: MobileNotificationTarget) => void;
};

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível carregar seus avisos agora.";
}

export function NotificationsScreen({
  onBack,
  onOpenTarget,
}: NotificationsScreenProps) {
  const notifications = useQuery({
    queryFn: () => getMobileApi().getNotifications(),
    queryKey: ["student-notifications"],
  });
  const data: MobileNotificationInbox | undefined = notifications.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void notifications.refetch()}
            refreshing={notifications.isRefetching}
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

        <Text style={styles.eyebrow}>AVISOS</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Fique por dentro
        </Text>
        <Text style={styles.subtitle}>
          Aulas, tarefas, correções e conquistas atualizadas pelo mesmo sistema
          do site.
        </Text>

        {notifications.isPending ? (
          <View
            accessibilityLabel="Carregando avisos"
            accessibilityRole="progressbar"
            style={styles.stateCard}
          >
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.stateText}>Buscando novidades...</Text>
          </View>
        ) : null}

        {notifications.isError ? (
          <View accessibilityRole="alert" style={styles.stateCard}>
            <Text style={styles.errorTitle}>Os avisos não carregaram</Text>
            <Text style={styles.stateText}>
              {getErrorMessage(notifications.error)}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void notifications.refetch()}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {data?.items.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Tudo em dia por aqui</Text>
            <Text style={styles.stateText}>
              Novos avisos aparecerão automaticamente nesta tela.
            </Text>
          </View>
        ) : null}

        {data?.items.map((item) => (
          <NotificationCard
            item={item}
            key={item.id}
            onOpen={onOpenTarget}
          />
        ))}

        <Text style={styles.securityNote}>
          O aviso mostra apenas um resumo. Conteúdo completo e dados pessoais
          ficam protegidos dentro do app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
