import * as Crypto from "expo-crypto";
import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "@/features/teacher-lessons/teacher-lesson-editor-screen.styles";
import type { TeacherLessonVocabularyDraft } from "@/features/teacher-lessons/teacher-lesson-form-utils";

type TeacherLessonVocabularyEditorProps = {
  items: TeacherLessonVocabularyDraft[];
  onChange: (items: TeacherLessonVocabularyDraft[]) => void;
};

export function TeacherLessonVocabularyEditor({
  items,
  onChange,
}: TeacherLessonVocabularyEditorProps) {
  function addItem() {
    if (items.length >= 100) {
      return;
    }

    onChange([
      ...items,
      {
        example: "",
        key: Crypto.randomUUID(),
        term: "",
        translation: "",
      },
    ]);
  }

  function updateItem(
    index: number,
    patch: Partial<TeacherLessonVocabularyDraft>,
  ) {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Vocabulário
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={items.length >= 100}
          onPress={addItem}
          style={({ pressed }) => [
            styles.addButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </Pressable>
      </View>

      {items.map((item, index) => (
        <View key={item.key} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vocabulário {index + 1}</Text>
            <Pressable
              accessibilityLabel={`Remover vocabulário ${index + 1}`}
              accessibilityRole="button"
              onPress={() =>
                onChange(items.filter((_, itemIndex) => itemIndex !== index))
              }
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remover</Text>
            </Pressable>
          </View>

          <View>
            <Text style={styles.label}>Termo</Text>
            <TextInput
              accessibilityLabel={`Termo ${index + 1}`}
              maxLength={120}
              onChangeText={(term) => updateItem(index, { term })}
              placeholder="Ex.: meet"
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={item.term}
            />
          </View>

          <View>
            <Text style={styles.label}>Tradução</Text>
            <TextInput
              accessibilityLabel={`Tradução ${index + 1}`}
              maxLength={160}
              onChangeText={(translation) => updateItem(index, { translation })}
              placeholder="Ex.: conhecer"
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={item.translation}
            />
          </View>

          <View>
            <Text style={styles.label}>Exemplo opcional</Text>
            <TextInput
              accessibilityLabel={`Exemplo ${index + 1}`}
              maxLength={500}
              onChangeText={(example) => updateItem(index, { example })}
              placeholder="Ex.: Nice to meet you."
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={item.example}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
