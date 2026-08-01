import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileOverview } from "@/lib/api/mobile-api-client";
import type { Role } from "@/lib/auth/auth-session";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type DashboardModule = {
  description: string;
  label: string;
  slug: string;
};

const roleContent: Record<
  Role,
  { eyebrow: string; modules: DashboardModule[]; title: string }
> = {
  STUDENT: {
    eyebrow: "MINHA JORNADA",
    title: "Vamos aprender?",
    modules: [
      { slug: "lessons", label: "Aulas", description: "Conteúdos e materiais da teacher" },
      { slug: "homeworks", label: "Homework", description: "Tarefas, rascunhos e feedback" },
      { slug: "xp", label: "Candy XP", description: "Missões, conquistas e ranking" },
      { slug: "catty", label: "Catty", description: "Pratique inglês com ajuda segura" },
      { slug: "live-class", label: "Aula ao vivo", description: "Sala e avisos sincronizados com o site" },
      { slug: "notifications", label: "Avisos", description: "Aulas, tarefas, correções e conquistas" },
      { slug: "messages", label: "Mensagens", description: "Converse com sua teacher" },
      { slug: "contracts", label: "Contratos", description: "Documentos liberados para você" },
      { slug: "profile", label: "Meu perfil", description: "Dados pessoais e foto compartilhados com o site" },
    ],
  },
  TEACHER: {
    eyebrow: "ROTINA DA TEACHER",
    title: "Sua turma, organizada",
    modules: [
      { slug: "students", label: "Alunos", description: "Perfis e vínculos autorizados" },
      { slug: "lessons", label: "Aulas", description: "Conteúdos, materiais e atividades" },
      { slug: "submissions", label: "Correções", description: "Submissões esperando feedback" },
      { slug: "homeworks", label: "Homework", description: "Crie, duplique e acompanhe" },
      { slug: "live-class", label: "Aula ao vivo", description: "Suas salas e estado da integração" },
      { slug: "messages", label: "Mensagens", description: "Conversas com alunos vinculados" },
      { slug: "contracts", label: "Contratos", description: "Documentos gerais e de alunos vinculados" },
      { slug: "secretary", label: "Secretaria", description: "Pré-cadastros permitidos" },
    ],
  },
  ADMIN: {
    eyebrow: "CENTRAL ADMINISTRATIVA",
    title: "Tudo sob controle",
    modules: [
      { slug: "users", label: "Usuários", description: "Contas, acessos e vínculos" },
      { slug: "secretary", label: "Secretaria", description: "Pré-cadastros e conversões" },
      { slug: "finance", label: "Financeiro", description: "Unidades, parcelas e despesas" },
      { slug: "agenda", label: "Agenda", description: "Aulas, presença e reposições" },
      { slug: "ava", label: "AVA", description: "Supervisão pedagógica completa" },
      { slug: "reports", label: "Relatórios", description: "Indicadores operacionais" },
    ],
  },
};

export function getDashboardModules(role: Role) {
  return roleContent[role].modules;
}

type DashboardScreenProps = {
  name: string;
  onOpenModule: (slug: string) => void;
  onSignOut: () => Promise<void>;
  role: Role;
};

export function DashboardScreen({
  name,
  onOpenModule,
  onSignOut,
  role,
}: DashboardScreenProps) {
  const content = roleContent[role];
  const firstName = name.trim().split(/\s+/)[0] || name;
  const overview = useQuery({
    queryFn: () => getMobileApi().getOverview(),
    queryKey: ["mobile-overview", role],
  });

  function formatMetric(metric: MobileOverview["metrics"][number]) {
    if (metric.unit === "CENTS") {
      return new Intl.NumberFormat("pt-BR", {
        currency: "BRL",
        style: "currency",
      }).format(metric.value / 100);
    }

    return metric.unit === "XP" ? `${metric.value} XP` : String(metric.value);
  }

  function formatDate(value: string | null) {
    if (!value) {
      return "Horário a confirmar";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void overview.refetch()}
            refreshing={overview.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.topBar}>
          <Image
            accessibilityLabel="Candy English"
            contentFit="contain"
            source={require("../../../assets/images/candy-logo.png")}
            style={styles.logo}
          />
          <Pressable
            accessibilityLabel="Sair da conta"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => void onSignOut()}
            style={styles.signOut}
          >
            <Text style={styles.signOutText}>Sair</Text>
          </Pressable>
        </View>

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{content.eyebrow}</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Olá, {firstName}.
          </Text>
          <Text style={styles.subtitle}>{content.title}</Text>
        </View>

        <View accessibilityRole="summary" style={styles.syncNotice}>
          <View style={styles.syncDot} />
          <View style={styles.syncCopy}>
            <Text style={styles.syncTitle}>Conta conectada ao site</Text>
            <Text style={styles.syncText}>
              O app usa o mesmo login, permissões e banco de dados.
            </Text>
          </View>
        </View>

        {overview.data?.metrics.length ? (
          <View style={styles.metrics}>
            {overview.data.metrics.map((metric) => (
              <View key={metric.id} style={styles.metric}>
                <Text style={styles.metricValue}>{formatMetric(metric)}</Text>
                <Text style={styles.metricLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {overview.data?.nextItem ? (
          <View style={styles.nextItem}>
            <Text style={styles.nextItemLabel}>
              {overview.data.nextItem.label}
            </Text>
            <Text style={styles.nextItemTitle}>
              {overview.data.nextItem.title}
            </Text>
            <Text style={styles.nextItemDate}>
              {formatDate(overview.data.nextItem.at)}
            </Text>
          </View>
        ) : null}

        {overview.isError ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void overview.refetch()}
            style={styles.overviewError}
          >
            <Text style={styles.overviewErrorText}>
              Resumo indisponível. Toque para tentar novamente.
            </Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>Seu espaço</Text>
        <View style={styles.modules}>
          {content.modules.map((module, index) => (
            <Pressable
              accessibilityHint="Abre os dados deste módulo"
              accessibilityRole="button"
              key={module.slug}
              onPress={() => onOpenModule(module.slug)}
              style={({ pressed }) => [
                styles.moduleRow,
                pressed ? styles.moduleRowPressed : null,
              ]}
            >
              <View style={styles.moduleNumber}>
                <Text style={styles.moduleNumberText}>
                  {String(index + 1).padStart(2, "0")}
                </Text>
              </View>
              <View style={styles.moduleCopy}>
                <Text style={styles.moduleLabel}>{module.label}</Text>
                <Text style={styles.moduleDescription}>
                  {module.description}
                </Text>
              </View>
              <Text accessibilityElementsHidden style={styles.moduleArrow}>
                ›
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignSelf: "center",
    maxWidth: 720,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    height: 40,
    width: 132,
  },
  signOut: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  signOutText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "800",
  },
  heading: {
    marginTop: spacing.xl,
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typeScale.lead,
    lineHeight: 27,
    marginTop: spacing.xs,
  },
  syncNotice: {
    alignItems: "flex-start",
    backgroundColor: colors.coral,
    borderRadius: radii.lg,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  syncDot: {
    backgroundColor: colors.success,
    borderRadius: radii.pill,
    height: 10,
    marginTop: 5,
    width: 10,
  },
  syncCopy: {
    flex: 1,
  },
  syncTitle: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  syncText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xxs,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minWidth: 112,
    padding: spacing.md,
  },
  metricValue: {
    color: colors.brandDeep,
    fontSize: 20,
    fontWeight: "900",
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
    fontWeight: "700",
    marginTop: spacing.xxs,
  },
  nextItem: {
    borderLeftColor: colors.energy,
    borderLeftWidth: 4,
    marginTop: spacing.lg,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  nextItemLabel: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  nextItemTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
    marginTop: spacing.xxs,
  },
  nextItemDate: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xxs,
  },
  overviewError: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  overviewErrorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
    marginTop: spacing.xl,
  },
  modules: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.md,
  },
  moduleRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  moduleRowPressed: {
    opacity: 0.65,
  },
  moduleNumber: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  moduleNumberText: {
    color: colors.surface,
    fontSize: typeScale.caption,
    fontWeight: "900",
  },
  moduleCopy: {
    flex: 1,
  },
  moduleLabel: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  moduleDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xxs,
  },
  moduleArrow: {
    color: colors.focus,
    fontSize: 28,
    fontWeight: "500",
  },
});
