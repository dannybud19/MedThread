import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { BackButton, Body, Button, ClaimCard, Screen, SectionTitle, Title } from "../../components/ui";
import { getEntry, subjectLabel } from "../lib/data";
import { explainSubject } from "../lib/explain";
import { colors, HIT_SLOP, radius, space, STATUS_ACCENT, STATUS_LABEL, type } from "../lib/theme";

// Subject detail — the drill-down. The clinician's VERBATIM words are the primary text; the
// plain-language explanation is opt-in and clearly marked; provenance is always shown.
//
// "What does this mean?" behaves in one of two ways, and the two are never blended:
//   - For a MEDICATION, it fetches GENERAL info from the web via /api/explain, shown under a hard
//     "not from your care team · not medical advice" label with its sources. Empty → we say we
//     couldn't find reliable info, never an invented one.
//   - For other jargon, it shows the local canned explanation ("explains the words only").
type ExplainState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; text: string; sources: Array<{ title: string; url: string }> }
  | { status: "empty" }
  | { status: "error" };

export default function SubjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = id ? getEntry(id) : undefined;
  const [showExplain, setShowExplain] = useState(false);
  const [live, setLive] = useState<ExplainState>({ status: "idle" });

  if (!entry) {
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        <Title>We couldn't find that</Title>
        <Body muted>Go back and choose an item from the list.</Body>
      </Screen>
    );
  }

  const isMedication = entry.category === "medication-dose" || entry.category === "medication-change";
  const canned = explainSubject(entry.subject);

  async function loadLiveExplain(): Promise<void> {
    if (!entry) return;
    setLive({ status: "loading" });
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_URL;
      if (!apiBase) throw new Error("EXPO_PUBLIC_API_URL is not set.");
      const res = await fetch(`${apiBase}/api/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: entry.subject, verbatimText: entry.latest.verbatimText }),
      });
      const data = (await res.json()) as {
        explanation?: string;
        sources?: Array<{ title: string; url: string }>;
      };
      // No attributed source → treat as "no reliable info"; never show an unsourced medical statement.
      if (!res.ok || !data.explanation || !data.sources?.length) {
        setLive({ status: "empty" });
        return;
      }
      setLive({ status: "done", text: data.explanation, sources: data.sources });
    } catch {
      setLive({ status: "error" });
    }
  }

  function toggleExplain(): void {
    const next = !showExplain;
    setShowExplain(next);
    if (next && isMedication && live.status === "idle") void loadLiveExplain();
  }

  const accent = STATUS_ACCENT[entry.status];

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Text style={styles.h1} accessibilityRole="header">
        {subjectLabel(entry.subject)}
      </Text>
      <View style={[styles.status, { backgroundColor: accent.bg }]}>
        <Text style={[styles.statusText, { color: accent.text }]}>{STATUS_LABEL[entry.status]}</Text>
      </View>

      {entry.confirmation ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmText}>You confirmed: {entry.confirmation.confirmedValue}</Text>
        </View>
      ) : null}

      <SectionTitle>What was said, in order</SectionTitle>
      <View style={styles.trail}>
        {entry.trail.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </View>

      <View style={styles.explainSection}>
        <Button
          variant="secondary"
          label={showExplain ? "Hide explanation" : "What does this mean?"}
          accessibilityLabel="What does this mean?"
          onPress={toggleExplain}
        />

        {showExplain ? (
          isMedication ? (
            <View style={styles.explainBox}>
              <Text style={styles.explainLabel}>
                General information from the web. Not from your care team, and not medical advice.
              </Text>
              {live.status === "loading" ? (
                <Text style={styles.explainText}>Looking this up…</Text>
              ) : live.status === "done" ? (
                <>
                  <Text style={styles.explainText}>{live.text}</Text>
                  <Text style={styles.sourcesLabel}>Sources</Text>
                  {live.sources.map((s) => (
                    <Pressable
                      key={s.url}
                      onPress={() => void Linking.openURL(s.url)}
                      hitSlop={HIT_SLOP}
                      accessibilityRole="link"
                      accessibilityLabel={`Open source: ${s.title}`}
                      style={styles.sourceRow}
                    >
                      <Text style={styles.sourceLink}>{s.title}</Text>
                    </Pressable>
                  ))}
                </>
              ) : live.status === "empty" ? (
                <Text style={styles.explainText}>
                  We couldn't find reliable general information about this medicine.
                </Text>
              ) : (
                <Text style={styles.explainText}>We couldn't load this right now. Please try again.</Text>
              )}
            </View>
          ) : (
            <View style={styles.explainBox}>
              <Text style={styles.explainLabel}>Plain-language explanation. It explains the words only.</Text>
              <Text style={styles.explainText}>
                {canned ?? "No plain-language explanation is available yet."}
              </Text>
            </View>
          )
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, textTransform: "capitalize" },
  status: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  statusText: { ...type.caption },
  confirm: { borderRadius: radius.md, backgroundColor: colors.surfaceSoft, padding: space.base },
  confirmText: { ...type.bodyStrong },
  trail: { gap: space.lg },
  explainSection: { gap: space.md, marginTop: space.base },
  explainBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space.base,
    gap: space.sm,
  },
  explainLabel: { ...type.small, color: colors.muted },
  explainText: { ...type.body },
  sourcesLabel: { ...type.label, marginTop: space.xs },
  sourceRow: { minHeight: 44, justifyContent: "center" },
  sourceLink: { ...type.body, textDecorationLine: "underline" },
});
