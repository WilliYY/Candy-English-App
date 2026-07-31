import { Pressable, Text, View } from "react-native";

import { styles } from "@/features/live-class/live-class-screen.styles";
import type { MobileLiveClassOverview } from "@/lib/api/mobile-api-client";

type MobileLiveClassSession = MobileLiveClassOverview["sessions"][number];

function formatDate(value: string | null) {
  if (!value) {
    return "Horário a confirmar";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LiveClassMaintenanceCard({
  message,
}: {
  message: string | null;
}) {
  return (
    <View accessibilityRole="alert" style={styles.maintenanceCard}>
      <View style={styles.statusPill}>
        <Text style={styles.statusPillText}>EM PAUSA</Text>
      </View>
      <Text style={styles.maintenanceTitle}>Em manutenção</Text>
      <Text style={styles.maintenanceText}>
        {message ??
          "Estamos preparando a melhor experiência de aula ao vivo."}
      </Text>
      <Text style={styles.automaticText}>
        O mesmo aviso aparece no site. Quando a função for liberada, esta tela
        será atualizada automaticamente.
      </Text>
    </View>
  );
}

export function LiveClassSessionCard({
  onJoin,
  session,
}: {
  onJoin: (joinUrl: string) => void;
  session: MobileLiveClassSession;
}) {
  const joinUrl = session.isLive ? session.joinUrl : null;

  return (
    <View style={styles.sessionCard}>
      <View
        style={[
          styles.sessionStatus,
          session.isLive
            ? styles.sessionStatusLive
            : styles.sessionStatusEnded,
        ]}
      >
        <Text
          style={[
            styles.sessionStatusText,
            session.isLive
              ? styles.sessionStatusTextLive
              : styles.sessionStatusTextEnded,
          ]}
        >
          {session.isLive ? "AO VIVO" : "ENCERRADA"}
        </Text>
      </View>
      <Text style={styles.sessionTitle}>{session.title}</Text>
      <Text style={styles.sessionMeta}>
        Teacher: {session.teacherName}
      </Text>
      {session.studentName ? (
        <Text style={styles.sessionMeta}>Aluno: {session.studentName}</Text>
      ) : null}
      <Text style={styles.sessionDate}>{formatDate(session.startsAt)}</Text>
      {joinUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => onJoin(joinUrl)}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Entrar na aula</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
