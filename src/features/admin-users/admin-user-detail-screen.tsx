import { useQuery } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileAdminUserRole } from "@/lib/api/mobile-api-client";

type Client = Pick<ReturnType<typeof getMobileApi>, "getAdminUser">;

type Props = {
  client?: Client;
  onBack: () => void;
  userId: string;
};

const roleLabels: Record<MobileAdminUserRole, string> = {
  ADMIN: "Administrador",
  STUDENT: "Aluno",
  TEACHER: "Teacher",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminUserDetailScreen({ client, onBack, userId }: Props) {
  const api = client ?? getMobileApi();
  const user = useQuery({
    queryFn: () => api.getAdminUser(userId),
    queryKey: ["admin-user", userId],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>

        {user.isPending ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Carregando usuario...</Text>
          </View>
        ) : user.isError ? (
          <Pressable onPress={() => void user.refetch()} style={styles.stateCard}>
            <Text style={styles.stateTitle}>Usuario indisponivel</Text>
            <Text style={styles.stateText}>Toque para tentar novamente.</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.eyebrow}>ADMIN · DETALHE</Text>
            <View style={styles.identityCard}>
              <Text accessibilityRole="header" style={styles.identityName}>{user.data.name}</Text>
              <Text style={styles.identityEmail}>{user.data.email}</Text>
              <Text style={styles.identityMeta}>
                {roleLabels[user.data.role].toUpperCase()} · {user.data.isActive ? "ATIVO" : "INATIVO"}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Contato e conta</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>TELEFONE</Text>
              <Text style={styles.infoValue}>{user.data.phone ?? "Nao informado"}</Text>
              <View style={styles.infoDivider} />
              <Text style={styles.infoLabel}>ENDERECO</Text>
              <Text style={styles.infoValue}>{user.data.address ?? "Nao informado"}</Text>
              <View style={styles.infoDivider} />
              <Text style={styles.infoLabel}>CRIADO EM</Text>
              <Text style={styles.infoValue}>{dateLabel(user.data.createdAt)}</Text>
            </View>

            {user.data.studentProfile ? (
              <>
                <Text style={styles.sectionTitle}>Perfil do aluno</Text>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>NIVEL</Text>
                  <Text style={styles.infoValue}>{user.data.studentProfile.level ?? "Nao definido"}</Text>
                  <View style={styles.infoDivider} />
                  <Text style={styles.infoLabel}>TEACHERS VINCULADAS</Text>
                  <Text style={styles.infoValue}>
                    {user.data.studentProfile.teacherNames.join(", ") || "Nenhuma"}
                  </Text>
                </View>
                <View style={styles.metrics}>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.studentProfile.lessonsCount}</Text><Text style={styles.metricLabel}>Aulas</Text></View>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.studentProfile.submissionsCount}</Text><Text style={styles.metricLabel}>Entregas</Text></View>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.studentProfile.contractsCount}</Text><Text style={styles.metricLabel}>Contratos</Text></View>
                </View>
              </>
            ) : null}

            {user.data.teacherProfile ? (
              <>
                <Text style={styles.sectionTitle}>Perfil da teacher</Text>
                {user.data.teacherProfile.bio ? (
                  <View style={styles.infoCard}><Text style={styles.infoValue}>{user.data.teacherProfile.bio}</Text></View>
                ) : null}
                <View style={styles.metrics}>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.teacherProfile.studentsCount}</Text><Text style={styles.metricLabel}>Alunos</Text></View>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.teacherProfile.lessonsCount}</Text><Text style={styles.metricLabel}>Aulas</Text></View>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.teacherProfile.homeworksCount}</Text><Text style={styles.metricLabel}>Homeworks</Text></View>
                  <View style={styles.metric}><Text style={styles.metricValue}>{user.data.teacherProfile.reviewedSubmissionsCount}</Text><Text style={styles.metricLabel}>Correcoes</Text></View>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
