import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "@/features/teacher-homeworks/teacher-homework-editor-screen.styles";
import type { TeacherHomeworkQuestionDraft } from "@/features/teacher-homeworks/teacher-homework-form-utils";

type Props = {
  createId: () => string;
  onChange: (questions: TeacherHomeworkQuestionDraft[]) => void;
  questions: TeacherHomeworkQuestionDraft[];
};

export function TeacherHomeworkQuestionEditor({
  createId,
  onChange,
  questions,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Perguntas
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={questions.length >= 50}
          onPress={() =>
            onChange([
              ...questions,
              { expectedAnswer: "", id: createId(), prompt: "" },
            ])
          }
          style={[styles.addButton, questions.length >= 50 ? styles.choiceDisabled : null]}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionDescription}>
        A resposta esperada é opcional e fica visível somente para a equipe.
      </Text>
      {questions.map((question, index) => (
        <View key={question.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Pergunta {index + 1}</Text>
            <Pressable
              accessibilityLabel={`Remover pergunta ${index + 1}`}
              accessibilityRole="button"
              onPress={() => onChange(questions.filter(({ id }) => id !== question.id))}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remover</Text>
            </Pressable>
          </View>
          <View>
            <Text style={styles.label}>Enunciado</Text>
            <TextInput
              accessibilityLabel={`Enunciado da pergunta ${index + 1}`}
              maxLength={1000}
              multiline
              onChangeText={(prompt) =>
                onChange(
                  questions.map((item) =>
                    item.id === question.id ? { ...item, prompt } : item,
                  ),
                )
              }
              placeholder="Ex.: How are you today?"
              style={[styles.input, styles.multiline]}
              value={question.prompt}
            />
          </View>
          <View>
            <Text style={styles.label}>Resposta esperada (opcional)</Text>
            <TextInput
              accessibilityLabel={`Resposta esperada da pergunta ${index + 1}`}
              maxLength={1000}
              multiline
              onChangeText={(expectedAnswer) =>
                onChange(
                  questions.map((item) =>
                    item.id === question.id
                      ? { ...item, expectedAnswer }
                      : item,
                  ),
                )
              }
              placeholder="Ajuda para a correção"
              style={[styles.input, styles.multiline]}
              value={question.expectedAnswer}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
