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

import { LessonDetailSections } from "@/features/lessons/lesson-detail-sections";
import { LessonMaterialList } from "@/features/lessons/lesson-material-list";
import { styles } from "@/features/lessons/lesson-screen.styles";
import { getMobileApi } from "@/lib/api/mobile-api";
import { colors } from "@/theme/tokens";

type LessonScreenProps = {
  lessonId: string;
  onBack: () => void;
  onOpenHomework?: (homeworkId: string) => void;
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
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function LessonScreen({
  lessonId,
  onBack,
  onOpenHomework,
}: LessonScreenProps) {
  const [linkError, setLinkError] = useState("");
  const lessonQuery = useQuery({
    enabled: lessonId.length > 0,
    queryFn: () => getMobileApi().getLesson(lessonId),
    queryKey: ["lesson", lessonId],
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
            accessibilityLabel="Carregando aula"
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
            <Text style={styles.eyebrow}>AULA CANDY ENGLISH</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {lesson.title}
            </Text>
            <Text style={styles.metadata}>
              Teacher {lesson.teacherName} ·{" "}
              {formatLessonDate(lesson.scheduledAt)}
            </Text>
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
            <LessonDetailSections
              homeworks={lesson.homeworks}
              onOpenHomework={onOpenHomework}
              vocabularyItems={lesson.vocabularyItems}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
