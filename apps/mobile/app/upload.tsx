import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { BackButton, Body, Button, ListGroup, ListRow, Screen, Title } from "../components/ui";
import { CameraIcon, GalleryIcon } from "../components/upload/icons";
import { sendDocument } from "./lib/capture";
import { audioClaims } from "./lib/data";
import { RECOVERY_ROUTE, setDischarged } from "./lib/dischargeState";
import { setLiveClaims } from "./lib/liveSession";
import { colors, space, type } from "./lib/theme";
import * as outbox from "./lib/outbox";
import type { OutboxItem } from "./lib/outbox";

type Phase = "idle" | "uploading" | "error";

const PATIENT_ID = "synthetic-patient-1";

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
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.big}>Reading your document…</Text>
          <Text style={styles.sub}>This takes a few seconds.</Text>
        </View>
      </Screen>
    );
  }

  if (phase === "error") {
    return (
      <Screen>
        <View style={styles.errorWrap}>
          <Title>We couldn't read that document</Title>
          <Body muted>{errorMsg}</Body>
          {queuedItem ? <Body>Your document is saved. We'll try sending it again.</Body> : null}
          <View style={styles.actions}>
            <Button
              label="Try again"
              accessibilityLabel={queuedItem ? "Try sending that document again" : "Try again"}
              onPress={() => (queuedItem ? void retryQueued() : setPhase("idle"))}
            />
            {queuedItem ? (
              <Button
                variant="text"
                label="Choose a different file instead"
                accessibilityLabel="Discard this document and choose another instead"
                onPress={() => void discardQueued()}
              />
            ) : null}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackButton onPress={() => router.back()} />
      <Title>Update medical files</Title>
      <Body muted>
        Scans, letters and medication charts from your hospital stay. We'll show you what they say,
        word for word.
      </Body>

      <View style={styles.options}>
        <ListGroup>
          <ListRow
            label="Use camera"
            detail="Photograph a letter or chart"
            icon={<CameraIcon color={colors.primary} />}
            onPress={() => pick("camera")}
          />
          {/*
            PDF is offered now that both prerequisites are in place: expo-document-picker on this
            screen (expo-image-picker cannot select a PDF), and packages/ai accepting
            application/pdf. Keep this detail line in step with the picker `type` filter above.
          */}
          <ListRow
            label="Upload your documents"
            detail="PNG, JPEG or PDF"
            icon={<GalleryIcon color={colors.primary} />}
            onPress={() => pick("library")}
          />
        </ListGroup>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: { marginTop: space.base },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md },
  big: { ...type.title, textAlign: "center" },
  sub: { ...type.body, color: colors.muted, textAlign: "center" },
  errorWrap: { flex: 1, justifyContent: "center", gap: space.md },
  actions: { gap: space.sm, marginTop: space.base },
});
