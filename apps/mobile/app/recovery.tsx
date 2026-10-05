import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  AskIcon,
  BellIcon,
  HistoryIcon,
  MoodFace,
  PillIcon,
  type Mood,
} from "../components/recovery/icons";
import { PhaseSwitch } from "../components/PhaseSwitch";
import {
  Banner,
  Chip,
  ChevronGlyph,
  ListGroup,
  ListRow,
  Quote,
  Screen,
  SectionTitle,
} from "../components/ui";
import {
  dueMedications,
  entryId,
  patientName,
  runningPicture,
  scheduleLabel,
  subjectLabel,
  type DueMedRow,
  type DueMedStatus,
} from "./lib/data";
import { colors, HIT_SLOP, MIN_TOUCH, NEEDS_CONFIRMING, radius, space, STATUS_ACCENT, type } from "./lib/theme";
import {
  addMoodCheckIn,
  getMoodCheckIns,
  getReminderTimes,
  setReminderTime,
  slotKey,
  type MoodCheckIn,
  type ReminderTimes,
} from "./lib/patientData";
import {
  configureNotifications,
  onReminderTapped,
  requestReminderPermission,
  syncReminders,
} from "./lib/notify";

// Screen 5 — Recovery home. Post-discharge; the discharge trigger routes here (RECOVERY_ROUTE).
//
// Everything shown traces to a claim. In particular the medication cards render the clinician's
// VERBATIM words, never an app-written description of what a drug is for — that would be advice the
// app invented (AGENTS.md §1.1/§1.2). A dose is labelled "Confirmed" only when the reconciler found
// a patient Confirmation for it (D5); otherwise it says "Needs confirming", never a scheduled dose.
//
// The Hospital stay ⇄ Recovery toggle (PhaseSwitch) at the top lets a discharged patient move back
// to the admitted phase (Home) and back again — it replaces the old "Begin a hospital stay" button.
export default function Recovery() {
  const router = useRouter();

  // Subjects more than one person has described differently. Drives the banner's count.
  const worthConfirming = runningPicture.filter((e) => e.status === "worth_confirming").length;

  // The clock times the PATIENT has set for their doses — the only source of reminder times.
  const [reminderTimes, setReminderTimes] = useState<ReminderTimes>({});

  // Notifications, set up once: show reminders in the foreground, ask permission, and open the
  // reminder screen for the dose the patient tapped.
  useEffect(() => {
    configureNotifications();
    void requestReminderPermission();
    return onReminderTapped((med, slot) => router.push(`/reminder?med=${med}&slot=${slot}`));
  }, [router]);

  // Load the patient's set times and (re)schedule reminders to match them.
  useEffect(() => {
    getReminderTimes()
      .then((t) => {
        setReminderTimes(t);
        void syncReminders(dueMedications, t);
      })
      .catch(() => {});
  }, []);

  function handleSetTime(subject: string, slot: number, time: string) {
    setReminderTime(subject, slot, time)
      .then((t) => {
        setReminderTimes(t);
        void syncReminders(dueMedications, t);
      })
      .catch(() => {});
  }

  return (
    <Screen scroll>
      <PhaseSwitch current="recovery" />

      <View style={styles.greeting}>
        <Text style={styles.hi} accessibilityRole="header">
          Hi, {patientName}
        </Text>
        <Text style={styles.ask}>How are you feeling today?</Text>
      </View>

      <MoodRow />

      {worthConfirming > 0 ? (
        <Banner
          title="This seems worth asking about"
          sub={`${countLabel(worthConfirming)} to check`}
          tone={NEEDS_CONFIRMING}
          icon={<AskIcon size={24} color={NEEDS_CONFIRMING.text} />}
          onPress={() => router.push("/questions")}
          accessibilityLabel={`This seems worth asking about. ${countLabel(worthConfirming)} to check. Tap to see your questions.`}
        />
      ) : null}

      <SectionTitle>Today's reminders</SectionTitle>
      <View style={styles.meds}>
        {dueMedications.map((med) => (
          <MedCard
            key={med.id}
            med={med}
            onPress={() => router.push(`/subject/${entryId(med.claim.category, med.subject)}`)}
          />
        ))}
      </View>

      <ReminderTimesSection meds={dueMedications} times={reminderTimes} onSet={handleSetTime} />

      <SectionTitle>Your care</SectionTitle>
      <ListGroup>
        <ListRow
          label="More on your meds"
          icon={<PillIcon size={26} color={colors.primary} />}
          onPress={() => router.push("/meds")}
        />
        <ListRow
          label="Consultation history"
          icon={<HistoryIcon size={26} color={colors.primary} />}
          onPress={() => router.push("/history")}
        />
        <ListRow
          label="Ask again"
          icon={<AskIcon size={26} color={colors.primary} />}
          onPress={() => router.push("/ask")}
        />
        <ListRow
          label="Today's reminder"
          icon={<BellIcon size={26} color={colors.primary} />}
          onPress={() => router.push("/reminder")}
        />
      </ListGroup>
    </Screen>
  );
}

/** "1 thing" / "3 things" — keeps the banner readable without inventing urgency. */
function countLabel(count: number): string {
  return count === 1 ? "1 thing" : `${count} things`;
}

// ---------------------------------------------------------------------------------------------
// Mood check-in
//
// A neutral SELF-REPORT the patient logs (spec: the "Yours" kind of data). It is stored on-device and
// shown back to the patient — but the app NEVER interprets it: no wellbeing assessment, no urgency
// styling by value, no triage, no "see a doctor" prompt. Kept strictly as the patient's own record.
// ---------------------------------------------------------------------------------------------

const MOODS: ReadonlyArray<{ mood: Mood; label: string }> = [
  { mood: "very-good", label: "Very good" },
  { mood: "good", label: "Good" },
  { mood: "okay", label: "Okay" },
  { mood: "not-great", label: "Not great" },
  { mood: "poor", label: "Poor" },
];

const MOOD_LABEL = Object.fromEntries(MOODS.map(({ mood, label }) => [mood, label])) as Record<
  Mood,
  string
>;

/** "9:41 am" from an ISO timestamp — plain, for the patient's own record (never interpreted). */
function checkInTime(iso: string): string {
  const d = new Date(iso);
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const suffix = d.getHours() < 12 ? "am" : "pm";
  const hour = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${hour}:${minutes} ${suffix}`;
}

function MoodRow() {
  const [selected, setSelected] = useState<Mood | null>(null);
  const [recent, setRecent] = useState<MoodCheckIn[]>([]);

  useEffect(() => {
    getMoodCheckIns()
      .then(setRecent)
      .catch(() => {});
  }, []);

  function log(mood: Mood) {
    setSelected(mood);
    // Persist the patient's own report. Fire-and-forget; a storage hiccup must never block the UI.
    addMoodCheckIn(mood)
      .then(setRecent)
      .catch(() => {});
  }

  return (
    <View style={styles.moodBlock}>
      <View style={styles.moodRow} accessibilityRole="radiogroup">
        {MOODS.map(({ mood, label }) => {
          const isSelected = selected === mood;
          return (
            <Pressable
              key={mood}
              onPress={() => log(mood)}
              hitSlop={HIT_SLOP}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={label}
              style={[styles.mood, isSelected && styles.moodSelected]}
            >
              <MoodFace mood={mood} color={colors.ink} />
            </Pressable>
          );
        })}
      </View>

      {recent.length > 0 ? (
        <View style={styles.checkins} accessibilityRole="summary">
          <Text style={styles.checkinsTitle}>Your check-ins</Text>
          {recent.slice(0, 3).map((c) => (
            <Text key={c.id} style={styles.checkinRow}>
              {MOOD_LABEL[c.mood]}, {checkInTime(c.notedAt)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------------------------

/** Card label per row state — plain, never an endorsement of the dose. */
const MED_STATUS_TEXT: Record<DueMedStatus, string> = {
  scheduled: "Confirmed",
  needs_confirming: "Needs confirming",
  ask_frequency: "Ask how often",
};

/**
 * One medication row. The clinician's exact words are the body of the card. A `scheduled` row shows
 * how often the dose is taken (parsed from the confirmed value — never a fabricated clock time); the
 * other states surface a knowledge gap to resolve, and are never presented as the app endorsing a dose.
 */
function MedCard({ med, onPress }: { med: DueMedRow; onPress: () => void }) {
  const scheduled = med.status === "scheduled";
  const statusText = MED_STATUS_TEXT[med.status];
  const tone = scheduled ? STATUS_ACCENT.agreed : NEEDS_CONFIRMING;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`${subjectLabel(med.subject)}${scheduled ? `, ${scheduleLabel(med.slots)}` : ""}. ${statusText}. Tap to see the exact words.`}
      style={({ pressed }) => [styles.med, pressed && styles.pressed]}
    >
      <View style={styles.medHead}>
        <View style={styles.medHeadText}>
          <Text style={styles.medName}>{subjectLabel(med.subject)}</Text>
          {scheduled ? <Text style={styles.medTime}>{scheduleLabel(med.slots)}</Text> : null}
        </View>
        <ChevronGlyph />
      </View>
      <Quote text={med.claim.verbatimText} numberOfLines={4} />
      <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
        <Text style={[styles.statusText, { color: tone.text }]}>{statusText}</Text>
      </View>
    </Pressable>
  );
}

/** Preset reminder times the patient can pick from — big, tappable, and always editable. */
const PRESET_TIMES = ["6:00 am", "8:00 am", "12:00 pm", "6:00 pm", "9:00 pm"] as const;

/**
 * "Your reminder times" — the patient sets a clock time for each confirmed dose. The app NEVER picks a
 * time; it only offers presets and remembers the patient's choice (spec: clock times are the patient's,
 * never inferred). Shown full-width so the choices stay large and readable for older eyes.
 */
function ReminderTimesSection({
  meds,
  times,
  onSet,
}: {
  meds: DueMedRow[];
  times: ReminderTimes;
  onSet: (subject: string, slot: number, time: string) => void;
}) {
  const scheduled = meds.filter((m) => m.status === "scheduled");
  if (scheduled.length === 0) return null;
  return (
    <View style={styles.timesSection}>
      <SectionTitle>Your reminder times</SectionTitle>
      <Text style={styles.timesHint}>You choose when. We'll remind you at the times you pick.</Text>
      {scheduled.flatMap((med) =>
        med.slots.map((slot, i) => {
          const key = slotKey(med.subject, i);
          const current = times[key];
          const doseLabel =
            med.slots.length > 1
              ? `${subjectLabel(med.subject)}, ${slot.label ?? `dose ${i + 1}`}`
              : subjectLabel(med.subject);
          return (
            <View key={key} style={styles.doseRow}>
              <Text style={styles.doseLabel}>{doseLabel}</Text>
              <View style={styles.chips}>
                {PRESET_TIMES.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={current === t}
                    onPress={() => onSet(med.subject, i, t)}
                    accessibilityLabel={`Remind me at ${t} for ${doseLabel}`}
                  />
                ))}
              </View>
            </View>
          );
        }),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: space.xs, paddingTop: space.lg },
  hi: { ...type.display },
  ask: { ...type.body, color: colors.muted },

  moodBlock: { gap: space.md },
  moodRow: { flexDirection: "row", gap: space.sm },
  mood: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 64,
    minHeight: MIN_TOUCH,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  moodSelected: { borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.surfaceSoft },

  checkins: { gap: space.xxs },
  checkinsTitle: { ...type.label, color: colors.muted },
  checkinRow: { ...type.small },

  meds: { gap: space.md },
  med: {
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.base,
    gap: space.md,
  },
  pressed: { opacity: 0.6 },
  medHead: { flexDirection: "row", alignItems: "center", gap: space.sm },
  medHeadText: { flex: 1, gap: space.xxs },
  medName: { ...type.title, textTransform: "capitalize" },
  medTime: { ...type.small, color: colors.muted },
  statusPill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  statusText: { ...type.caption },

  timesSection: { gap: space.md },
  timesHint: { ...type.small, color: colors.muted, marginTop: -space.sm },
  doseRow: { gap: space.sm, paddingVertical: space.xs },
  doseLabel: { ...type.label, textTransform: "capitalize" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
