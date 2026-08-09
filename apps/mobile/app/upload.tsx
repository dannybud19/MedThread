import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BackArrowIcon,
  CameraIcon,
  DocumentUploadIcon,
  GalleryIcon,
} from "../components/upload/icons";
import { warm } from "../components/warm";
import { sendDocument } from "./lib/capture";
import { audioClaims } from "./lib/data";
import { RECOVERY_ROUTE, setDischarged } from "./lib/dischargeState";
import { setLiveClaims } from "./lib/liveSession";
import { font, HIT_SLOP, MIN_TOUCH, space } from "./lib/theme";
import * as outbox from "./lib/outbox";
import type { OutboxItem } from "./lib/outbox";

type Phase = "idle" | "uploading" | "error";

const PATIENT_ID = "synthetic-patient-1";

/**
 * Colours for this screen only. Text on the terracotta panel is SOLID WHITE (4.56:1) — the reference
 * design's faded grey body copy would measure near 2:1 here and fail WCAG outright. Cream is used
 * for the button fill rather than for text, since cream-on-terracotta is only 3.97:1.
 */
const panel = {
  bg: warm.terracotta,
  onPanel: "#ffffff",
  /** The pill inverts the reference (which put orange on navy): cream fill, terracotta label. */
  pillBg: "#ffffff",
  pillText: warm.terracotta,
} as const;

// A picked document, normalized across the two pickers: expo-image-picker (camera → { fileName })
// and expo-document-picker (Files → { name }). The server accepts image/* or application/pdf.
type PickedFile = { uri: string; mimeType: string; name: string };

/** A filename for an asset that arrived without one, from its MIME. */
function fallbackName(mimeType: string): string {
  const ext = mimeType === "application/pdf" ? "pdf" : (mimeType.split("/")[1] ?? "jpg");
  return `document.${ext}`;
}

/** Best-effort MIME from a filename when the picker didn't supply one (Files app is usually reliable). */
function guessMimeFromName(name: string): string {
  switch (name.split(".").pop()?.toLowerCase()) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

// Screen 4 — Update Medical Files (LIVE). Pick or photograph a document, send it to /api/extract-document
// (Claude vision → verbatim, document-sourced claims), merge with the spoken claims, and — treating a
// processed document as a discharge letter — mark the patient discharged and open the recovery
// dashboard (/recovery), where the letter's aspirin 150mg vs the spoken 75mg surfaces as "worth
// confirming". On any failure the error screen offers a retry — the real upload is the only path.
//
// This screen uses its own shell rather than the shared `Screen` component: `Screen`'s white
// background is used by nine other screens, and this one is a two-tone terracotta layout.
export default function Upload() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  /** Set only once a failed upload has been durably queued — lets the error screen offer a resend
   * instead of discarding the picked/photographed document. */
  const [queuedItem, setQueuedItem] = useState<OutboxItem | null>(null);

  function fail(message: string) {
    setErrorMsg(message);
    setPhase("error");
  }

  /** Merge the extracted document claims with the spoken claims and hand off to the session view. */
  function showMerged(docClaims: typeof audioClaims) {
    setQueuedItem(null);
    setLiveClaims([...audioClaims, ...docClaims]);
    // A document (discharge letter) was processed → the patient is discharged. Land on the recovery
    // dashboard; the Home ⇄ Recovery toggle then lets them move back and forth (PhaseSwitch).
    setDischarged(true);
    router.replace(RECOVERY_ROUTE);
  }

  /** Take a photo (needs camera permission). Returns null if denied or cancelled. */
  async function pickCamera(): Promise<PickedFile | null> {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      fail("Camera access is needed to photograph the document. You can upload a file instead.");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (result.canceled) return null;
    const asset = result.assets[0];
    if (!asset) return null;
    const mimeType = asset.mimeType ?? "image/jpeg";
    return { uri: asset.uri, mimeType, name: asset.fileName ?? fallbackName(mimeType) };
  }

  /** Choose a photo or PDF from the Files app (no permission prompt). Returns null if cancelled. */
  async function pickFile(): Promise<PickedFile | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    if (!asset) return null;
    const name = asset.name ?? "document";
    return { uri: asset.uri, mimeType: asset.mimeType ?? guessMimeFromName(name), name };
  }

  async function pick(source: "library" | "camera") {
    let file: PickedFile | null = null;
    const documentId = `doc-${Date.now()}`;
    try {
      file = source === "camera" ? await pickCamera() : await pickFile();
      if (!file) return;
      setPhase("uploading");
      const apiBase = process.env.EXPO_PUBLIC_API_URL;
      if (!apiBase) throw new Error("EXPO_PUBLIC_API_URL is not set.");

      const result = await sendDocument(
        { fileUri: file.uri, fileName: file.name, mimeType: file.mimeType, patientId: PATIENT_ID, documentId },
        apiBase,
      );
      showMerged(result.claims as typeof audioClaims);
    } catch (e) {
      // A real document was picked/photographed — queue it so "Try again" can resend it.
      if (file) {
        try {
          const item = await outbox.enqueueDocument({
            sourceUri: file.uri,
            fileName: file.name,
            mimeType: file.mimeType,
            patientId: PATIENT_ID,
            documentId,
          });
          setQueuedItem(item);
        } catch {
          // Best-effort: a queueing failure must never mask the real error shown below.
        }
      }
      fail(e instanceof Error ? e.message : "Something went wrong reading that document.");
    }
  }

  /** Resends the queued document (unchanged since it failed) instead of asking the patient to re-pick. */
  async function retryQueued() {
    if (!queuedItem) return;
    setPhase("uploading");
    try {
      const result = await outbox.resendItem(queuedItem);
      if (result.kind === "document") showMerged(result.claims as typeof audioClaims);
    } catch (e) {
      fail(e instanceof Error ? e.message : "Still couldn't send that document.");
    }
  }

  /** The patient would rather pick something else — drop the queued document. */
  async function discardQueued() {
    if (queuedItem) await outbox.discard(queuedItem.id).catch(() => {});
    setQueuedItem(null);
    setPhase("idle");
  }

  if (phase === "uploading") {
    return (
      <PlainShell>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={warm.terracotta} />
          <Text style={styles.big}>Reading your document…</Text>
          <Text style={styles.sub}>This takes a few seconds.</Text>
        </View>
      </PlainShell>
    );
  }

  if (phase === "error") {
    return (
      <PlainShell>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>We couldn't read that document</Text>
          <Text style={styles.errorMsg}>{errorMsg}</Text>
          {queuedItem ? (
            <Text style={styles.sub}>Your document is saved — we'll try sending it again.</Text>
          ) : null}
          <Pressable
            onPress={() => (queuedItem ? void retryQueued() : setPhase("idle"))}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={queuedItem ? "Try sending that document again" : "Try again"}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </Pressable>
          {queuedItem ? (
            <Pressable
              onPress={() => void discardQueued()}
              hitSlop={HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel="Discard this document and choose another instead"
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Choose a different file instead</Text>
            </Pressable>
          ) : null}
        </View>
      </PlainShell>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.panel}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.back}
          >
            <BackArrowIcon color={panel.onPanel} />
          </Pressable>

          <View style={styles.hero}>
            <DocumentUploadIcon size={158} color={panel.onPanel} />
            <Text style={styles.eyebrow}>You can update your</Text>
            <Text style={styles.h1} accessibilityRole="header">
              Medical documents
            </Text>
            <Text style={styles.panelBody}>
              Scans, letters and medication charts from your hospital stay. We'll show you what they
              say, word for word.
            </Text>
          </View>
        </View>

        <View style={styles.lower}>
          <Pressable
            onPress={() => pick("camera")}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Use camera to photograph a document"
            style={styles.pill}
          >
            <CameraIcon color={panel.pillText} />
            <Text style={styles.pillText}>Use camera</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.rule} />
            <Text style={styles.orText}>Or</Text>
            <View style={styles.rule} />
          </View>

          <Pressable
            onPress={() => pick("library")}
            hitSlop={HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel="Choose a document from your files — a photo or a PDF."
            style={styles.galleryRow}
          >
            <GalleryIcon color={warm.terracotta} />
            <View style={styles.galleryCopy}>
              <Text style={styles.galleryTitle}>Upload your documents</Text>
              {/*
                PDF is offered now that both prerequisites are in place: expo-document-picker on this
                screen (expo-image-picker cannot select a PDF), and packages/ai accepting
                application/pdf. Keep this caption in step with the picker `type` filter above.
              */}
              <Text style={styles.galleryHint}>PNG, JPEG or PDF</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Cream shell for the transient phases. Not the shared `Screen`, whose white nine screens rely on. */
function PlainShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.plainSafe} edges={["top", "bottom"]}>
      <View style={styles.plainContent}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: warm.cream },
  scroll: { flexGrow: 1 },

  panel: {
    backgroundColor: panel.bg,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xl,
    // Elder-first: give the hero real room rather than cramming it. Larger mark, larger type and
    // generous gaps all read more easily at arm's length with low vision.
    minHeight: 470,
    justifyContent: "flex-start",
  },
  back: { width: MIN_TOUCH, height: MIN_TOUCH, justifyContent: "center" },
  hero: { alignItems: "center", gap: space.md, paddingTop: space.lg, paddingBottom: space.sm },
  eyebrow: {
    fontSize: font.body,
    color: panel.onPanel,
    textAlign: "center",
    marginTop: space.lg,
  },
  h1: { fontSize: 38, fontWeight: "800", color: panel.onPanel, textAlign: "center", lineHeight: 46 },
  // Solid white, never faded — see the contrast note on `panel` above.
  panelBody: {
    fontSize: font.body,
    color: panel.onPanel,
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: space.sm,
  },

  lower: {
    flex: 1,
    backgroundColor: warm.cream,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    // The pill sits clear of the panel rather than straddling it, so the two blocks read as separate.
    paddingTop: space.lg,
    gap: space.md,
  },
  pill: {
    minHeight: 72,
    borderRadius: 999,
    backgroundColor: panel.pillBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    // Inset from the section edges so it reads as its own element, not a full-bleed bar.
    marginHorizontal: space.xs,
    shadowColor: "#7a3a18",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pillText: { fontSize: font.heading, fontWeight: "800", color: panel.pillText },

  orRow: { flexDirection: "row", alignItems: "center", gap: space.md, marginTop: space.sm },
  rule: { flex: 1, height: 1, backgroundColor: warm.hairline },
  orText: { fontSize: font.label, color: warm.inkMuted },

  galleryRow: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: warm.hairline,
    backgroundColor: warm.card,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  galleryCopy: { flex: 1, gap: 2 },
  galleryTitle: { fontSize: font.label, fontWeight: "700", color: warm.ink },
  galleryHint: { fontSize: 14, color: warm.inkMuted },

  plainSafe: { flex: 1, backgroundColor: warm.cream },
  plainContent: { flex: 1, padding: space.lg, justifyContent: "center" },
  center: { alignItems: "center", gap: space.md, paddingVertical: space.lg },
  big: { fontSize: font.heading, fontWeight: "800", color: warm.ink },
  sub: { fontSize: font.body, color: warm.inkMuted, textAlign: "center" },
  errorTitle: { fontSize: font.heading, fontWeight: "800", color: warm.ink, textAlign: "center" },
  errorMsg: { fontSize: font.body, color: warm.inkMuted, textAlign: "center", lineHeight: 30 },
  primaryBtn: {
    minHeight: MIN_TOUCH,
    borderRadius: 999,
    backgroundColor: warm.terracotta,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  primaryBtnText: { fontSize: font.label, fontWeight: "700", color: "#ffffff" },
  secondaryBtn: { minHeight: MIN_TOUCH, alignItems: "center", justifyContent: "center" },
  secondaryBtnText: { fontSize: font.label, fontWeight: "700", color: warm.terracotta },
});
