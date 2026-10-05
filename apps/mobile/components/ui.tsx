import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { Claim } from "@medthread/domain";
import { formatDate, sourceKindLabel, sourceSummary } from "../app/lib/data";
import { colors, HIT_SLOP, MIN_TOUCH, radius, space, type } from "../app/lib/theme";

/**
 * The shared primitives for every screen, styled per /DESIGN.md. Screens compose these rather than
 * restyling their own buttons, rows and quotes, so the app reads as one system.
 */

/** White screen shell with safe-area insets and the 24px gutter. Set `scroll` for long content. */
export function Screen({ children, scroll }: { children: ReactNode; scroll?: boolean }) {
  const inner = scroll ? (
    <ScrollView contentContainerStyle={s.content}>{children}</ScrollView>
  ) : (
    <View style={[s.content, s.fill]}>{children}</View>
  );
  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      {inner}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------------------------
// Glyphs. Decorative — the label or accessibilityLabel beside them carries the meaning.
// ---------------------------------------------------------------------------------------------

function Glyph({ size, color, d, width = 2.2 }: { size: number; color: string; d: string; width?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={d} />
    </Svg>
  );
}

export function ChevronGlyph({ color = colors.muted, size = 20 }: { color?: string; size?: number }) {
  return <Glyph size={size} color={color} d="M9 5l7 7-7 7" />;
}

export function BackGlyph({ color = colors.ink, size = 22 }: { color?: string; size?: number }) {
  return <Glyph size={size} color={color} d="M19 12H5m0 0 6-6m-6 6 6 6" />;
}

// ---------------------------------------------------------------------------------------------
// Navigation and headings
// ---------------------------------------------------------------------------------------------

/** 44px outline circle with an arrow; hitSlop lifts the target above 60. */
export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={({ pressed }) => [s.back, pressed && s.backPressed]}
    >
      <BackGlyph />
    </Pressable>
  );
}

/** The page title — one per screen. */
export function Title({ children }: { children: ReactNode }) {
  return (
    <Text style={s.title} accessibilityRole="header">
      {children}
    </Text>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text style={s.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Running text. `muted` for context lines under a title. */
export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[s.body, muted && s.muted]}>{children}</Text>;
}

export function Divider() {
  return <View style={s.divider} />;
}

// ---------------------------------------------------------------------------------------------
// The signature element: the clinician's verbatim words
// ---------------------------------------------------------------------------------------------

/** Verbatim words with the terracotta rule. `children` sits under the quote (provenance, status). */
export function Quote({
  text,
  children,
  numberOfLines,
}: {
  text: string;
  children?: ReactNode;
  numberOfLines?: number;
}) {
  return (
    <View style={s.quote}>
      <Text style={s.verbatim} numberOfLines={numberOfLines}>
        {"“"}
        {text}
        {"”"}
      </Text>
      {children}
    </View>
  );
}

/** Who said it, then how and when — two plain lines, never a dotted meta string. */
export function Provenance({ claim }: { claim: Claim }) {
  return (
    <View style={s.provenance}>
      <Text style={s.provText}>{sourceSummary(claim.source)}</Text>
      <Text style={s.provText}>
        {sourceKindLabel(claim.source)}, {formatDate(claim.observedAt)}
      </Text>
    </View>
  );
}

/** A claim: verbatim quote + provenance. Tappable to open the drill-down. No summary, no interpretation. */
export function ClaimCard({ claim, onPress }: { claim: Claim; onPress?: () => void }) {
  const body = (
    <Quote text={claim.verbatimText}>
      <Provenance claim={claim} />
    </Quote>
  );
  if (!onPress) return body;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={`${claim.verbatimText}. Tap to see where this came from.`}
      style={({ pressed }) => pressed && s.pressed}
    >
      {body}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------------------------

/** Rows separated by hairlines, with a hairline above and below the group. */
export function ListGroup({ children }: { children: ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).flat().filter(Boolean);
  return (
    <View style={s.group}>
      {items.map((child, i) => (
        <View key={i} style={i > 0 ? s.groupDivider : null}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** A tappable row: optional decorative icon, a WORD label, trailing chevron. Never icon-only. */
export function ListRow({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail?: string;
  icon?: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={{ ...HIT_SLOP, top: 0, bottom: 0 }}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      style={({ pressed }) => [s.row, pressed && s.pressed]}
    >
      {icon ? <View style={s.rowIcon}>{icon}</View> : null}
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        {detail ? <Text style={s.rowDetail}>{detail}</Text> : null}
      </View>
      <ChevronGlyph />
    </Pressable>
  );
}

/** A label/value pair, e.g. "When   8 Jun 2026, 09:12". */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.kvRow}>
      <Text style={s.kvLabel}>{label}</Text>
      <Text style={s.kvValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------------------------

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "text";
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        s.button,
        variant === "primary" && s.buttonPrimary,
        variant === "primary" && pressed && s.buttonPrimaryPressed,
        variant === "primary" && disabled && s.buttonPrimaryDisabled,
        variant === "secondary" && s.buttonSecondary,
        variant === "secondary" && pressed && s.pressed,
        variant === "text" && s.buttonTextOnly,
        variant === "text" && pressed && s.pressedText,
      ]}
    >
      <Text
        style={[
          s.buttonText,
          variant === "primary" ? s.buttonTextPrimary : null,
          variant === "text" ? s.buttonTextLink : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Full-radius choice chip. Selected = ink fill, so terracotta stays reserved for primary actions. */
export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[s.chip, selected && s.chipSelected]}
    >
      <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

/** Cream banner with a title and a subline. Tappable when `onPress` is given. */
export function Banner({
  title,
  sub,
  onPress,
  tone,
  accessibilityLabel,
  icon,
}: {
  title: string;
  sub?: string;
  onPress?: () => void;
  tone?: { bg: string; text: string };
  accessibilityLabel?: string;
  icon?: ReactNode;
}) {
  const textColor = tone ? { color: tone.text } : null;
  const content = (
    <>
      {icon ? <View style={s.bannerIcon}>{icon}</View> : null}
      <View style={s.bannerCopy}>
        <Text style={[s.bannerTitle, textColor]}>{title}</Text>
        {sub ? <Text style={[s.bannerSub, textColor]}>{sub}</Text> : null}
      </View>
      {onPress ? <ChevronGlyph color={tone?.text ?? colors.muted} /> : null}
    </>
  );
  const style = [s.banner, tone ? { backgroundColor: tone.bg } : null];
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [...style, pressed && s.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** Reusable hold-to-confirm control; calls onComplete after being held `ms`. Visible fill. */
export function HoldToConfirm({
  label,
  onComplete,
  ms = 1500,
}: {
  label: string;
  onComplete: () => void;
  ms?: number;
}) {
  const [progress, setProgress] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  // Clear the interval if the component unmounts mid-hold, so it can't setState after unmount.
  useEffect(() => () => {
    if (ref.current) clearInterval(ref.current);
  }, []);
  function stop() {
    if (ref.current) clearInterval(ref.current);
    ref.current = null;
    setProgress(0);
  }
  function start() {
    const t0 = Date.now();
    ref.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setProgress(p);
      if (p >= 1) {
        stop();
        onComplete();
      }
    }, 30);
  }
  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      hitSlop={HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={s.holdBtn}
    >
      <View style={[s.holdFill, { width: `${Math.round(progress * 100)}%` }]} />
      <Text style={s.holdText}>{label}</Text>
    </Pressable>
  );
}

/** Labelled text input. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[s.input, focused && s.inputFocused]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  fill: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.xl, gap: space.base },

  back: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xs,
  },
  backPressed: { backgroundColor: colors.surfaceSoft },
  title: { ...type.display },
  sectionTitle: { ...type.heading, marginTop: space.base },
  body: { ...type.body },
  muted: { color: colors.muted },
  divider: { height: 1, backgroundColor: colors.hairline },

  quote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: space.base,
    paddingVertical: space.xxs,
    gap: space.sm,
  },
  verbatim: { ...type.verbatim },
  provenance: { gap: space.xxs },
  provText: { ...type.small, color: colors.muted },

  group: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.hairline },
  groupDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  row: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: space.base,
    paddingVertical: space.md,
  },
  rowIcon: { width: 32, alignItems: "center" },
  rowText: { flex: 1, gap: space.xxs },
  rowLabel: { ...type.label },
  rowDetail: { ...type.small, color: colors.muted },
  pressed: { opacity: 0.6 },
  pressedText: { opacity: 0.5 },

  kvRow: { flexDirection: "row", justifyContent: "space-between", gap: space.base, paddingVertical: space.xs },
  kvLabel: { ...type.body, color: colors.muted, flexShrink: 1 },
  kvValue: { ...type.bodyStrong, flexShrink: 1, textAlign: "right" },

  button: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonPrimaryPressed: { backgroundColor: colors.primaryActive },
  buttonPrimaryDisabled: { backgroundColor: colors.primaryDisabled },
  buttonSecondary: { backgroundColor: colors.canvas, borderWidth: 1, borderColor: colors.ink },
  /** Text buttons sit flush with the gutter, like a link. */
  buttonTextOnly: { paddingHorizontal: 0, alignItems: "flex-start" },
  buttonText: { ...type.label, textAlign: "center" },
  buttonTextPrimary: { color: colors.onPrimary },
  buttonTextLink: { textDecorationLine: "underline" },

  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space.base,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { ...type.label },
  chipTextSelected: { color: colors.onPrimary },

  banner: {
    minHeight: MIN_TOUCH,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    padding: space.base,
  },
  bannerIcon: { width: 28, alignItems: "center" },
  bannerCopy: { flex: 1, gap: space.xxs },
  bannerTitle: { ...type.bodyStrong },
  bannerSub: { ...type.small, color: colors.muted },

  holdBtn: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.canvas,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  holdFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: colors.primaryTint },
  holdText: { ...type.label, color: colors.ink },

  field: { gap: space.sm },
  fieldLabel: { ...type.label },
  input: {
    minHeight: 58,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: space.md,
    ...type.body,
  },
  inputFocused: { borderWidth: 2, borderColor: colors.ink },
});
