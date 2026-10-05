import { Pressable, StyleSheet, Text } from "react-native";
import type { Citation as CitationType } from "@medthread/domain";
import { formatDate } from "../../app/lib/data";
import { colors, HIT_SLOP, type } from "../../app/lib/theme";

/**
 * The small inline provenance line under a grounded answer — "Dr Kelly, 1 Nov". Tapping opens the
 * exact verbatim claim in the drill-down. `speaker`/`observedAt` are server-derived from the real claim.
 * Uses muted ink, never terracotta — the accent is kept off small text.
 */
export function Citation({ citation, onPress }: { citation: CitationType; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`Source: ${citation.speaker}, ${formatDate(citation.observedAt)}. Tap to see the exact words.`}
    >
      <Text style={styles.text}>
        {citation.speaker}, {formatDate(citation.observedAt)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    ...type.small,
    color: colors.muted,
    textDecorationLine: "underline",
    marginTop: 2,
  },
});
