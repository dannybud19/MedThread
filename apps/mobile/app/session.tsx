import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { TranscriptBubble } from "../components/chat/TranscriptBubble";
import { BackButton, Body, ClaimCard, Screen, SectionTitle } from "../components/ui";
import {
  buildSession,
  entryId,
  questions as fixtureQuestions,
  runningPicture as fixturePicture,
  sessionTranscript,
  subjectLabel,
  transcriptView,
} from "./lib/data";
import { getLiveClaims } from "./lib/liveSession";
import { getLiveTranscript } from "./lib/liveTranscript";
import { colors, radius, space, STATUS_ACCENT, STATUS_LABEL, type } from "./lib/theme";

// Screen 3 — Session result. The consultation is shown as a two-speaker chat transcript
// (User 1 / User 2), followed by the reconciled "Questions worth asking" and "Running picture".
// The transcript is verbatim display only; claims still come from the pure reconciler.
export default function Session() {
  const router = useRouter();
  const live = getLiveClaims();
  const liveTranscript = getLiveTranscript();

  // The reconciled sections — computed by the pure reconciler whether live or fixture.
  const { picture, qs } = live
    ? buildSession(live)
    : { picture: fixturePicture, qs: fixtureQuestions };

  // The conversation as bubbles. Only shown when we actually have this session's transcript: the
  // fixture sample, or a live recording that carried its own turns. A live recording with no live
  // transcript must NOT borrow the sample conversation — that would attribute a stranger's words to
  // the patient's own recording under a "Live" badge. (Live turns are wired in a later change.)
  const bubbles = live && !liveTranscript ? [] : transcriptView(liveTranscript ?? sessionTranscript);

  const open = (category: string, subject: string) =>
    router.push(`/subject/${entryId(category, subject)}`);

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <View style={styles.headerRow}>
        <Text style={styles.h1} accessibilityRole="header">
          Your recording
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{live ? "Live" : "Sample"}</Text>
        </View>
      </View>

      {bubbles.length > 0 ? (
        <>
          <SectionTitle>What was said</SectionTitle>
          <View style={styles.transcript}>
            {bubbles.map((b) => (
              <TranscriptBubble key={b.id} speaker={b.speaker} side={b.side}>
                <Text style={styles.turnText}>{b.text}</Text>
              </TranscriptBubble>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle>Questions worth asking</SectionTitle>
      {qs.length === 0 ? (
        <Body muted>Nothing worth asking about right now.</Body>
      ) : (
        qs.map((q) => (
          <View key={q.id} style={styles.block}>
            <Text style={styles.prompt}>{q.prompt}</Text>
            {q.fromClaims.map((fc) => (
              <ClaimCard key={fc.id} claim={fc} onPress={() => open(fc.category, fc.subject)} />
            ))}
          </View>
        ))
      )}

      <SectionTitle>Running picture</SectionTitle>
      {picture.map((e) => (
        <View key={e.id} style={styles.block}>
          <View style={styles.subjectRow}>
            <Text style={styles.subject}>{subjectLabel(e.subject)}</Text>
            <View style={[styles.status, { backgroundColor: STATUS_ACCENT[e.status].bg }]}>
              <Text style={[styles.statusText, { color: STATUS_ACCENT[e.status].text }]}>
                {STATUS_LABEL[e.status]}
              </Text>
            </View>
          </View>
          <ClaimCard claim={e.latest} onPress={() => open(e.category, e.subject)} />
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  h1: { ...type.display, flexShrink: 1 },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  badgeText: { ...type.caption, color: colors.muted },
  transcript: { gap: space.md },
  turnText: { ...type.body },
  block: { gap: space.md, marginBottom: space.sm },
  prompt: { ...type.bodyStrong },
  subjectRow: { gap: space.sm, alignItems: "flex-start" },
  subject: { ...type.title, textTransform: "capitalize" },
  status: { borderRadius: radius.full, paddingHorizontal: space.md, paddingVertical: space.xs },
  statusText: { ...type.caption },
});
