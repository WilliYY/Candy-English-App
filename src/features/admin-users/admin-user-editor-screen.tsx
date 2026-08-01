import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/admin-users/admin-users.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileAdminUserDetail,
  MobileAdminUserRole,
} from "@/lib/api/mobile-api-client";

type Api = ReturnType<typeof getMobileApi>;
type Client = Pick<Api, "createAdminUser" | "getAdminUser"> &
  Partial<Pick<Api, "updateAdminUser">>;

type Props = {
  client?: Client;
  onBack: () => void;
  onSaved: (userId: string) => void;
  userId?: string;
};

const roles: { label: string; value: MobileAdminUserRole }[] = [
  { label: "Aluno", value: "STUDENT" },
  { label: "Teacher", value: "TEACHER" },
  { label: "Admin", value: "ADMIN" },
];

export function AdminUserEditorScreen({ client, onBack, onSaved, userId }: Props) {
  const api = client ?? getMobileApi();
  const editing = Boolean(userId);
  const detail = useQuery({
    enabled: editing,
    queryFn: () => api.getAdminUser(userId ?? ""),
    queryKey: ["admin-user", userId],
  });

  if (editing && detail.isPending) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Carregando usuario...</Text></View>
      </SafeAreaView>
    );
  }
  if (editing && (detail.isError || !detail.data)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => void detail.refetch()} style={styles.stateCard}>
          <Text style={styles.stateTitle}>Usuario indisponivel</Text>
          <Text style={styles.stateText}>Toque para tentar novamente.</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <AdminUserEditorForm
      api={api}
      initialUser={detail.data}
      key={detail.data?.updatedAt ?? "new-user"}
      onBack={onBack}
      onSaved={onSaved}
      userId={userId}
    />
  );
}

type FormProps = {
  api: Client;
  initialUser?: MobileAdminUserDetail;
  onBack: () => void;
  onSaved: (userId: string) => void;
  userId?: string;
};

function AdminUserEditorForm({ api, initialUser, onBack, onSaved, userId }: FormProps) {
  const queryClient = useQueryClient();
  const editing = Boolean(userId);
  const [name, setName] = useState(initialUser?.name ?? "");
  const [email, setEmail] = useState(initialUser?.email ?? "");
  const [phone, setPhone] = useState(initialUser?.phone ?? "");
  const [address, setAddress] = useState(initialUser?.address ?? "");
  const [level, setLevel] = useState(initialUser?.studentProfile?.level ?? "");
  const [bio, setBio] = useState(initialUser?.teacherProfile?.bio ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<MobileAdminUserRole>(
    initialUser?.role ?? "STUDENT",
  );
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedName.length < 2 || !normalizedEmail.includes("@")) {
        throw new Error("Informe nome e email validos.");
      }
      if (!editing) {
        if (password.length < 8 || password !== confirmPassword) {
          throw new Error("A senha deve ter 8 caracteres e as confirmacoes devem ser iguais.");
        }
        return api.createAdminUser({
          address: address.trim() || undefined,
          bio: role === "TEACHER" ? bio.trim() || undefined : undefined,
          confirmPassword,
          email: normalizedEmail,
          level: role === "STUDENT" ? level.trim() || undefined : undefined,
          name: normalizedName,
          password,
          phone: phone.trim() || undefined,
          role,
        });
      }
      if (!initialUser || !api.updateAdminUser || !userId) {
        throw new Error("Usuario ainda nao foi carregado.");
      }
      return api.updateAdminUser(userId, {
        address: address.trim() || undefined,
        bio: role === "TEACHER" ? bio.trim() || undefined : undefined,
        email: normalizedEmail,
        expectedUpdatedAt: initialUser.updatedAt,
        level: role === "STUDENT" ? level.trim() || undefined : undefined,
        name: normalizedName,
        phone: phone.trim() || undefined,
      });
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Nao foi possivel salvar.");
    },
    onSuccess: async (result) => {
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      onSaved(result.userId);
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>Voltar</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>ADMIN · {editing ? "EDITAR" : "NOVO USUARIO"}</Text>
        <Text accessibilityRole="header" style={styles.title}>
          {editing ? "Atualizar cadastro" : "Criar acesso"}
        </Text>
        <Text style={styles.subtitle}>
          {editing
            ? "A role permanece protegida; altere somente os dados permitidos."
            : "O acesso nasce no mesmo banco usado pelo site e pelo aplicativo."}
        </Text>

        {!editing ? (
          <>
            <Text style={styles.formLabel}>PERFIL</Text>
            <View style={styles.chips}>
              {roles.map((option) => {
                const selected = role === option.value;
                return (
                  <Pressable
                    accessibilityLabel={`Selecionar perfil ${option.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.value}
                    onPress={() => setRole(option.value)}
                    style={[styles.chip, selected ? styles.chipSelected : null]}
                  >
                    <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.formLabel}>NOME</Text>
        <TextInput accessibilityLabel="Nome do usuario" onChangeText={setName} style={styles.formInput} value={name} />
        <Text style={styles.formLabel}>EMAIL</Text>
        <TextInput accessibilityLabel="Email do usuario" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={styles.formInput} value={email} />
        <Text style={styles.formLabel}>TELEFONE</Text>
        <TextInput accessibilityLabel="Telefone do usuario" keyboardType="phone-pad" onChangeText={setPhone} style={styles.formInput} value={phone} />
        <Text style={styles.formLabel}>ENDERECO</Text>
        <TextInput accessibilityLabel="Endereco do usuario" onChangeText={setAddress} style={styles.formInput} value={address} />

        {role === "STUDENT" ? (
          <>
            <Text style={styles.formLabel}>NIVEL DE INGLES</Text>
            <TextInput accessibilityLabel="Nivel do aluno" onChangeText={setLevel} style={styles.formInput} value={level} />
          </>
        ) : null}
        {role === "TEACHER" ? (
          <>
            <Text style={styles.formLabel}>BIO DA TEACHER</Text>
            <TextInput accessibilityLabel="Bio da teacher" multiline onChangeText={setBio} style={[styles.formInput, styles.formInputMultiline]} value={bio} />
          </>
        ) : null}
        {!editing ? (
          <>
            <Text style={styles.formLabel}>SENHA TEMPORARIA</Text>
            <TextInput accessibilityLabel="Senha temporaria" onChangeText={setPassword} secureTextEntry style={styles.formInput} textContentType="newPassword" value={password} />
            <Text style={styles.formLabel}>CONFIRMAR SENHA</Text>
            <TextInput accessibilityLabel="Confirmar senha temporaria" onChangeText={setConfirmPassword} secureTextEntry style={styles.formInput} textContentType="newPassword" value={confirmPassword} />
          </>
        ) : null}

        {formError ? (
          <Text style={styles.formError}>
            {formError}
          </Text>
        ) : null}
        <Pressable
          accessibilityLabel={editing ? "Salvar alteracoes do usuario" : "Salvar novo usuario"}
          accessibilityRole="button"
          disabled={save.isPending || (editing && !initialUser)}
          onPress={() => save.mutate()}
          style={[styles.submitButton, save.isPending ? styles.submitButtonDisabled : null]}
        >
          <Text style={styles.submitButtonText}>{save.isPending ? "Salvando..." : "Salvar"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
