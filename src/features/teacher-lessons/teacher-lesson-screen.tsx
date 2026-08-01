import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LessonMaterialList } from "@/features/lessons/lesson-material-list";
import { styles } from "@/features/teacher-lessons/teacher-lesson-screen.styles";
import { TeacherLessonSections } from "@/features/teacher-lessons/teacher-lesson-sections";
import { getMobileApi } from "@/lib/api/mobile-api";
import type { MobileTeacherLesson } from "@/lib/api/mobile-api-client";
import { colors } from "@/theme/tokens";

type TeacherLessonScreenProps = {
  lessonId: string;
  onBack: () => void;
  onCreateHomework?: () => void;
  onEdit?: () => void;
  onOpenHomework?: (homeworkId: string) => void;
};

const statusLabels: Record<MobileTeacherLesson["status"], string> = {
  ARCHIVED: "ARQUIVADA",
  DRAFT: "RASCUNHO",
  PUBLISHED: "PUBLICADA",
};

function formatLessonDate(value: string | null) {
  if (!value) {
    return "Data a definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function TeacherLessonScreen({
  lessonId,
  onBack,
  onCreateHomework,
  onEdit,
  onOpenHomework,
}: TeacherLessonScreenProps) {
  const [linkError, setLinkError] = useState("");
  const lessonQuery = useQuery({
    enabled: lessonId.length > 0,
    queryFn: () => getMobileApi().getTeacherLesson(lessonId),
    queryKey: ["teacher-lesson", lessonId],
  });
  const lesson = lessonQuery.data;

  async function openMaterialLink(url: string) {
    setLinkError("");

    try {
      if (!isSafeExternalUrl(url) || !(await Linking.canOpenURL(url))) {
        throw new Error("unsupported");
      }

      await Linking.openURL(url);
    } catch {
      setLinkError("Não foi possível abrir este link com segurança.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.brand]}
            onRefresh={() => void lessonQuery.refetch()}
            refreshing={lessonQuery.isRefetching}
            tintColor={colors.brand}
          />
        }
      >
        <Pressable
          accessibilityLabel="Voltar para aulas"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          <Text style={styles.backText}>← Aulas</Text>
        </Pressable>

        {lessonQuery.isPending ? (
          <ActivityIndicator
            accessibilityLabel="Carregando planejamento da aula"
            color={colors.brand}
            size="large"
            style={styles.loading}
          />
        ) : null}

        {lessonQuery.isError ? (
          <View accessibilityRole="alert" style={styles.error}>
            <Text style={styles.errorTitle}>Aula indisponível</Text>
            <Text style={styles.errorText}>
              Verifique sua conexão e tente novamente.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void lessonQuery.refetch()}
              style={styles.retry}
            >
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {lesson ? (
          <>
            <Text style={styles.eyebrow}>PLANEJAMENTO DA TEACHER</Text>
            <View style={styles.titleRow}>
              <Text accessibilityRole="header" style={styles.title}>
                {lesson.title}
              </Text>
              <Text style={styles.status}>{statusLabels[lesson.status]}</Text>
            </View>
            <Text style={styles.metadata}>
              Teacher {lesson.teacherName} · {formatLessonDate(lesson.scheduledAt)}
            </Text>
            <Text style={styles.audience}>
              {lesson.studentName ? `Aluno: ${lesson.studentName}` : "Turma geral"}
            </Text>
            {onEdit ? (
              <Pressable
                accessibilityRole="button"
                onPress={onEdit}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={styles.editButtonText}>Editar aula</Text>
              </Pressable>
            ) : null}
            {lesson.description ? (
              <Text selectable style={styles.description}>
                {lesson.description}
              </Text>
            ) : null}
            {linkError ? (
              <Text accessibilityRole="alert" style={styles.linkError}>
                {linkError}
              </Text>
            ) : null}

            <LessonMaterialList
              materials={lesson.materials}
              onOpenLink={(url) => void openMaterialLink(url)}
            />
            <TeacherLessonSections
              homeworks={lesson.homeworks}
              onCreateHomework={onCreateHomework}
              onOpenHomework={onOpenHomework}
              vocabularyItems={lesson.vocabularyItems}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
