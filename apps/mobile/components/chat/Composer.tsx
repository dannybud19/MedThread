import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, HIT_SLOP, MIN_TOUCH, radius, space, type } from "../../app/lib/theme";

/**
 * Bottom input bar: a multiline field + a round terracotta Send button. The Send glyph is decorative
 * (carries `accessibilityLabel="Send"`); all sentence text stays ink for AAA contrast.
 */
export function Composer({
  value,
  onChangeText,
  onSend,
  disabled,
}: {
  value: string;
  onChangeText: (t: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  const canSend = value.trim().length > 0 && !disabled;
  return (
    <View style={styles.bar}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Ask about your care…"
        placeholderTextColor={colors.muted}
        style={styles.input}
        multiline
        numberOfLines={1}
        accessibilityLabel="Your question"
      />
      <Pressable
        onPress={onSend}
        disabled={!canSend}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Send"
        accessibilityState={{ disabled: !canSend }}
        style={[styles.send, !canSend && styles.sendDisabled]}
      >
        <Svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.onPrimary}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Path d="M12 19V5m0 0-6 6m6-6 6 6" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    backgroundColor: colors.canvas,
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    maxHeight: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.canvas,
    paddingHorizontal: space.base,
    paddingTop: space.md,
    paddingBottom: space.md,
    ...type.body,
  },
  send: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  sendDisabled: { backgroundColor: colors.primaryDisabled },
});
