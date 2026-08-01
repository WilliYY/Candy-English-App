import * as Crypto from "expo-crypto";
import { Pressable, Text, TextInput, View } from "react-native";

import { styles } from "@/features/teacher-lessons/teacher-lesson-editor-screen.styles";
import type { TeacherLessonMaterialDraft } from "@/features/teacher-lessons/teacher-lesson-form-utils";

type TeacherLessonMaterialEditorProps = {
  materials: TeacherLessonMaterialDraft[];
  onChange: (materials: TeacherLessonMaterialDraft[]) => void;
};

export function TeacherLessonMaterialEditor({
  materials,
  onChange,
}: TeacherLessonMaterialEditorProps) {
  function addMaterial() {
    if (materials.length >= 25) {
      return;
    }

    onChange([
      ...materials,
      {
        content: "",
        key: Crypto.randomUUID(),
        title: "",
        type: "TEXT",
        url: "",
      },
    ]);
  }

  function updateMaterial(
    index: number,
    patch: Partial<TeacherLessonMaterialDraft>,
  ) {
    onChange(
      materials.map((material, itemIndex) =>
        itemIndex === index ? { ...material, ...patch } : material,
      ),
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Materiais
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={materials.length >= 25}
          onPress={addMaterial}
          style={({ pressed }) => [
            styles.addButton,
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionDescription}>
        Adicione textos de estudo ou links externos HTTPS.
      </Text>

      {materials.map((material, index) => (
        <View key={material.key} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Material {index + 1}</Text>
            <Pressable
              accessibilityLabel={`Remover material ${index + 1}`}
              accessibilityRole="button"
              onPress={() =>
                onChange(materials.filter((_, itemIndex) => itemIndex !== index))
              }
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remover</Text>
            </Pressable>
          </View>

          <View style={styles.choices}>
            {(["TEXT", "LINK"] as const).map((type) => {
              const selected = material.type === type;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={type}
                  onPress={() =>
                    updateMaterial(index, {
                      type,
                      url: type === "TEXT" ? "" : material.url,
                    })
                  }
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
                    {type === "TEXT" ? "Texto" : "Link"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View>
            <Text style={styles.label}>Título</Text>
            <TextInput
              accessibilityLabel={`Título do material ${index + 1}`}
              maxLength={160}
              onChangeText={(title) => updateMaterial(index, { title })}
              placeholder="Nome do material"
              placeholderTextColor="#8A7B91"
              style={styles.input}
              value={material.title}
            />
          </View>

          <View>
            <Text style={styles.label}>
              {material.type === "TEXT" ? "Conteúdo" : "Observação opcional"}
            </Text>
            <TextInput
              accessibilityLabel={`Conteúdo do material ${index + 1}`}
              maxLength={4000}
              multiline
              onChangeText={(content) => updateMaterial(index, { content })}
              placeholder="Texto que aparecerá para o aluno"
              placeholderTextColor="#8A7B91"
              style={[styles.input, styles.multiline]}
              value={material.content}
            />
          </View>

          {material.type === "LINK" ? (
            <View>
              <Text style={styles.label}>Link HTTPS</Text>
              <TextInput
                accessibilityLabel={`Link do material ${index + 1}`}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                maxLength={500}
                onChangeText={(url) => updateMaterial(index, { url })}
                placeholder="https://..."
                placeholderTextColor="#8A7B91"
                style={styles.input}
                value={material.url}
              />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
