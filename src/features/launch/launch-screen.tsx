import { Image } from "expo-image";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "@/features/launch/launch-screen.styles";

type LaunchScreenProps = {
  onSignIn: () => void;
};

const roles = [
  {
    title: "Aluno",
    detail: "Aulas, atividades e evolução",
    marker: "A",
  },
  {
    title: "Professora",
    detail: "Turmas, agenda e acompanhamento",
    marker: "P",
  },
  {
    title: "Administração",
    detail: "Operação, equipe e indicadores",
    marker: "C",
  },
] as const;

export function LaunchScreen({ onSignIn }: LaunchScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <Image
            accessibilityLabel="Candy English"
            contentFit="contain"
            source={require("../../../assets/images/candy-logo.png")}
            style={styles.logo}
          />
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Site + app</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>SEU INGLÊS CONTINUA AQUI</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Um só Candy English
          </Text>
          <Text style={styles.description}>
            Site e aplicativo trabalhando juntos, com a mesma conta e seus
            dados sempre atualizados.
          </Text>
        </View>

        <View accessibilityLabel="Áreas do aplicativo" style={styles.rolePath}>
          <View style={styles.pathLine} />
          {roles.map((role) => (
            <View key={role.title} style={styles.roleRow}>
              <View style={styles.roleMarker}>
                <Text style={styles.roleMarkerText}>{role.marker}</Text>
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDetail}>{role.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.cattyStage}>
          <View style={styles.cattyCopy}>
            <Text style={styles.cattyLabel}>A CATTY VAI COM VOCÊ</Text>
            <Text style={styles.cattyText}>
              Entre com a conta que você já usa no Candy English.
            </Text>
          </View>
          <Image
            accessibilityLabel="Catty, mascote do Candy English"
            contentFit="contain"
            source={require("../../../assets/images/catty.jpg")}
            style={styles.catty}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Entrar no Candy English"
          onPress={onSignIn}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>Entrar no Candy English</Text>
          <Text aria-hidden style={styles.buttonArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.securityNote}>
          Acesso protegido • dados sincronizados
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
