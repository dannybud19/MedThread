import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button, HoldToConfirm, Quote, Screen } from "../components/ui";
import { dueMedications, scheduleLabel, subjectLabel } from "./lib/data";
import { addIntake } from "./lib/patientData";
import { colors, space, type } from "./lib/theme";

// Screen 9 — Reminder. Full screen, hold-to-confirm, visible "Not now" escape. Opened by a tapped
// notification (which passes the dose via ?med=&slot=) or from the dashboard.
//
// `HoldToConfirm` is the safety control: holding records that the patient took THIS dose — an
// adherence record they generate (patientData.addIntake), never a change to what the clinician said.
// The clinician's verbatim words are the primary text.
export default function Reminder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ med?: string; slot?: string }>();
  const med = dueMedications.find((m) => m.subject === params.med) ?? dueMedications[0];
  const slot = params.slot ? Number(params.slot) : 0;

  function confirmTaken() {
    // Record the patient's "I took it" (fire-and-forget — a storage hiccup must not block dismissal).
    if (med) void addIntake(med.subject, slot);
    router.back();
  }

  return (
    <Screen>
      <View style={styles.full}>
        <View style={styles.top}>
          <Text style={styles.time}>
            {med && med.status === "scheduled" ? scheduleLabel(med.slots) : "Now"}
          </Text>
          <Text style={styles.h1} accessibilityRole="header">
            Time to take your {med ? subjectLabel(med.subject) : "medication"}
          </Text>
        </View>
        {med ? <Quote text={med.claim.verbatimText} /> : null}

        <View style={styles.actions}>
          <HoldToConfirm label="Hold to confirm you've taken it" onComplete={confirmTaken} />
          <Button label="Not now" variant="secondary" onPress={() => router.back()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, justifyContent: "center", gap: space.lg },
  top: { gap: space.sm },
  time: { ...type.label, color: colors.muted },
  h1: { ...type.display },
  actions: { gap: space.md, marginTop: space.lg },
});
