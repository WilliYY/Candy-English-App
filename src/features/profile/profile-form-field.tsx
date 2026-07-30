import {
  Controller,
  type Control,
  type FieldPath,
} from "react-hook-form";
import {
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import type { ProfileFormValues } from "@/features/profile/profile-schema";
import { styles } from "@/features/profile/profile-screen.styles";

type ProfileFormFieldProps = {
  autoComplete?: TextInputProps["autoComplete"];
  control: Control<ProfileFormValues>;
  error?: string;
  inputMode?: TextInputProps["inputMode"];
  label: string;
  multiline?: boolean;
  name: FieldPath<ProfileFormValues>;
  placeholder?: string;
};

export function ProfileFormField({
  autoComplete,
  control,
  error,
  inputMode,
  label,
  multiline,
  name,
  placeholder,
}: ProfileFormFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            accessibilityLabel={label}
            autoCapitalize={name === "name" ? "words" : "sentences"}
            autoComplete={autoComplete}
            autoCorrect={false}
            inputMode={inputMode}
            multiline={multiline}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            style={[
              styles.input,
              multiline ? styles.multilineInput : null,
              error ? styles.inputError : null,
            ]}
            textAlignVertical={multiline ? "top" : "center"}
            value={value}
          />
        )}
      />
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
