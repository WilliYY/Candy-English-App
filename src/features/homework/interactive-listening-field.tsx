import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from "expo-audio";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMobileApi } from "@/lib/api/mobile-api";
import { colors, radii, spacing, typeScale } from "@/theme/tokens";

type InteractiveListeningFieldProps = {
  fieldId: string;
  homeworkId: string;
  label: string;
};

export function InteractiveListeningField({
  fieldId,
  homeworkId,
  label,
}: InteractiveListeningFieldProps) {
  const player = useAudioPlayer(null, {
    downloadFirst: true,
    updateInterval: 500,
  });
  const status = useAudioPlayerStatus(player);
  const [activeSpeed, setActiveSpeed] = useState<"normal" | "slow">("normal");
  const [loadingSpeed, setLoadingSpeed] = useState<
    "normal" | "slow" | null
  >(null);
  const [error, setError] = useState("");

  async function toggle(speed: "normal" | "slow") {
    if (status.playing && activeSpeed === speed) {
      player.pause();
      return;
    }

    setError("");

    try {
      if (activeSpeed !== speed || !status.isLoaded) {
        setLoadingSpeed(speed);
        await setAudioModeAsync({ playsInSilentMode: true });
        const source = await getMobileApi().getListeningAudioSource(
          homeworkId,
          fieldId,
          speed,
        );
        player.replace(source);
        setActiveSpeed(speed);
      } else if (status.didJustFinish) {
        await player.seekTo(0);
      }

      player.play();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível reproduzir o áudio.",
      );
    } finally {
      setLoadingSpeed(null);
    }
  }

  const loading = loadingSpeed !== null || status.isBuffering;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.help}>
        Ouça a frase em velocidade normal ou mais devagar.
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`${status.playing && activeSpeed === "normal" ? "Pausar" : "Ouvir"} ${label}`}
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void toggle("normal")}
          style={styles.primaryButton}
        >
          {loadingSpeed === "normal" ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.primaryText}>
              {status.playing && activeSpeed === "normal"
                ? "Pausar"
                : "▶ Ouvir"}
            </Text>
          )}
        </Pressable>
        <Pressable
          accessibilityLabel={`${status.playing && activeSpeed === "slow" ? "Pausar" : "Ouvir devagar"} ${label}`}
          accessibilityRole="button"
          disabled={loading}
          onPress={() => void toggle("slow")}
          style={styles.secondaryButton}
        >
          {loadingSpeed === "slow" ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Text style={styles.secondaryText}>
              {status.playing && activeSpeed === "slow"
                ? "Pausar"
                : "Mais devagar"}
            </Text>
          )}
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.coral,
    borderRadius: radii.md,
    gap: spacing.xs,
    padding: spacing.md,
  },
  label: {
    color: colors.text,
    fontSize: typeScale.body,
    fontWeight: "900",
  },
  help: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.brand,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 110,
    paddingHorizontal: spacing.md,
  },
  primaryText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.brand,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 120,
    paddingHorizontal: spacing.md,
  },
  secondaryText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: "900",
  },
  error: {
    color: colors.focus,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
    marginTop: spacing.xs,
  },
});
