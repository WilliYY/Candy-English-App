import { Alert, Linking, Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing, typeScale } from "@/theme/tokens";

export function PrivacyLink() {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Abre a política de privacidade no navegador"
      onPress={() => {
        void Linking.openURL("https://candyenglish.com.br/privacidade").catch(() => {
          Alert.alert("Privacidade", "Acesse candyenglish.com.br/privacidade no navegador.");
        });
      }}
      style={styles.link}
    >
      <Text style={styles.text}>Privacidade e uso dos dados</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingVertical: spacing.sm },
  text: { color: colors.brand, fontSize: typeScale.caption, fontWeight: "700", textAlign: "center" },
});
