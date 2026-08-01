import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "@/features/teacher-homeworks/teacher-homework-editor-screen.styles";
import type { TeacherHomeworkFormState } from "@/features/teacher-homeworks/teacher-homework-form-utils";
import type { MobileTeacherHomeworkOptions } from "@/lib/api/mobile-api-client";

type Props = {
  assignmentsLocked: boolean;
  form: TeacherHomeworkFormState;
  onChange: (form: TeacherHomeworkFormState) => void;
  options: MobileTeacherHomeworkOptions;
};

const statusChoices = [
  { label: "Rascunho", value: "DRAFT" as const },
  { label: "Publicada", value: "PUBLISHED" as const },
  { label: "Arquivada", value: "ARCHIVED" as const },
];

export function TeacherHomeworkEditorFields({
  assignmentsLocked,
  form,
  onChange,
  options,
}: Props) {
  function toggleStudent(studentId: string) {
    if (assignmentsLocked) return;
    const selected = form.studentProfileIds.includes(studentId);
    onChange({
      ...form,
      studentProfileIds: selected
        ? form.studentProfileIds.filter((id) => id !== studentId)
        : [...form.studentProfileIds, studentId],
    });
  }

  return (
    <>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Dados da tarefa
        </Text>
        <View style={styles.card}>
          <View>
            <Text style={styles.label}>Título</Text>
            <TextInput
              accessibilityLabel="Título da tarefa"
              maxLength={160}
              onChangeText={(title) => onChange({ ...form, title })}
              placeholder="Ex.: Daily conversation"
              style={styles.input}
              value={form.title}
            />
          </View>
          <View>
            <Text style={styles.label}>Instruções</Text>
            <TextInput
              accessibilityLabel="Instruções da tarefa"
              maxLength={2000}
              multiline
              onChangeText={(instructions) =>
                onChange({ ...form, instructions })
              }
              placeholder="Explique o que o aluno deve fazer"
              style={[styles.input, styles.multiline]}
              value={form.instructions}
            />
          </View>
          <View>
            <Text style={styles.label}>Prazo opcional</Text>
            <TextInput
              accessibilityLabel="Prazo da tarefa"
              inputMode="text"
              maxLength={16}
              onChangeText={(dueDate) => onChange({ ...form, dueDate })}
              placeholder="DD/MM/AAAA HH:mm"
              style={styles.input}
              value={form.dueDate}
            />
            <Text style={styles.helper}>Exemplo: 10/08/2026 18:00</Text>
          </View>
          <View>
            <Text style={styles.label}>Situação</Text>
            <View style={styles.choices}>
              {statusChoices.map((choice) => {
                const selected = form.status === choice.value;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={choice.value}
                    onPress={() => onChange({ ...form, status: choice.value })}
                    style={[styles.choice, selected ? styles.choiceSelected : null]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        selected ? styles.choiceTextSelected : null,
                      ]}
                    >
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Aula vinculada
        </Text>
        <Text style={styles.sectionDescription}>
          A tarefa aparecerá dentro desta aula no site e no app.
        </Text>
        <View style={styles.card}>
          {options.lessons.map((lesson) => {
            const selected = form.lessonId === lesson.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                key={lesson.id}
                onPress={() => onChange({ ...form, lessonId: lesson.id })}
                style={[
                  styles.lessonChoice,
                  selected ? styles.lessonSelected : null,
                ]}
              >
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {lesson.status === "PUBLISHED" ? "Publicada" : lesson.status === "DRAFT" ? "Rascunho" : "Arquivada"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Alunos
        </Text>
        <Text style={styles.sectionDescription}>
          {assignmentsLocked
            ? "A seleção está bloqueada porque já existem entregas."
            : "Selecione quem receberá esta tarefa."}
        </Text>
        <View style={styles.choices}>
          {options.students.map((student) => {
            const selected = form.studentProfileIds.includes(student.id);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled: assignmentsLocked }}
                disabled={assignmentsLocked}
                key={student.id}
                onPress={() => toggleStudent(student.id)}
                style={[
                  styles.choice,
                  selected ? styles.choiceSelected : null,
                  assignmentsLocked ? styles.choiceDisabled : null,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    selected ? styles.choiceTextSelected : null,
                  ]}
                >
                  {selected ? "✓ " : ""}{student.name}
                  {student.level ? ` · ${student.level}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
