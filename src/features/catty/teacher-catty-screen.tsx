import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/catty/teacher-catty-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import type {
  MobileTeacherCattyArtifactStatus,
  MobileTeacherCattyLearningCategory,
  MobileTeacherCattyManagement,
  TeacherCattyArtifactInput,
  TeacherCattyArtifactStatusInput,
  TeacherCattyLearningInput,
} from "@/lib/api/mobile-api-client";
import { ApiError } from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type TeacherCattyClient = {
  createTeacherCattyLearning: (
    input: TeacherCattyLearningInput,
  ) => Promise<{ message: string; ok: true }>;
  getTeacherCattyManagement: () => Promise<MobileTeacherCattyManagement>;
  saveTeacherCattyArtifact: (
    input: TeacherCattyArtifactInput,
  ) => Promise<{ message: string; ok: true }>;
  updateTeacherCattyArtifactStatus: (
    artifactId: string,
    input: TeacherCattyArtifactStatusInput,
  ) => Promise<{ message: string; ok: true }>;
};

type TeacherCattyScreenProps = {
  client?: TeacherCattyClient;
  onBack: () => void;
};

const categoryLabels: Record<MobileTeacherCattyLearningCategory, string> = {
  APPROVED_CORRECTION: "Correcao aprovada",
  BAD_REPLY: "Resposta a evitar",
  CATTY_PHRASE: "Frase da Catty",
  COMMON_QUESTION: "Pergunta comum",
  HOMEWORK_EXAMPLE: "Exemplo de tarefa",
  IDEAL_REPLY: "Resposta ideal",
  STUDENT_GUIDANCE: "Orientacao ao aluno",
  TEACHER_GUIDANCE: "Orientacao a teacher",
  VOCABULARY: "Vocabulario",
};

const statusLabels = {
  APPROVED: "Aprovado",
  ARCHIVED: "Arquivado",
  PENDING: "Aguardando admin",
  REJECTED: "Recusado",
} as const;

function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir agora. Tente novamente.";
}

function lines(values: string[]) {
  return values.join("\n");
}

export function TeacherCattyScreen({
  client,
  onBack,
}: TeacherCattyScreenProps) {
  const api = useMemo(() => client ?? getMobileApi(), [client]);
  const queryClient = useQueryClient();
  const queryKey = ["teacher-catty-management"] as const;
  const management = useQuery({
    queryFn: () => api.getTeacherCattyManagement(),
    queryKey,
  });
  const [section, setSection] = useState<"artifacts" | "learning">("learning");
  const [category, setCategory] =
    useState<MobileTeacherCattyLearningCategory>("VOCABULARY");
  const [learningTitle, setLearningTitle] = useState("");
  const [learningPrompt, setLearningPrompt] = useState("");
  const [learningNotes, setLearningNotes] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [artifactLabel, setArtifactLabel] = useState("");
  const [artifactEmojis, setArtifactEmojis] = useState("");
  const [artifactCatchphrases, setArtifactCatchphrases] = useState("");
  const [artifactSounds, setArtifactSounds] = useState("");
  const [artifactExample, setArtifactExample] = useState("");
  const [artifactTone, setArtifactTone] = useState("");
  const [artifactPrimary, setArtifactPrimary] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };
  const learningMutation = useMutation({
    mutationFn: (input: TeacherCattyLearningInput) =>
      api.createTeacherCattyLearning(input),
    onSuccess: async () => {
      setLearningTitle("");
      setLearningPrompt("");
      setLearningNotes("");
      await refresh();
    },
  });
  const artifactMutation = useMutation({
    mutationFn: (input: TeacherCattyArtifactInput) =>
      api.saveTeacherCattyArtifact(input),
    onSuccess: refresh,
  });
  const statusMutation = useMutation({
    mutationFn: (input: {
      artifactId: string;
      update: TeacherCattyArtifactStatusInput;
    }) => api.updateTeacherCattyArtifactStatus(input.artifactId, input.update),
    onSuccess: refresh,
  });

  function loadArtifact(studentId: string, themeId: string) {
    const data = management.data;
    const existing = data?.artifacts.find(
      (artifact) =>
        artifact.studentId === studentId && artifact.themeId === themeId,
    );
    const theme = data?.themeOptions.find((option) => option.id === themeId);
    setSelectedStudentId(studentId);
    setSelectedThemeId(themeId);
    setArtifactLabel(existing?.label ?? theme?.label ?? "");
    setArtifactEmojis(lines(existing?.emojis ?? theme?.emojis ?? []));
    setArtifactCatchphrases(
      lines(existing?.catchphrases ?? theme?.catchphrases ?? []),
    );
    setArtifactSounds(lines(existing?.sounds ?? theme?.sounds ?? []));
    setArtifactExample(existing?.example ?? "");
    setArtifactTone(existing?.toneRule ?? "");
    setArtifactPrimary(existing?.isPrimary ?? false);
  }

  function openArtifacts() {
    setSection("artifacts");
    const studentId = selectedStudentId || management.data?.students[0]?.id || "";
    const themeId = selectedThemeId || management.data?.themeOptions[0]?.id || "";
    if (studentId && themeId) loadArtifact(studentId, themeId);
  }

  const selectedArtifacts =
    management.data?.artifacts.filter(
      (artifact) => artifact.studentId === selectedStudentId,
    ) ?? [];
  const canSendLearning =
    learningTitle.trim().length >= 3 &&
    (learningNotes.trim().length > 0 || learningPrompt.trim().length > 0) &&
    !learningMutation.isPending;
  const hasArtifactContent =
    artifactEmojis.trim().length > 0 ||
    artifactCatchphrases.trim().length > 0 ||
    artifactSounds.trim().length > 0 ||
    artifactExample.trim().length > 0;
  const canSaveArtifact =
    selectedStudentId.length > 0 &&
    selectedThemeId.length > 0 &&
    artifactLabel.trim().length >= 2 &&
    hasArtifactContent &&
    !artifactMutation.isPending;

  function submitLearning() {
    if (!canSendLearning) return;
    learningMutation.mutate({
      category,
      notes: learningNotes.trim() || undefined,
      title: learningTitle.trim(),
      userPrompt: learningPrompt.trim() || undefined,
    });
  }

  function saveArtifact() {
    if (!canSaveArtifact) return;
    artifactMutation.mutate({
      catchphrasesText: artifactCatchphrases,
      emojisText: artifactEmojis,
      example: artifactExample.trim() || undefined,
      isPrimary: artifactPrimary,
      label: artifactLabel.trim(),
      soundsText: artifactSounds,
      status: "ACTIVE",
      targetUserId: selectedStudentId,
      themeId: selectedThemeId,
      toneRule: artifactTone.trim() || undefined,
    });
  }

  function changeStatus(
    artifactId: string,
    status: MobileTeacherCattyArtifactStatus,
    isPrimary?: boolean,
  ) {
    statusMutation.mutate({ artifactId, update: { isPrimary, status } });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar para a conversa com a Catty"
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AREA DA TEACHER</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Catty Learning
          </Text>
          <Text style={styles.subtitle}>
            Ensine com revisao e personalize apenas seus alunos.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => void management.refetch()}
            refreshing={management.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <View style={styles.guardCard}>
          <Text style={styles.guardTitle}>Fluxo seguro e compartilhado</Text>
          <Text style={styles.guardText}>
            Aprendizados ficam pendentes ate um admin aprovar. Artefatos valem
            somente para alunos vinculados a voce e aparecem tambem no site.
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            accessibilityLabel="Ver aprendizados da Catty"
            onPress={() => setSection("learning")}
            style={[styles.tab, section === "learning" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                section === "learning" && styles.tabTextActive,
              ]}
            >
              Aprendizados
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Ver artefatos dos alunos"
            onPress={openArtifacts}
            style={[styles.tab, section === "artifacts" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                section === "artifacts" && styles.tabTextActive,
              ]}
            >
              Artefatos
            </Text>
          </Pressable>
        </View>

        {management.isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.brand} />
            <Text style={styles.stateText}>Carregando Catty Learning...</Text>
          </View>
        ) : null}
        {management.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage(management.error)}</Text>
            <Pressable onPress={() => void management.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {management.data && section === "learning" ? (
          <>
            <View style={styles.metricRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {management.data.approvedLearningCount}
                </Text>
                <Text style={styles.metricLabel}>aprendizados aprovados</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {management.data.learningItems.length}
                </Text>
                <Text style={styles.metricLabel}>sugestoes suas</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Sugerir aprendizado</Text>
              <Text style={styles.fieldLabel}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {management.data.learningCategories.map((item) => (
                    <Pressable
                      accessibilityLabel={"Selecionar " + categoryLabels[item]}
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[styles.chip, category === item && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category === item && styles.chipTextActive,
                        ]}
                      >
                        {categoryLabels[item]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.fieldLabel}>Titulo curto</Text>
              <TextInput
                accessibilityLabel="Titulo do aprendizado"
                maxLength={120}
                onChangeText={setLearningTitle}
                placeholder="Ex.: Explicar palavras com exemplo"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={learningTitle}
              />
              <Text style={styles.fieldLabel}>Pergunta exemplo (opcional)</Text>
              <TextInput
                accessibilityLabel="Pergunta exemplo para a Catty"
                maxLength={500}
                multiline
                onChangeText={setLearningPrompt}
                placeholder="O que o aluno costuma perguntar?"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textareaSmall]}
                value={learningPrompt}
              />
              <Text style={styles.fieldLabel}>O que a Catty deve aprender</Text>
              <TextInput
                accessibilityLabel="Conteudo do aprendizado"
                maxLength={1000}
                multiline
                onChangeText={setLearningNotes}
                placeholder="Descreva uma orientacao curta, sem dados privados."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.textarea]}
                value={learningNotes}
              />
              <Pressable
                accessibilityLabel="Enviar aprendizado para aprovacao"
                disabled={!canSendLearning}
                onPress={submitLearning}
                style={[
                  styles.primaryButton,
                  !canSendLearning && styles.buttonDisabled,
                ]}
              >
                {learningMutation.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Enviar para aprovacao</Text>
                )}
              </Pressable>
              {learningMutation.data ? (
                <Text style={styles.successText}>{learningMutation.data.message}</Text>
              ) : null}
              {learningMutation.isError ? (
                <Text style={styles.errorText}>
                  {errorMessage(learningMutation.error)}
                </Text>
              ) : null}
            </View>

            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Suas sugestoes</Text>
              {management.data.learningItems.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma sugestao enviada ainda.</Text>
              ) : (
                management.data.learningItems.map((item) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.statusPill}>{statusLabels[item.status]}</Text>
                    </View>
                    <Text style={styles.itemMeta}>{categoryLabels[item.category]}</Text>
                    {item.notes ? <Text style={styles.itemText}>{item.notes}</Text> : null}
                  </View>
                ))
              )}
            </View>
          </>
        ) : null}

        {management.data && section === "artifacts" ? (
          <>
            {management.data.students.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateText}>
                  Vincule um aluno a esta teacher no site antes de criar artefatos.
                </Text>
              </View>
            ) : (
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>Personalizar para um aluno</Text>
                <Text style={styles.fieldLabel}>Aluno vinculado</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {management.data.students.map((student) => (
                      <Pressable
                        accessibilityLabel={"Selecionar aluno " + student.name}
                        key={student.id}
                        onPress={() =>
                          loadArtifact(student.id, selectedThemeId || management.data.themeOptions[0]?.id || "")
                        }
                        style={[
                          styles.chip,
                          selectedStudentId === student.id && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedStudentId === student.id && styles.chipTextActive,
                          ]}
                        >
                          {student.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.fieldLabel}>Tema permitido</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {management.data.themeOptions.map((theme) => (
                      <Pressable
                        accessibilityLabel={"Selecionar tema " + theme.label}
                        key={theme.id}
                        onPress={() => loadArtifact(selectedStudentId, theme.id)}
                        style={[
                          styles.chip,
                          selectedThemeId === theme.id && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selectedThemeId === theme.id && styles.chipTextActive,
                          ]}
                        >
                          {theme.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <Text style={styles.fieldLabel}>Nome do tema</Text>
                <TextInput
                  accessibilityLabel="Nome do artefato"
                  maxLength={64}
                  onChangeText={setArtifactLabel}
                  style={styles.input}
                  value={artifactLabel}
                />
                <Text style={styles.fieldLabel}>Emojis, um por linha</Text>
                <TextInput
                  accessibilityLabel="Emojis do artefato"
                  maxLength={80}
                  multiline
                  onChangeText={setArtifactEmojis}
                  style={[styles.input, styles.textareaSmall]}
                  value={artifactEmojis}
                />
                <Text style={styles.fieldLabel}>Bordoes, um por linha</Text>
                <TextInput
                  accessibilityLabel="Bordoes do artefato"
                  maxLength={420}
                  multiline
                  onChangeText={setArtifactCatchphrases}
                  style={[styles.input, styles.textarea]}
                  value={artifactCatchphrases}
                />
                <Text style={styles.fieldLabel}>Sons leves, um por linha</Text>
                <TextInput
                  accessibilityLabel="Sons do artefato"
                  maxLength={180}
                  multiline
                  onChangeText={setArtifactSounds}
                  style={[styles.input, styles.textareaSmall]}
                  value={artifactSounds}
                />
                <Text style={styles.fieldLabel}>Exemplo e regra de tom (opcionais)</Text>
                <TextInput
                  accessibilityLabel="Exemplo do artefato"
                  maxLength={140}
                  onChangeText={setArtifactExample}
                  placeholder="Ex.: vocabulario de games"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  value={artifactExample}
                />
                <TextInput
                  accessibilityLabel="Regra de tom do artefato"
                  maxLength={220}
                  multiline
                  onChangeText={setArtifactTone}
                  placeholder="Use com leveza e sem repetir em toda resposta."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, styles.textareaSmall]}
                  value={artifactTone}
                />
                <Pressable
                  accessibilityLabel="Alternar artefato principal"
                  onPress={() => setArtifactPrimary((current) => !current)}
                  style={styles.checkRow}
                >
                  <View style={[styles.checkbox, artifactPrimary && styles.checkboxActive]}>
                    <Text style={styles.checkmark}>{artifactPrimary ? "✓" : ""}</Text>
                  </View>
                  <Text style={styles.checkText}>Usar como tema principal</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Salvar artefato da Catty"
                  disabled={!canSaveArtifact}
                  onPress={saveArtifact}
                  style={[
                    styles.primaryButton,
                    !canSaveArtifact && styles.buttonDisabled,
                  ]}
                >
                  {artifactMutation.isPending ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Salvar para o aluno</Text>
                  )}
                </Pressable>
                {artifactMutation.data ? (
                  <Text style={styles.successText}>{artifactMutation.data.message}</Text>
                ) : null}
                {artifactMutation.isError ? (
                  <Text style={styles.errorText}>
                    {errorMessage(artifactMutation.error)}
                  </Text>
                ) : null}
              </View>
            )}

            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>Artefatos deste aluno</Text>
              {selectedArtifacts.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum artefato salvo.</Text>
              ) : (
                selectedArtifacts.map((artifact) => (
                  <View key={artifact.id} style={styles.itemCard}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemTitle}>{artifact.label}</Text>
                      <Text style={styles.statusPill}>
                        {artifact.status === "ACTIVE" ? "Ativo" : "Inativo"}
                      </Text>
                    </View>
                    <Text style={styles.itemText}>
                      {[...artifact.emojis, ...artifact.catchphrases].join(" · ")}
                    </Text>
                    <View style={styles.actionRow}>
                      <Pressable
                        accessibilityLabel={
                          artifact.status === "ACTIVE"
                            ? "Desativar " + artifact.label
                            : "Ativar " + artifact.label
                        }
                        disabled={statusMutation.isPending}
                        onPress={() =>
                          changeStatus(
                            artifact.id,
                            artifact.status === "ACTIVE" ? "DISABLED" : "ACTIVE",
                            artifact.status === "ACTIVE" ? false : artifact.isPrimary,
                          )
                        }
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>
                          {artifact.status === "ACTIVE" ? "Desativar" : "Ativar"}
                        </Text>
                      </Pressable>
                      {artifact.status === "ACTIVE" && !artifact.isPrimary ? (
                        <Pressable
                          accessibilityLabel={"Definir " + artifact.label + " como principal"}
                          disabled={statusMutation.isPending}
                          onPress={() => changeStatus(artifact.id, "ACTIVE", true)}
                          style={styles.secondaryButton}
                        >
                          <Text style={styles.secondaryButtonText}>Tornar principal</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
              {statusMutation.isError ? (
                <Text style={styles.errorText}>{errorMessage(statusMutation.error)}</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
