import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DottedPath } from "../components/home/DottedPath";
import { ChatIcon, ClipboardIcon, FolderIcon, MicIcon } from "../components/home/icons";
import { warm } from "../components/warm";
import { ActionButton, Greeting } from "../components/ui";
import { PhaseSwitch } from "../components/PhaseSwitch";
import { patientName } from "./lib/data";
import { clearDischarge, isDischarged, RECOVERY_ROUTE, setDischarged } from "./lib/dischargeState";
import { setLiveClaims } from "./lib/liveSession";
import { setLiveTranscript, toTranscriptTurn } from "./lib/liveTranscript";
import * as outbox from "./lib/outbox";
import type { OutboxItem } from "./lib/outbox";
import { font, HIT_SLOP, MIN_TOUCH, PENDING_UPLOAD, space } from "./lib/theme";

/** "Your recording" / "Your document" / "2 items" — keeps the banner readable, never alarming. */
function pendingLabel(items: OutboxItem[]): string {
  if (items.length > 1) return `${items.length} items waiting to send`;
  const kind = items[0]?.kind === "document" ? "document" : "recording";
  return `Your ${kind} is waiting to send`;
}

// Screen 1 — Home. A warm greeting, then four large word-labelled actions over a decorative dotted
// path. All presentation lives in components/ui.tsx (Greeting, ActionButton) and components/home/*
// so styling stays separable.
//
// This screen uses its own shell rather than the shared `Screen` component: `Screen`'s white
// background is used by nine other screens, and the home is the only one on the warm cream. Nothing
// here changes where the four actions navigate.
export default function Home() {
  const router = useRouter();
  const [, bump] = useState(0);
  const [pending, setPending] = useState<OutboxItem[]>([]);
  const [sending, setSending] = useState(false);
  // Re-read the module-level discharge flag whenever Home regains focus, so the PhaseSwitch (and the
  // demo label) reflect the current phase even when a pre-discharge Home instance lingers in the
  // navigation stack (e.g. after the upload → recovery path, then swipe-back). Also re-check the
  // outbox, so a capture queued elsewhere (or resolved on a previous visit) stays current.
  useFocusEffect(
    useCallback(() => {
      bump((n) => n + 1);
      let active = true;
      outbox.getPending().then((items) => {
        if (active) setPending(items);
      });
      return () => {
        active = false;
      };
    }, []),
  );
  const discharged = isDischarged();

  /** Resends the oldest queued capture right here — no dedicated screen for what's a rare case. */
  async function retryPending() {
    const item = pending[0];
    if (!item || sending) return;
    setSending(true);
    try {
      const result = await outbox.resendItem(item);
      if (result.kind === "audio") {
        setLiveClaims(result.claims as never);
        setLiveTranscript(result.turns.map(toTranscriptTurn));
        router.push("/session");
      } else {
        setDischarged(true);
        router.push(RECOVERY_ROUTE);
      }
    } catch {
      // Stays queued (outbox.resendItem already recorded the attempt) — just refresh the list.
      setPending(await outbox.getPending());
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <DottedPath />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Once discharged, let the patient move back to the recovery dashboard (and back again). */}
        {discharged ? <PhaseSwitch current="admitted" /> : null}
        <Greeting name={patientName} />

        {pending.length > 0 ? (
          <Pressable
            onPress={() => void retryPending()}
            disabled={sending}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={`${pendingLabel(pending)}. Tap to try sending it again.`}
            style={styles.banner}
          >
            <Text style={styles.bannerTitle}>{pendingLabel(pending)}</Text>
            <Text style={styles.bannerSub}>{sending ? "Sending…" : "Tap to try again"}</Text>
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <ActionButton
            label="Consultation history"
            icon={<ClipboardIcon />}
            onPress={() => router.push("/history")}
          />
          <ActionButton
            label="Record a consultation"
            icon={<MicIcon />}
            onPress={() => router.push("/recording")}
          />
          <ActionButton
            label="Chat with MedThread"
            icon={<ChatIcon />}
            onPress={() => router.push("/ask")}
          />
          <ActionButton
            label="Update medical files"
            icon={<FolderIcon />}
            onPress={() => router.push("/upload")}
          />
        </View>

        {/* DEMO-ONLY: flips the discharge phase with no backend, so the Home ⇄ Recovery toggle is
            reachable in an offline demo. Gated behind __DEV__ so it never appears in a store build. */}
        {__DEV__ ? (
          <Pressable
            onPress={() => {
              if (discharged) {
                clearDischarge();
                bump((n) => n + 1);
              } else {
                setDischarged(true);
                router.replace(RECOVERY_ROUTE);
              }
            }}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={discharged ? "Reset demo" : "Simulate discharge for the demo"}
            style={styles.demo}
          >
            <Text style={styles.demoText}>{discharged ? "Reset demo" : "Simulate discharge (demo)"}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.cream },
  // Real breathing room above the greeting so it clears the status bar rather than hugging it,
  // and a generous gap between the actions so they read as four separate choices.
  content: { padding: space.lg, paddingTop: 56, paddingBottom: space.xl, gap: space.lg },
  actions: { gap: space.lg },
  demo: { alignSelf: "center", paddingVertical: space.sm, marginTop: space.md },
  demoText: { fontSize: font.label, color: warm.inkMuted, textDecorationLine: "underline" },

  banner: {
    minHeight: MIN_TOUCH,
    borderRadius: 22,
    backgroundColor: PENDING_UPLOAD.bg,
    padding: space.lg,
    gap: 2,
  },
  bannerTitle: { fontSize: font.label, fontWeight: "800", color: PENDING_UPLOAD.text, lineHeight: 26 },
  bannerSub: { fontSize: 15, color: PENDING_UPLOAD.text },
});
