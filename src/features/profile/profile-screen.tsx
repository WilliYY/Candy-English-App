import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileStudentProfile,
  MobileStudentProfileUpdate,
} from "@/lib/api/mobile-api-client";
import {
  pickAvatarForUpload,
  removeAvatarUploadTemp,
} from "@/lib/files/avatar-upload";
import { ProfileFormField } from "@/features/profile/profile-form-field";
import {
  emptyProfileForm,
  profileFormSchema,
  profileToFormValues,
  type ProfileFormValues,
} from "@/features/profile/profile-schema";
import { styles } from "@/features/profile/profile-screen.styles";

type ProfileClient = {
  getStudentAvatarSource: () => Promise<{
    headers: Record<string, string>;
    uri: string;
  }>;
  getStudentProfile: () => Promise<MobileStudentProfile>;
  updateStudentProfile: (input: MobileStudentProfileUpdate) => Promise<{
    message: string;
    ok: true;
    profile: MobileStudentProfile;
  }>;
  uploadStudentAvatar: (input: {
    mimeType: "image/jpeg";
    name: string;
    uri: string;
  }) => Promise<{
    avatarRevision: string | null;
    message: string;
    ok: true;
  }>;
};

type ProfileScreenProps = {
  client?: ProfileClient;
  onBack: () => void;
  refreshUser: () => Promise<unknown>;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProfileScreen({
  client,
  onBack,
  refreshUser,
}: ProfileScreenProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const queryClient = useQueryClient();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [notice, setNotice] = useState<{
    error: boolean;
    message: string;
  } | null>(null);
  const profile = useQuery({
    queryFn: () => api.getStudentProfile(),
    queryKey: ["student-profile"],
  });
  const avatar = useQuery({
    enabled: Boolean(profile.data?.hasAvatar),
    queryFn: () => api.getStudentAvatarSource(),
    queryKey: ["student-avatar", profile.data?.avatarRevision],
  });
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<ProfileFormValues>({
    defaultValues: emptyProfileForm,
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    if (profile.data) {
      reset(profileToFormValues(profile.data));
    }
  }, [profile.data, reset]);

  const save = handleSubmit(async (values) => {
    setNotice(null);

    try {
      const result = await api.updateStudentProfile(values);
      queryClient.setQueryData(["student-profile"], result.profile);
      await refreshUser();
      setNotice({ error: false, message: result.message });
    } catch (error) {
      setNotice({
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar seu perfil agora.",
      });
    }
  });

  async function changeAvatar() {
    setNotice(null);
    setAvatarBusy(true);
    let upload: Awaited<ReturnType<typeof pickAvatarForUpload>> = null;

    try {
      upload = await pickAvatarForUpload();

      if (!upload) {
        return;
      }

      const result = await api.uploadStudentAvatar(upload);
      await profile.refetch();
      await queryClient.invalidateQueries({ queryKey: ["student-avatar"] });
      setAvatarFailed(false);
      setNotice({ error: false, message: result.message });
    } catch (error) {
      setNotice({
        error: true,
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar sua foto agora.",
      });
    } finally {
      if (upload) {
        await removeAvatarUploadTemp(upload.uri);
      }
      setAvatarBusy(false);
    }
  }

  const currentProfile = profile.data;
  const showAvatar =
    currentProfile?.hasAvatar && avatar.data && !avatarFailed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                void profile.refetch();
              }}
              refreshing={profile.isRefetching}
            />
          }
        >
          <Pressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={onBack}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← Voltar</Text>
          </Pressable>

          <Text style={styles.eyebrow}>MEU PERFIL</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Seus dados Candy
          </Text>
          <Text style={styles.description}>
            O que você atualizar aqui também aparece no site.
          </Text>

          {profile.isPending ? (
            <View style={styles.statusCard}>
              <ActivityIndicator />
              <Text style={styles.statusText}>Carregando seu perfil...</Text>
            </View>
          ) : null}

          {profile.isError ? (
            <View accessibilityRole="alert" style={styles.statusCard}>
              <Text style={styles.statusText}>
                {profile.error instanceof Error
                  ? profile.error.message
                  : "Não foi possível carregar seu perfil."}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void profile.refetch();
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}

          {currentProfile ? (
            <>
              <View style={styles.avatarCard}>
                {showAvatar ? (
                  <Image
                    accessibilityLabel="Sua foto de perfil"
                    cachePolicy="none"
                    onError={() => setAvatarFailed(true)}
                    source={avatar.data}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    accessibilityLabel="Avatar com suas iniciais"
                    style={[styles.avatar, styles.avatarFallback]}
                  >
                    <Text style={styles.avatarInitials}>
                      {initials(currentProfile.name)}
                    </Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  disabled={avatarBusy}
                  onPress={() => {
                    void changeAvatar();
                  }}
                  style={({ pressed }) => [
                    styles.avatarButton,
                    pressed ? styles.avatarButtonPressed : null,
                  ]}
                >
                  <Text style={styles.avatarButtonText}>
                    {avatarBusy ? "Preparando foto..." : "Escolher foto"}
                  </Text>
                </Pressable>
                <Text style={styles.avatarHint}>
                  JPG, PNG ou WebP. O app recorta e otimiza antes do envio.
                </Text>
              </View>

              <View style={styles.readonlyRow}>
                <Text style={styles.readonlyLabel}>Email de acesso</Text>
                <Text style={styles.readonlyValue}>{currentProfile.email}</Text>
                <Text style={styles.readonlyLabel}>Nível</Text>
                <Text style={styles.readonlyValue}>
                  {currentProfile.level ?? "Ainda não definido"}
                </Text>
              </View>

              <View style={styles.form}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dados principais</Text>
                  <ProfileFormField
                    autoComplete="name"
                    control={control}
                    error={errors.name?.message}
                    label="Nome completo"
                    name="name"
                    placeholder="Seu nome"
                  />
                  <ProfileFormField
                    autoComplete="tel"
                    control={control}
                    error={errors.phone?.message}
                    inputMode="tel"
                    label="Telefone"
                    name="phone"
                    placeholder="(00) 00000-0000"
                  />
                  <ProfileFormField
                    autoComplete="street-address"
                    control={control}
                    error={errors.address?.message}
                    label="Endereço"
                    multiline
                    name="address"
                    placeholder="Rua, número, bairro e cidade"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Dados do aluno</Text>
                  <ProfileFormField
                    control={control}
                    error={errors.birthDate?.message}
                    inputMode="numeric"
                    label="Data de nascimento"
                    name="birthDate"
                    placeholder="AAAA-MM-DD"
                  />
                  <ProfileFormField
                    control={control}
                    error={errors.gender?.message}
                    label="Como você se identifica"
                    name="gender"
                  />
                  <ProfileFormField
                    autoComplete="tel"
                    control={control}
                    error={errors.studentPhone?.message}
                    inputMode="tel"
                    label="Telefone principal do aluno"
                    name="studentPhone"
                  />
                  <ProfileFormField
                    autoComplete="tel"
                    control={control}
                    error={errors.studentPhoneAlt?.message}
                    inputMode="tel"
                    label="Telefone alternativo do aluno"
                    name="studentPhoneAlt"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Responsável</Text>
                  <ProfileFormField
                    control={control}
                    error={errors.motherName?.message}
                    label="Nome do responsável"
                    name="motherName"
                  />
                  <ProfileFormField
                    autoComplete="tel"
                    control={control}
                    error={errors.motherPhone?.message}
                    inputMode="tel"
                    label="Telefone do responsável"
                    name="motherPhone"
                  />
                  <ProfileFormField
                    control={control}
                    error={errors.guardianDocument?.message}
                    label="Documento ou observação do responsável"
                    multiline
                    name="guardianDocument"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Observações</Text>
                  <ProfileFormField
                    control={control}
                    error={errors.notes?.message}
                    label="Informações importantes"
                    multiline
                    name="notes"
                  />
                </View>

                {notice ? (
                  <View
                    accessibilityRole="alert"
                    style={[
                      styles.notice,
                      notice.error ? styles.noticeError : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.noticeText,
                        notice.error ? styles.noticeErrorText : null,
                      ]}
                    >
                      {notice.message}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={() => {
                    void save();
                  }}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed ? styles.saveButtonPressed : null,
                  ]}
                >
                  <Text style={styles.saveButtonText}>
                    {isSubmitting ? "Salvando..." : "Salvar perfil"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
