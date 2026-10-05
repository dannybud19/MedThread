/**
 * MedThread design tokens — the code form of /DESIGN.md. Every colour, type style, radius and space
 * in the app comes from here; screens never hard-code a hex value or a font size.
 *
 * Structure follows the Airbnb system (white canvas, one accent, hairlines, soft radii, modest
 * weights). Sizes sit at the midpoint of Airbnb's scale and the earlier elder-first scale.
 *
 * Status colours are DELIBERATELY calm and non-alarming: no red "error", no green "correct". A
 * discrepancy is "worth asking about", never a fault (AGENTS.md §1.1). The meaning is carried by the
 * dignified wording in STATUS_LABEL — colour is only a gentle accent.
 */
import type { TextStyle } from "react-native";
import type { ClaimGroupStatus } from "@medthread/domain";

export const colors = {
  /** The one accent: primary buttons, icons, chevrons, the verbatim rule. 4.6:1 on white. */
  primary: "#c0562a",
  primaryActive: "#a3451f",
  primaryDisabled: "#ecc9b8",
  /** Soft terracotta wash: the patient's own chat bubble, hold-to-confirm progress. */
  primaryTint: "#f6e6dd",
  onPrimary: "#ffffff",

  ink: "#0d1526",
  muted: "#4a5468",
  mutedSoft: "#98a2b3",

  canvas: "#ffffff",
  /** The cream. A fill for banners and tracks — never a page background. */
  surfaceSoft: "#f2efe9",
  hairline: "#e6e0d6",
  borderStrong: "#c4cbd6",
  scrim: "rgba(0,0,0,0.4)",
} as const;

/** Font family per weight. React Native picks a custom face by family name, not by `fontWeight`. */
export const fonts = {
  regular: "AtkinsonHyperlegibleNext_400Regular",
  medium: "AtkinsonHyperlegibleNext_500Medium",
  semibold: "AtkinsonHyperlegibleNext_600SemiBold",
  bold: "AtkinsonHyperlegibleNext_700Bold",
} as const;

const t = (fontFamily: string, fontSize: number, lineHeight: number): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  color: colors.ink,
});

/** Type scale. Spread into a style: `{ ...type.body, color: colors.muted }`. */
export const type = {
  display: t(fonts.bold, 31, 38),
  title: t(fonts.semibold, 25, 31),
  heading: t(fonts.semibold, 22, 28),
  label: t(fonts.semibold, 17, 22),
  body: t(fonts.regular, 18, 27),
  bodyStrong: t(fonts.semibold, 18, 27),
  small: t(fonts.regular, 15, 22),
  caption: t(fonts.medium, 14, 19),
  /** The clinician's exact words — the one loud element in the system. */
  verbatim: t(fonts.regular, 21, 32),
  clock: { ...t(fonts.medium, 31, 38), fontVariant: ["tabular-nums"] },
} as const satisfies Record<string, TextStyle>;

export const radius = { xs: 4, sm: 8, md: 14, lg: 20, full: 999 } as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** The single elevation tier, for floating elements only (composer, active segment). */
export const shadow = {
  shadowColor: colors.ink,
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 3,
} as const;

/** Minimum control height — midpoint of Airbnb's 48 and elder-first 60. */
export const MIN_TOUCH = 54;

/** Symmetric hitSlop that lifts every control's effective target above 60. */
export const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const;

/** Dignified, plain-language wording for each reconciler status. Never phrased as an error. */
export const STATUS_LABEL: Record<ClaimGroupStatus, string> = {
  agreed: "Everyone who mentioned this said the same thing",
  worth_confirming: "This seems worth asking about",
  uncorroborated: "Only one person has mentioned this",
};

/** Calm accent per status. Not severity — just a quiet visual cue beside the wording. */
export const STATUS_ACCENT: Record<ClaimGroupStatus, { bg: string; text: string }> = {
  agreed: { bg: "#eef2f6", text: "#344054" },
  worth_confirming: { bg: "#fdf3e7", text: "#8a4b0a" },
  uncorroborated: { bg: "#eef2f6", text: "#344054" },
};

/**
 * Record tokens. `active` is a deep red — the universally understood recording colour. It is a
 * *state*, not an error accent.
 */
export const record = {
  size: 140,
  idle: colors.primary,
  active: "#a01818",
  onRecord: "#ffffff",
  ringIdle: colors.primaryTint,
  ringActive: "#e7b3b0",
} as const;

/** Confirmation states for a due-medication row. Never shaming; "needs confirming" is neutral. */
export const NEEDS_CONFIRMING = { bg: "#fdf3e7", text: "#8a4b0a" } as const;

/** Calm, neutral tone for "this is waiting to send" — not a clinical status. */
export const PENDING_UPLOAD = { bg: "#eef2f6", text: "#344054" } as const;
