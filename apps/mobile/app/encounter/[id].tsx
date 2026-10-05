import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BackButton, Body, Quote, Row, Screen, SectionTitle, Title } from "../../components/ui";
import { formatDateTime, getClaim, getEncounter, speakerLabel, subjectLabel } from "../lib/data";
import { colors, space, type } from "../lib/theme";

// Encounter detail. The extracted claims stand in as the transcript.
export default function EncounterDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enc = id ? getEncounter(id) : undefined;

  if (!enc) {
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        <Title>We couldn't find that consultation</Title>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.h1} accessibilityRole="header">
        {speakerLabel(enc.speaker)}
      </Text>
      <View>
        <Row label="When" value={formatDateTime(enc.occurredAt)} />
        <Row label="Length" value={`${Math.round(enc.durationMs / 60000)} min`} />
      </View>

      <SectionTitle>What was said</SectionTitle>
      {enc.claimIds.length === 0 ? (
        <Body muted>No transcript was captured for this visit.</Body>
      ) : (
        enc.claimIds.map((cid) => {
          const c = getClaim(cid);
          return c ? (
            <Quote key={cid} text={c.verbatimText}>
              <Text style={styles.meta}>About {subjectLabel(c.subject)}</Text>
            </Quote>
          ) : null;
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, textTransform: "capitalize" },
  meta: { ...type.small, color: colors.muted, marginTop: -space.xs },
});
