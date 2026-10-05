import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../../app/lib/theme";

/**
 * A two-sided consultation-transcript bubble. Unlike the Q&A `MessageBubble` (where the assistant is
 * borderless prose), BOTH speakers here are bubbles — a diarized conversation reads as a chat. The
 * left speaker gets a white hairline bubble, the right the terracotta tint; each carries a small
 * generic speaker label ("User 1" / "User 2"). Presentation only; the text is the verbatim turn.
 */
export function TranscriptBubble({
  speaker,
  side,
  children,
}: {
  speaker: string;
  side: "left" | "right";
  children: ReactNode;
}) {
  const right = side === "right";
  return (
    <View style={[styles.row, right ? styles.rowRight : styles.rowLeft]}>
      <View style={styles.column}>
        <Text style={[styles.label, right ? styles.labelRight : styles.labelLeft]}>{speaker}</Text>
        <View style={[styles.bubble, right ? styles.bubbleRight : styles.bubbleLeft]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%", flexDirection: "row" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  column: { maxWidth: "88%", gap: space.xs },
  label: { ...type.caption, color: colors.muted },
  labelLeft: { marginLeft: space.sm },
  labelRight: { textAlign: "right", marginRight: space.sm },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  bubbleLeft: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderTopLeftRadius: radius.xs,
  },
  bubbleRight: {
    backgroundColor: colors.primaryTint,
    borderTopRightRadius: radius.xs,
  },
});
