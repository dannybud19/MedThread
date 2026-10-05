import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BackButton, Body, ListGroup, ListRow, Screen, Title } from "../components/ui";
import { encounters, formatDate, speakerLabel } from "./lib/data";
import { colors, space, type } from "./lib/theme";

// Screen 8 — Consultation history. Grouped by day, newest first: a date heading, then a row per
// consultation reading "Dr Kelly" with the time beneath. Tap opens the transcript.
//
// Duration is deliberately off the row — it is shown on the encounter detail screen. Keeping each
// row to a name and a time makes the list scannable at a glance.
export default function History() {
  const router = useRouter();
  const days = groupByDay(encounters);

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Title>Consultation history</Title>

      {days.length === 0 ? (
        <Body muted>No consultations have been recorded yet.</Body>
      ) : (
        days.map((day) => (
          <View key={day.label} style={styles.group}>
            <Text style={styles.dayLabel} accessibilityRole="header">
              {day.label}
            </Text>
            <ListGroup>
              {day.items.map((e) => (
                <ListRow
                  key={e.id}
                  label={speakerLabel(e.speaker)}
                  detail={formatTime(e.occurredAt)}
                  onPress={() => router.push(`/encounter/${e.id}`)}
                />
              ))}
            </ListGroup>
          </View>
        ))
      )}
    </Screen>
  );
}

type Encounter = (typeof encounters)[number];

/**
 * Bucket consultations by calendar day — days newest first, and newest first within a day. Uses UTC
 * throughout, matching `formatDate`/`formatDateTime`, so the same fixture reads identically wherever
 * it runs.
 */
function groupByDay(list: readonly Encounter[]): { label: string; items: Encounter[] }[] {
  const buckets = new Map<string, Encounter[]>();
  for (const e of list) {
    const key = e.occurredAt.slice(0, 10); // YYYY-MM-DD — sortable as a plain string
    const bucket = buckets.get(key);
    if (bucket) bucket.push(e);
    else buckets.set(key, [e]);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      label: formatDate(`${key}T00:00:00Z`),
      items: [...items].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt)),
    }));
}

/** "09:10" in UTC. Local to this screen — app/lib/data.ts is shared and needs no new export. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  group: { gap: space.sm, marginTop: space.base },
  dayLabel: { ...type.heading, color: colors.ink },
});
