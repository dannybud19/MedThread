import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BackButton, Body, ChevronGlyph, Quote, Screen, Title } from "../components/ui";
import {
  dueMedications,
  entryId,
  scheduleLabel,
  subjectLabel,
  type DueMedRow,
  type DueMedStatus,
} from "./lib/data";
import { getReminderTimes, slotKey, type ReminderTimes } from "./lib/patientData";
import { colors, HIT_SLOP, NEEDS_CONFIRMING, radius, space, STATUS_ACCENT, type } from "./lib/theme";

// Screen — Your medicines. A recap of every medication the patient has been told about: the clinician's
// VERBATIM words (never an app-written description), how often (parsed from the confirmed value), the
// patient's own set reminder times, and confirm status. "What it is" is NOT shown here — tapping a card
// opens the subject detail, where the attributed, general web explanation lives (kept apart from the
// verbatim record on purpose).
const STATUS_TEXT: Record<DueMedStatus, string> = {
  scheduled: "Confirmed",
  needs_confirming: "Needs confirming",
  ask_frequency: "Ask how often",
};

export default function Meds() {
  const router = useRouter();
  const [times, setTimes] = useState<ReminderTimes>({});

  useEffect(() => {
    getReminderTimes()
      .then(setTimes)
      .catch(() => {});
  }, []);

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Title>Your medicines</Title>
      <Body muted>
        Everything you've been told to take, in your clinicians' words. Tap one to see what it is.
      </Body>

      <View style={styles.list}>
        {dueMedications.map((med) => (
          <MedRecapCard
            key={med.id}
            med={med}
            times={times}
            onPress={() => router.push(`/subject/${entryId(med.claim.category, med.subject)}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

function MedRecapCard({
  med,
  times,
  onPress,
}: {
  med: DueMedRow;
  times: ReminderTimes;
  onPress: () => void;
}) {
  const scheduled = med.status === "scheduled";
  const setTimes = scheduled
    ? med.slots.map((_, i) => times[slotKey(med.subject, i)]).filter((t): t is string => Boolean(t))
    : [];
  const tone = scheduled ? STATUS_ACCENT.agreed : NEEDS_CONFIRMING;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`${subjectLabel(med.subject)}. ${STATUS_TEXT[med.status]}. Tap to see what it is.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.name}>{subjectLabel(med.subject)}</Text>
          {scheduled ? <Text style={styles.freq}>{scheduleLabel(med.slots)}</Text> : null}
        </View>
        <ChevronGlyph />
      </View>
      <Quote text={med.claim.verbatimText} numberOfLines={4} />
      {scheduled ? (
        <Text style={styles.times}>
          {setTimes.length > 0 ? `Reminders at ${setTimes.join(", ")}` : "No reminder times set yet"}
        </Text>
      ) : null}
      <View style={[styles.pill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.pillText, { color: tone.text }]}>{STATUS_TEXT[med.status]}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md, marginTop: space.sm },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.base,
    gap: space.md,
  },
  pressed: { opacity: 0.6 },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  headText: { flex: 1, gap: space.xxs },
  name: { ...type.title, textTransform: "capitalize" },
  freq: { ...type.small, color: colors.muted },
  times: { ...type.small, color: colors.ink },
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  pillText: { ...type.caption },
});
