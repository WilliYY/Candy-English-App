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
import type { MobileModuleData } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type ModuleScreenProps = {
  onBack: () => void;
  onOpenItem?: (item: MobileModuleData["items"][number]) => void;
  slug: string;
};

function formatDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAmount(value?: number) {
  if (value === undefined) {
    return null;
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value / 100);
}

export function ModuleScreen({
  onBack,
  onOpenItem,
  slug,
}: ModuleScreenProps) {
  const moduleQuery = useQuery({
    queryFn: () => getMobileApi().getModule(slug),
    queryKey: ["mobile-module", slug],
  });
  const data: MobileModuleData | undefined = moduleQuery.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void moduleQuery.refetch()}
            refreshing={moduleQuery.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <Pressable
          accessibilityLabel="Voltar ao início"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>← Início</Text>
        </Pressable>

        <Text style={styles.eyebrow}>DADOS SINCRONIZADOS</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {data?.title ?? "Carregando..."}
        </Text>
        <Text style={styles.description}>
          Informações autorizadas do mesmo sistema usado no site.
        </Text>

        {moduleQuery.isError ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void moduleQuery.refetch()}
            style={styles.error}
          >
            <Text style={styles.errorText}>
              Não foi possível carregar. Toque para tentar novamente.
            </Text>
          </Pressable>
        ) : null}

        {data && data.items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Tudo tranquilo por aqui</Text>
            <Text style={styles.emptyText}>{data.emptyMessage}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {data?.items.map((item) => {
            const date = formatDate(item.occurredAt);
            const amount = formatAmount(item.amountCents);

            const itemContent = (
              <>
                <View style={styles.itemTop}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.status ? (
                    <Text style={styles.status}>{item.status}</Text>
                  ) : null}
                </View>
                {item.subtitle ? (
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                ) : null}
                <View style={styles.itemMeta}>
                  {item.detail ? (
                    <Text style={styles.itemDetail}>{item.detail}</Text>
                  ) : null}
                  {amount ? (
                    <Text style={styles.amount}>{amount}</Text>
                  ) : null}
                  {date ? <Text style={styles.date}>{date}</Text> : null}
                </View>
              </>
            );

            return onOpenItem ? (
              <Pressable
                accessibilityLabel={`Abrir ${item.title}`}
                accessibilityRole="button"
                key={item.id}
                onPress={() => onOpenItem(item)}
                style={({ pressed }) => [
                  styles.item,
                  pressed ? styles.itemPressed : null,
                ]}
              >
                {itemContent}
                <Text style={styles.openHint}>Abrir detalhes →</Text>
              </Pressable>
            ) : (
              <View key={item.id} style={styles.item}>
                {itemContent}
              </View>
            );
          })}
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
  back: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
  },
  backText: {
    color: colors.brand,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  eyebrow: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: spacing.xl,
  },
  title: {
    color: colors.brandDeep,
    fontSize: typeScale.title,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  error: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  empty: {
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  list: {
    marginTop: spacing.xl,
  },
  item: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  itemPressed: {
    opacity: 0.68,
  },
  itemTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  itemTitle: {
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  status: {
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    color: colors.text,
    fontSize: 10,
    fontWeight: "900",
    maxWidth: "45%",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  itemSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  itemMeta: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  itemDetail: {
    color: colors.focus,
    fontSize: typeScale.caption,
    fontWeight: "800",
  },
  amount: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "900",
  },
  date: {
    color: colors.textMuted,
    fontSize: typeScale.caption,
  },
  openHint: {
    color: colors.brand,
    fontSize: typeScale.caption,
    fontWeight: "900",
    marginTop: spacing.xxs,
  },
});
