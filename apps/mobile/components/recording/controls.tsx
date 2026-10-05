/**
 * The two circular controls flanking the capture pill: pause/resume and hold-to-stop.
 *
 * Both carry a real word label for assistive tech, so neither is an icon-only control. Both are 68px
 * — comfortably above MIN_TOUCH (54) — with hitSlop on top of that.
 *
 * STOP IS DELIBERATELY HOLD-TO-CONFIRM, not a tap. A mis-tap would end the recording of a
 * consultation that cannot be repeated, and the users this app is built for have shaky hands. The
 * 1.5s hold is the same accidental-trigger protection the screen already used before this redesign.
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors, HIT_SLOP, space, type } from "../../app/lib/theme";

const BUTTON = 68;
const GLYPH = 26;

/** Two vertical bars — pause. */
function PauseGlyph({ color }: { color: string }) {
  return (
    <Svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24">
      <Rect x="6.5" y="4" width="4.2" height="16" rx="1.6" fill={color} />
      <Rect x="13.3" y="4" width="4.2" height="16" rx="1.6" fill={color} />
    </Svg>
  );
}

/** Right-pointing triangle with softened corners — resume. */
function PlayGlyph({ color }: { color: string }) {
  return (
    <Svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24">
      <Path d="M8 5.4 19 12 8 18.6Z" fill={color} strokeLinejoin="round" strokeWidth={2.4} stroke={color} />
    </Svg>
  );
}

/** Rounded square — stop. */
function StopGlyph({ color }: { color: string }) {
  return (
    <Svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24">
      <Rect x="5" y="5" width="14" height="14" rx="3.2" fill={color} />
    </Svg>
  );
}

export function PauseButton({ paused, onPress }: { paused: boolean; onPress: () => void }) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityState={{ selected: paused }}
        accessibilityLabel={paused ? "Resume recording" : "Pause recording"}
        style={styles.button}
      >
        {paused ? <PlayGlyph color={colors.ink} /> : <PauseGlyph color={colors.ink} />}
      </Pressable>
      <Text style={styles.hint} numberOfLines={1}>
        {paused ? "Resume" : "Pause"}
      </Text>
    </View>
  );
}

/**
 * Hold-to-stop. `progress` (0–1) is owned by the screen because the same hold also triggers the
 * upload once it reaches 1 — keeping one source of truth avoids two timers disagreeing.
 */
export function StopButton({
  progress,
  onPressIn,
  onPressOut,
}: {
  progress: number;
  onPressIn: () => void;
  onPressOut: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Hold to stop recording"
        style={styles.button}
      >
        {/* Fills from the bottom as the hold progresses, so the wait is visible rather than silent. */}
        <View style={[styles.fill, { height: `${Math.round(progress * 100)}%` }]} />
        <StopGlyph color={colors.primary} />
      </Pressable>
      <Text style={styles.hint} numberOfLines={1}>
        Hold to stop
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: space.xs },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fill: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.primaryTint },
  // Caption size; "Hold to stop" can be slightly wider than the button, the row has room for it.
  hint: { ...type.caption, color: colors.muted },
});
