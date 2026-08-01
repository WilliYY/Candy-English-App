import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

import { styles } from "@/features/admin-users/admin-users.styles";
import { getMobileApi } from "@/lib/api/mobile-api";

type Client = Pick<
  ReturnType<typeof getMobileApi>,
  "getAdminUser" | "resetAdminUserPassword"
>;

type Props = {
  client?: Client;
  onBack: () => void;
  onSaved: (userId: string) => void;
  userId: string;
};

export function AdminUserPasswordScreen({
  client,
  onBack,
  onSaved,
  userId,
}: Props) {
  const api = client ?? getMobileApi();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const user = useQuery({
    queryFn: () => api.getAdminUser(userId),
    queryKey: ["admin-user", userId],
  });
  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (!user.data) throw new Error("Usuario nao carregado.");
      return api.resetAdminUserPassword(userId, {
        confirmNewPassword,
        confirmPasswordReset: true,
        expectedUpdatedAt: user.data.updatedAt,
        newPassword,
      });
    },
    onSuccess: async () => {
      setNewPassword("");
      setConfirmNewPassword("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-user", userId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      ]);
      onSaved(userId);
    },
  });

  function requestPasswordReset() {
    setFormError(null);
    if (newPassword.length < 8 || newPassword.length > 120) {
      setFormError("A nova senha deve ter entre 8 e 120 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError("As senhas precisam ser iguais.");
      return;
    }
    if (!user.data) return;

    Alert.alert(
      `Redefinir senha de ${user.data.name}?`,
      "A senha atual deixara de funcionar e todas as sessoes abertas serao encerradas.",
      [
        { style: "cancel", text: "Cancelar" },
        {
          onPress: () => passwordMutation.mutate(),
          style: "destructive",
          text: "Redefinir",
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
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
            <Text style={styles.eyebrow}>ADMIN · SEGURANCA</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Redefinir senha
            </Text>
            <Text style={styles.subtitle}>
              Crie uma senha temporaria para {user.data.name}. As sessoes antigas
              serao encerradas imediatamente.
            </Text>
            <View style={styles.identityCard}>
              <Text style={styles.identityName}>{user.data.name}</Text>
              <Text style={styles.identityEmail}>{user.data.email}</Text>
            </View>

            <Text style={styles.formLabel}>NOVA SENHA</Text>
            <TextInput
              accessibilityLabel="Nova senha"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.formInput}
              textContentType="newPassword"
              value={newPassword}
            />
            <Text style={styles.formLabel}>CONFIRMAR NOVA SENHA</Text>
            <TextInput
              accessibilityLabel="Confirmar nova senha"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              style={styles.formInput}
              textContentType="newPassword"
              value={confirmNewPassword}
            />

            {formError || passwordMutation.isError ? (
              <Text style={styles.formError}>
                {formError ??
                  (passwordMutation.error instanceof Error
                    ? passwordMutation.error.message
                    : "Nao foi possivel redefinir a senha.")}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Redefinir senha"
              accessibilityRole="button"
              disabled={passwordMutation.isPending}
              onPress={requestPasswordReset}
              style={[
                styles.submitButton,
                passwordMutation.isPending && styles.submitButtonDisabled,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {passwordMutation.isPending ? "Redefinindo..." : "Redefinir senha"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
