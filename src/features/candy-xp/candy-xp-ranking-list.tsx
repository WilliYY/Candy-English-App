import { Text, View } from "react-native";

import { styles } from "@/features/candy-xp/candy-xp-screen.styles";
import type { MobileStudentCandyXp } from "@/lib/api/mobile-api-client";

export function CandyXpRankingList({
  ranking,
}: {
  ranking: MobileStudentCandyXp["ranking"];
}) {
  const personalPosition = ranking.currentUser?.position;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Ranking Candy
        </Text>
        <Text style={styles.sectionDescription}>
          {personalPosition
            ? `Você está em ${personalPosition}º entre ${ranking.currentUser?.totalInCategory ?? 0} alunos com XP.`
            : "Ganhe seu primeiro XP para entrar no ranking interno dos alunos."}
        </Text>
      </View>

      {ranking.topEntries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            O ranking começa assim que os alunos conquistarem XP.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {ranking.topEntries.map((entry) => (
            <View
              accessibilityLabel={`${entry.position}º lugar, ${entry.name}, ${entry.totalXp} XP`}
              accessible
              key={`${entry.position}-${entry.name}`}
              style={[
                styles.rankingEntry,
                entry.isCurrentUser ? styles.rankingCurrent : null,
              ]}
            >
              <View style={styles.rankingPosition}>
                <Text style={styles.rankingPositionText}>{entry.position}º</Text>
              </View>
              <View style={styles.rankingNameWrap}>
                <Text style={styles.rankingName}>
                  {entry.name}
                  {entry.isCurrentUser ? " · você" : ""}
                </Text>
                <Text style={styles.rankingLevel}>Nível {entry.level}</Text>
              </View>
              <Text style={styles.rankingXp}>{entry.totalXp} XP</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
