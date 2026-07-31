import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/catty/catty-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileCattyContext,
  MobileCattyMessage,
} from "@/lib/api/mobile-api-client";
import type { Role } from "@/lib/auth/auth-session";
import { colors } from "@/theme/tokens";

type CattyClient = {
  getCattyHistory: (
    context: MobileCattyContext,
  ) => Promise<MobileCattyMessage[]>;
  sendCattyMessage: (input: {
    context: MobileCattyContext;
    history: MobileCattyMessage[];
    message: string;
  }) => Promise<{
    messageId?: string;
    reply: string;
    source: "fallback" | "gemini" | "openai";
  }>;
};

type CattyScreenProps = {
  client?: CattyClient;
  onBack: () => void;
  role: Role;
};

const quickPrompts = [
  "Quero praticar uma frase em ingles",
  "Me ensine uma palavra nova",
  "Corrija meu ingles com carinho",
] as const;

function contextForRole(role: Role): MobileCattyContext {
  return {
    area:
      role === "ADMIN" ? "admin" : role === "TEACHER" ? "teacher" : "student",
  };
}

export function CattyScreen({
  client,
  onBack,
  role,
}: CattyScreenProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const context = useMemo(() => contextForRole(role), [role]);
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState("");
  const historyKey = ["catty-history", context.area, context.task ?? "default"];
  const history = useQuery({
    queryFn: () => api.getCattyHistory(context),
    queryKey: historyKey,
  });
  const send = useMutation({
    mutationFn: (normalized: string) =>
      api.sendCattyMessage({
        context,
        history: history.data ?? [],
        message: normalized,
      }),
    onSuccess: (result, normalized) => {
      const now = Date.now();
      queryClient.setQueryData<MobileCattyMessage[]>(
        historyKey,
        (current = []) => [
          ...current,
          {
            from: "user",
            id: `local-user-${now}`,
            text: normalized,
          },
          {
            from: "catty",
            id: result.messageId ?? `local-catty-${now}`,
            text: result.reply,
          },
        ],
      );
      setMessage("");
    },
  });
  const normalized = message.trim();
  const canSend = normalized.length > 0 && !send.isPending;
  const visibleMessages = history.data ?? [];

  function submit() {
    if (!canSend) {
      return;
    }

    send.mutate(normalized);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar ao inicio"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.cattyAvatar}>
            <Text style={styles.cattyAvatarText}>C</Text>
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CATTY ONLINE</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Pratique ingles comigo
            </Text>
            <Text style={styles.subtitle}>
              Historico protegido e compartilhado com o site
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
          ref={scrollRef}
          refreshControl={
            <RefreshControl
              onRefresh={() => void history.refetch()}
              refreshing={history.isRefetching}
              tintColor={colors.brand}
            />
          }
        >
          {history.isPending ? (
            <View
              accessibilityLabel="Carregando conversa com a Catty"
              accessible
              style={styles.loadingCard}
            >
              <ActivityIndicator color={colors.brand} size="large" />
              <Text style={styles.loadingText}>
                A Catty esta buscando seu historico...
              </Text>
            </View>
          ) : null}

          {history.isError ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <Text style={styles.errorText}>
                {history.error instanceof Error
                  ? history.error.message
                  : "Nao foi possivel abrir a Catty."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void history.refetch()}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {!history.isPending &&
          !history.isError &&
          visibleMessages.length === 0 ? (
            <View style={styles.introCard}>
              <Text style={styles.introTitle}>
                Miauw! Vamos aprender juntas?
              </Text>
              <Text style={styles.introText}>
                Posso ajudar com vocabulario, frases, conversa e pistas de
                homework. Nunca entrego resposta pronta.
              </Text>
              <View style={styles.quickList}>
                {quickPrompts.map((prompt) => (
                  <Pressable
                    accessibilityRole="button"
                    key={prompt}
                    onPress={() => setMessage(prompt)}
                    style={styles.quickButton}
                  >
                    <Text style={styles.quickButtonText}>{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {visibleMessages.map((item) => {
            const mine = item.from === "user";

            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  mine ? styles.messageRowMine : null,
                ]}
              >
                <View style={[styles.bubble, mine ? styles.bubbleMine : null]}>
                  {!mine ? (
                    <Text style={styles.messageAuthor}>Catty</Text>
                  ) : null}
                  <Text
                    selectable
                    style={[
                      styles.messageText,
                      mine ? styles.messageTextMine : null,
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {send.isPending ? (
            <>
              <View style={[styles.messageRow, styles.messageRowMine]}>
                <View style={[styles.bubble, styles.bubbleMine]}>
                  <Text style={[styles.messageText, styles.messageTextMine]}>
                    {send.variables}
                  </Text>
                </View>
              </View>
              <View style={styles.messageRow}>
                <View
                  accessibilityLabel="Catty esta pensando"
                  accessible
                  style={[styles.bubble, styles.thinking]}
                >
                  <ActivityIndicator color={colors.focus} size="small" />
                  <Text style={styles.thinkingText}>Catty esta pensando...</Text>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.composerWrap}>
          {send.isError ? (
            <Text accessibilityRole="alert" style={styles.sendError}>
              {send.error instanceof Error
                ? send.error.message
                : "Nao foi possivel enviar agora."}
            </Text>
          ) : null}
          <View style={styles.composer}>
            <TextInput
              accessibilityLabel="Mensagem para a Catty"
              editable={!send.isPending}
              maxLength={600}
              multiline
              onChangeText={(value) => {
                setMessage(value);
                send.reset();
              }}
              onSubmitEditing={submit}
              placeholder="Digite uma palavra, frase ou duvida..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="send"
              style={styles.input}
              value={message}
            />
            <Pressable
              accessibilityLabel="Enviar para a Catty"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={submit}
              style={[
                styles.sendButton,
                !canSend ? styles.sendButtonDisabled : null,
              ]}
            >
              {send.isPending ? (
                <ActivityIndicator color={colors.brandDeep} />
              ) : (
                <Text style={styles.sendText}>↑</Text>
              )}
            </Pressable>
          </View>
          <View style={styles.composerMeta}>
            <Text style={styles.helperText}>
              Nao envie senhas, documentos ou dados financeiros.
            </Text>
            <Text style={styles.counter}>{message.length}/600</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
