import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "@/features/teacher-lessons/teacher-lesson-editor-screen.styles";
import type { TeacherLessonFormState } from "@/features/teacher-lessons/teacher-lesson-form-utils";
import type { MobileTeacherLessonOptions } from "@/lib/api/mobile-api-client";

type TeacherLessonEditorFieldsProps = {
  form: TeacherLessonFormState;
  onChange: (form: TeacherLessonFormState) => void;
  options: MobileTeacherLessonOptions;
};

const statuses = [
  { label: "Rascunho", value: "DRAFT" as const },
  { label: "Publicada", value: "PUBLISHED" as const },
  { label: "Arquivada", value: "ARCHIVED" as const },
];

export function TeacherLessonEditorFields({
  form,
  onChange,
  options,
}: TeacherLessonEditorFieldsProps) {
  return (
    <>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Informações da aula
        </Text>
        <View style={styles.card}>
          <View>
            <Text style={styles.label}>Título</Text>
            <TextInput
              accessibilityLabel="Título da aula"
              autoCapitalize="sentences"
              maxLength={160}
              onChangeText={(title) => onChange({ ...form, title })}
              placeholder="Ex.: Conversation practice"
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={form.title}
            />
          </View>

          <View>
            <Text style={styles.label}>Resumo</Text>
            <TextInput
              accessibilityLabel="Resumo da aula"
              maxLength={1200}
              multiline
              onChangeText={(description) =>
                onChange({ ...form, description })
              }
              placeholder="Objetivos e observações para esta aula"
              placeholderTextColor="#8A7B91"
              style={[styles.input, styles.multiline]}
              value={form.description}
            />
          </View>

          <View>
            <Text style={styles.label}>Data e horário</Text>
            <TextInput
              accessibilityLabel="Data e horário da aula"
              keyboardType="numbers-and-punctuation"
              maxLength={16}
              onChangeText={(scheduledAt) =>
                onChange({ ...form, scheduledAt })
              }
              placeholder="DD/MM/AAAA HH:mm"
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={form.scheduledAt}
            />
            <Text style={styles.helper}>
              Pode ficar vazio quando a data ainda não foi definida.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Situação
        </Text>
        <View style={styles.choices}>
          {statuses.map((status) => {
            const selected = form.status === status.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={status.value}
                onPress={() => onChange({ ...form, status: status.value })}
                style={({ pressed }) => [
                  styles.choice,
                  selected ? styles.choiceSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    selected ? styles.choiceTextSelected : null,
                  ]}
                >
                  {status.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Público
        </Text>
        <Text style={styles.sectionDescription}>
          Escolha um aluno vinculado ou deixe como turma geral.
        </Text>
        <View style={styles.choices}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: form.studentProfileId === null }}
            onPress={() => onChange({ ...form, studentProfileId: null })}
            style={({ pressed }) => [
              styles.choice,
              form.studentProfileId === null ? styles.choiceSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text
              style={[
                styles.choiceText,
                form.studentProfileId === null
                  ? styles.choiceTextSelected
                  : null,
              ]}
            >
              Turma geral
            </Text>
          </Pressable>

          {options.students.map((student) => {
            const selected = form.studentProfileId === student.id;

            return (
              <Pressable
                accessibilityLabel={`Selecionar ${student.name}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={student.id}
                onPress={() =>
                  onChange({ ...form, studentProfileId: student.id })
                }
                style={({ pressed }) => [
                  styles.choice,
                  selected ? styles.choiceSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <View>
                  <Text
                    style={[
                      styles.studentName,
                      selected ? styles.choiceTextSelected : null,
                    ]}
                  >
                    {student.name}
                  </Text>
                  <Text
                    style={[
                      styles.studentDetail,
                      selected ? styles.choiceTextSelected : null,
                    ]}
                  >
                    {student.level ?? "Nível a definir"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}
