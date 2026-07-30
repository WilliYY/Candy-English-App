import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileChatThread } from "@/lib/api/mobile-api-client";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type ChatScreenProps = {
  onBack: () => void;
};

export function ChatScreen({ onBack }: ChatScreenProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<MobileChatThread | null>(null);
  const [body, setBody] = useState("");
  const threads = useQuery({
    queryFn: () => getMobileApi().getChatThreads(),
    queryKey: ["chat-threads"],
  });
  const messages = useQuery({
    enabled: Boolean(selected),
    queryFn: () =>
      getMobileApi().getChatMessages({
        studentProfileId: selected!.studentProfileId,
        teacherProfileId: selected!.teacherProfileId,
      }),
    queryKey: [
      "chat-messages",
      selected?.studentProfileId,
      selected?.teacherProfileId,
    ],
  });
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selected) {
        throw new Error("Selecione uma conversa.");
      }

      const normalized = body.trim();

      if (!normalized) {
        throw new Error("Escreva uma mensagem.");
      }

      return getMobileApi().sendChatMessage({
        body: normalized,
        studentProfileId: selected.studentProfileId,
        teacherProfileId: selected.teacherProfileId,
      });
    },
    onSuccess: async () => {
      setBody("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chat-threads"] }),
        queryClient.invalidateQueries({
          queryKey: [
            "chat-messages",
            selected?.studentProfileId,
            selected?.teacherProfileId,
          ],
        }),
        queryClient.invalidateQueries({ queryKey: ["mobile-overview"] }),
      ]);
    },
  });

  if (!selected) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable
            accessibilityLabel="Voltar ao início"
            accessibilityRole="button"
            onPress={onBack}
            style={styles.back}
          >
            <Text style={styles.backText}>← Início</Text>
          </Pressable>
          <Text style={styles.eyebrow}>CONVERSAS PROTEGIDAS</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Mensagens
          </Text>
          <Text style={styles.description}>
            Somente vínculos autorizados aparecem aqui.
          </Text>

          {threads.isLoading ? (
            <ActivityIndicator
              color={colors.brand}
              size="large"
              style={styles.loader}
            />
          ) : null}

          {threads.isError ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => void threads.refetch()}
              style={styles.error}
            >
              <Text style={styles.errorText}>
                Não foi possível carregar. Toque para tentar novamente.
              </Text>
            </Pressable>
          ) : null}

          {threads.data?.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma conversa disponível</Text>
              <Text style={styles.emptyText}>
                O vínculo entre aluno e teacher precisa existir no site.
              </Text>
            </View>
          ) : null}

          <View style={styles.threadList}>
            {threads.data?.map((thread) => (
              <Pressable
                accessibilityRole="button"
                key={thread.id}
                onPress={() => setSelected(thread)}
                style={({ pressed }) => [
                  styles.thread,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {thread.peerName.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.threadCopy}>
                  <Text style={styles.threadName}>{thread.peerName}</Text>
                  <Text numberOfLines={1} style={styles.threadPreview}>
                    {thread.lastMessage ?? "Comece a conversa"}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.chatArea}
      >
        <View style={styles.chatHeader}>
          <Pressable
            accessibilityLabel="Voltar às conversas"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setSelected(null)}
          >
            <Text style={styles.backText}>← Conversas</Text>
          </Pressable>
          <Text style={styles.chatName}>{selected.peerName}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.isLoading ? (
            <ActivityIndicator color={colors.brand} size="large" />
          ) : null}
          {messages.data?.length === 0 ? (
            <Text style={styles.noMessages}>
              Comece a conversa com uma mensagem.
            </Text>
          ) : null}
          {messages.data?.map((message) => (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.isMine ? styles.mine : styles.theirs,
              ]}
            >
              {!message.isMine ? (
                <Text style={styles.sender}>{message.senderName}</Text>
              ) : null}
              <Text
                style={[
                  styles.messageBody,
                  message.isMine ? styles.mineText : null,
                ]}
              >
                {message.body}
              </Text>
            </View>
          ))}
        </ScrollView>

        {sendMessage.isError ? (
          <Text accessibilityRole="alert" style={styles.sendError}>
            {sendMessage.error.message}
          </Text>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Mensagem"
            editable={!sendMessage.isPending}
            maxLength={1000}
            multiline
            onChangeText={setBody}
            placeholder="Escreva uma mensagem..."
            style={styles.input}
            value={body}
          />
          <Pressable
            accessibilityLabel="Enviar mensagem"
            accessibilityRole="button"
            disabled={sendMessage.isPending || !body.trim()}
            onPress={() => sendMessage.mutate()}
            style={({ pressed }) => [
              styles.send,
              pressed ? styles.pressed : null,
              sendMessage.isPending || !body.trim()
                ? styles.sendDisabled
                : null,
            ]}
          >
            <Text style={styles.sendText}>
              {sendMessage.isPending ? "..." : "Enviar"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    width: "100%",
  },
  back: {
    alignSelf: "flex-start",
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
    marginTop: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    fontSize: typeScale.body,
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  error: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  errorText: {
    color: colors.text,
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
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  threadList: {
    marginTop: spacing.xl,
  },
  thread: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  avatarText: {
    color: colors.surface,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  threadCopy: {
    flex: 1,
  },
  threadName: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  threadPreview: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xxs,
  },
  arrow: {
    color: colors.focus,
    fontSize: 28,
  },
  pressed: {
    opacity: 0.65,
  },
  chatArea: {
    alignSelf: "center",
    flex: 1,
    maxWidth: 720,
    width: "100%",
  },
  chatHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  chatName: {
    color: colors.text,
    fontSize: typeScale.lead,
    fontWeight: "900",
  },
  messages: {
    flexGrow: 1,
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  noMessages: {
    color: colors.textMuted,
    textAlign: "center",
  },
  bubble: {
    borderRadius: radii.md,
    maxWidth: "84%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.brand,
    borderBottomRightRadius: spacing.xxs,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.coral,
    borderBottomLeftRadius: spacing.xxs,
  },
  sender: {
    color: colors.focus,
    fontSize: 11,
    fontWeight: "900",
    marginBottom: spacing.xxs,
  },
  messageBody: {
    color: colors.text,
    fontSize: typeScale.body,
    lineHeight: 22,
  },
  mineText: {
    color: colors.surface,
  },
  sendError: {
    color: colors.focus,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  composer: {
    alignItems: "flex-end",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: typeScale.body,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.md,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: colors.surface,
    fontWeight: "900",
  },
});
