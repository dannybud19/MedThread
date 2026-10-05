import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ADMITTED_ROUTE, RECOVERY_ROUTE } from "../app/lib/dischargeState";
import { colors, HIT_SLOP, radius, shadow, space, type } from "../app/lib/theme";

type Phase = "admitted" | "recovery";

/**
 * The discharge phase toggle: once discharged, the patient can move back and forth between the
 * admitted phase (Home) and the recovery dashboard. Rendered only when discharged, on both ends
 * (Home shows `current="admitted"`, Recovery shows `current="recovery"`). A plain 2-segment control
 * — elder-first, no swipe/pager dependency. Tapping the inactive segment navigates there.
 */
export function PhaseSwitch({ current }: { current: Phase }) {
  const router = useRouter();
  const go = (phase: Phase) => {
    if (phase === current) return;
    router.replace(phase === "recovery" ? RECOVERY_ROUTE : ADMITTED_ROUTE);
  };
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      <Segment label="Hospital stay" active={current === "admitted"} onPress={() => go("admitted")} />
      <Segment label="Recovery" active={current === "recovery"} onPress={() => go("recovery")} />
    </View>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={active}
      hitSlop={HIT_SLOP}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={active ? `${label}, current view` : `Switch to ${label}`}
      style={[styles.segment, active ? styles.segmentActive : null]}
    >
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>{label}</Text>
    </Pressable>
  );
}

// Cream track, white active segment with the one float shadow (DESIGN.md "Segmented control").
const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.full,
    padding: space.xs,
    gap: space.xs,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.base,
  },
  segmentActive: { backgroundColor: colors.canvas, ...shadow },
  segmentText: { ...type.label, color: colors.muted },
  segmentTextActive: { color: colors.ink },
});
