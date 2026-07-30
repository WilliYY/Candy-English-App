import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { styles } from "@/features/auth/sign-in-screen.styles";

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu email.")
    .email("Informe um email válido.")
    .transform((email) => email.toLowerCase()),
  password: z
    .string()
    .min(1, "Informe sua senha.")
    .min(8, "A senha precisa ter pelo menos 8 caracteres.")
    .max(128, "A senha pode ter no máximo 128 caracteres."),
});

export type SignInCredentials = z.infer<typeof credentialsSchema>;

type SignInScreenProps = {
  onBack?: () => void;
  onSubmit: (credentials: SignInCredentials) => Promise<void>;
};

export function SignInScreen({ onBack, onSubmit }: SignInScreenProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<SignInCredentials>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(credentialsSchema),
  });

  const submit = handleSubmit(async (credentials) => {
    setSubmitError(null);

    try {
      await onSubmit(credentials);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar agora.",
      );
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {onBack ? (
            <Pressable
              accessibilityLabel="Voltar"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onBack}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Voltar</Text>
            </Pressable>
          ) : null}

          <Image
            accessibilityLabel="Candy English"
            contentFit="contain"
            source={require("../../../assets/images/candy-logo.png")}
            style={styles.logo}
          />

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>ACESSO CANDY ENGLISH</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Entre na sua conta
            </Text>
            <Text style={styles.description}>
              Use o mesmo email e a mesma senha do site.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={!isSubmitting}
                    inputMode="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="voce@exemplo.com"
                    style={[
                      styles.input,
                      errors.email ? styles.inputError : null,
                    ]}
                    textContentType="emailAddress"
                    value={value}
                  />
                )}
              />
              {errors.email?.message ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {errors.email.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    accessibilityLabel="Senha"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    editable={!isSubmitting}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Sua senha"
                    secureTextEntry
                    style={[
                      styles.input,
                      errors.password ? styles.inputError : null,
                    ]}
                    textContentType="password"
                    value={value}
                  />
                )}
              />
              {errors.password?.message ? (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            {submitError ? (
              <View accessibilityRole="alert" style={styles.submitError}>
                <Text style={styles.submitErrorText}>{submitError}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar"
              disabled={isSubmitting}
              onPress={submit}
              style={({ pressed }) => [
                styles.submitButton,
                pressed && !isSubmitting ? styles.submitButtonPressed : null,
                isSubmitting ? styles.submitButtonDisabled : null,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.securityNote}>
            Sua senha é enviada com conexão segura e nunca fica salva no app.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
