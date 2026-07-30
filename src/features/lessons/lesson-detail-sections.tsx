import { Pressable, Text, View } from "react-native";

import { styles } from "@/features/lessons/lesson-detail-sections.styles";
import type { MobileLesson } from "@/lib/api/mobile-api-client";

type LessonDetailSectionsProps = {
  homeworks: MobileLesson["homeworks"];
  onOpenHomework?: (homeworkId: string) => void;
  vocabularyItems: MobileLesson["vocabularyItems"];
};

function submissionLabel(status: string | null) {
  if (status === "REVIEWED") {
    return "Corrigida";
  }

  if (status === "SUBMITTED") {
    return "Entregue";
  }

  if (status === "RETURNED") {
    return "Devolvida";
  }

  if (status === "DRAFT") {
    return "Rascunho";
  }

  return "Pendente";
}

function formatDueDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LessonDetailSections({
  homeworks,
  onOpenHomework,
  vocabularyItems,
}: LessonDetailSectionsProps) {
  return (
    <>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          Vocabulário
        </Text>
        {vocabularyItems.length === 0 ? (
          <Text style={styles.empty}>Sem vocabulário nesta aula.</Text>
        ) : (
          <View style={styles.list}>
            {vocabularyItems.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text selectable style={styles.term}>
                  {item.term}
                </Text>
                <Text selectable style={styles.translation}>
                  {item.translation}
                </Text>
                {item.example ? (
                  <Text selectable style={styles.example}>
                    “{item.example}”
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          Homework desta aula
        </Text>
        {homeworks.length === 0 ? (
          <Text style={styles.empty}>Nenhuma homework vinculada.</Text>
        ) : (
          <View style={styles.list}>
            {homeworks.map((homework) => {
              const content = (
                <>
                  <View style={styles.homeworkTop}>
                    <Text style={styles.homeworkTitle}>{homework.title}</Text>
                    <Text style={styles.status}>
                      {submissionLabel(homework.submissionStatus)}
                    </Text>
                  </View>
                  <Text style={styles.dueDate}>
                    Prazo: {formatDueDate(homework.dueDate)}
                  </Text>
                </>
              );

              return onOpenHomework ? (
                <Pressable
                  accessibilityLabel={`Abrir homework ${homework.title}`}
                  accessibilityRole="button"
                  key={homework.id}
                  onPress={() => onOpenHomework(homework.id)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  {content}
                  <Text style={styles.open}>Abrir atividade →</Text>
                </Pressable>
              ) : (
                <View key={homework.id} style={styles.row}>
                  {content}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </>
  );
}
