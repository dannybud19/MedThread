import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ChatIcon, ClipboardIcon, FolderIcon, MicIcon } from "../components/home/icons";
import { PhaseSwitch } from "../components/PhaseSwitch";
import { Banner, Button, ListGroup, ListRow, Screen } from "../components/ui";
import { patientName } from "./lib/data";
import { clearDischarge, isDischarged, RECOVERY_ROUTE, setDischarged } from "./lib/dischargeState";
import { setLiveClaims } from "./lib/liveSession";
import { setLiveTranscript, toTranscriptTurn } from "./lib/liveTranscript";
import * as outbox from "./lib/outbox";
import type { OutboxItem } from "./lib/outbox";
import { colors, PENDING_UPLOAD, space, type } from "./lib/theme";

/** "Your recording" / "Your document" / "2 items" — keeps the banner readable, never alarming. */
function pendingLabel(items: OutboxItem[]): string {
  if (items.length > 1) return `${items.length} items waiting to send`;
  const kind = items[0]?.kind === "document" ? "document" : "recording";
  return `Your ${kind} is waiting to send`;
}

// Screen 1 — Home. A greeting, then the four actions as one hairline-divided list. Nothing here
// changes where the four actions navigate.
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
    <Screen scroll>
      {/* Once discharged, let the patient move back to the recovery dashboard (and back again). */}
      {discharged ? <PhaseSwitch current="admitted" /> : null}

      <View style={styles.greeting}>
        <Text style={styles.hi} accessibilityRole="header">
          Hi, {patientName}
        </Text>
        <Text style={styles.sub}>What would you like to do today?</Text>
      </View>

      {pending.length > 0 ? (
        <Banner
          title={pendingLabel(pending)}
          sub={sending ? "Sending…" : "Tap to try again"}
          tone={PENDING_UPLOAD}
          onPress={() => void retryPending()}
          accessibilityLabel={`${pendingLabel(pending)}. Tap to try sending it again.`}
        />
      ) : null}

      <ListGroup>
        <ListRow
          label="Consultation history"
          icon={<ClipboardIcon size={28} />}
          onPress={() => router.push("/history")}
        />
        <ListRow
          label="Record a consultation"
          icon={<MicIcon size={28} />}
          onPress={() => router.push("/recording")}
        />
        <ListRow
          label="Chat with MedThread"
          icon={<ChatIcon size={28} />}
          onPress={() => router.push("/ask")}
        />
        <ListRow
          label="Update medical files"
          icon={<FolderIcon size={28} />}
          onPress={() => router.push("/upload")}
        />
      </ListGroup>

      {/* DEMO-ONLY: flips the discharge phase with no backend, so the Home ⇄ Recovery toggle is
          reachable in an offline demo. Gated behind __DEV__ so it never appears in a store build. */}
      {__DEV__ ? (
        <View style={styles.demo}>
          <Button
            variant="text"
            label={discharged ? "Reset demo" : "Simulate discharge (demo)"}
            onPress={() => {
              if (discharged) {
                clearDischarge();
                bump((n) => n + 1);
              } else {
                setDischarged(true);
                router.replace(RECOVERY_ROUTE);
              }
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { gap: space.xs, paddingTop: space.xl, paddingBottom: space.sm },
  hi: { ...type.display },
  sub: { ...type.body, color: colors.muted },
  demo: { marginTop: space.lg },
});
