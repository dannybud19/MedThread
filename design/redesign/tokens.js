/**
 * Design tokens — single source of truth (PORTABILITY: plain numbers, not scattered CSS values).
 *
 * Spacing/radius/type are UNITLESS numbers so they map cleanly two ways with no conversion logic:
 *   web prototype  → divide by 16 for rem (e.g. space.lg / 16 = 1.5rem)
 *   native (later) → used as-is: React Native's layout system is already unitless dp, so a token
 *                    like space.lg = 24 becomes `padding: 24` directly, no unit stripping needed.
 *
 * Colours are hex, one accent used sparingly, plus semantic status pairs. Every pair actually used
 * for text is listed in CONTRAST below with its measured ratio (WCAG relative-luminance formula,
 * computed by hand, not asserted) — this is the record Stage 2 asks for.
 *
 * Palette matches the CURRENT app's real values (apps/mobile/components/warm.ts, app/lib/theme.ts),
 * not approximated — this is a redesign of the existing app, not a new palette.
 */
const tokens = {
  color: {
    // Base surfaces
    cream: "#f2efe9",   // page background
    card: "#ffffff",    // card / control fill
    hairline: "#e6e0d6",// borders — a shade of cream, never grey

    // Text
    ink: "#0d1526",      // primary text — the ONLY colour body copy uses
    inkMuted: "#4a5468", // secondary/meta text — 15px+ only, never below

    // Accent — sparing use only (icons, active states, primary buttons). NEVER body text.
    // Measures 3.97:1 on cream (below the 4.5:1 floor) and 4.56:1 on white (clears it, thin margin).
    // Rule: terracotta text/icons sit on WHITE surfaces only. On cream it is decorative-only
    // (large icon glyphs), never a text colour.
    terracotta: "#c0562a",
    onTerracotta: "#ffffff", // text ON a terracotta fill (buttons, active tab pill) — bold weight only

    // Status: Needs confirming (matches the app's existing NEEDS_CONFIRMING token exactly)
    needsConfirmingBg: "#fdf3e7",
    needsConfirmingText: "#8a4b0a", // 6.19:1 on needsConfirmingBg

    // Status: Confirmed (new — no existing token measured >=4.5:1, so defined + verified here)
    confirmedBg: "#e6f2e9",
    confirmedText: "#1e5631", // 7.50:1 on confirmedBg
  },

  space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  // Brief's explicit rhythm: 12px within a section, 24px between sections.
  itemGap: 12,   // = space.sm
  sectionGap: 24, // = space.lg

  radius: {
    card: 16, // brief: "Card radius 16px"
    control: 12,
    pill: 999,
  },

  type: {
    display: 40, // the "large number over small label" module (e.g. time to next dose)
    h1: 28,      // screen heading — semibold
    h2: 22,      // section heading
    body: 17,    // primary body text — hard floor per LEGIBILITY
    label: 15,   // secondary/meta text — hard floor per LEGIBILITY, never smaller
  },
  weight: { regular: 400, semibold: 600, bold: 800 }, // 3 weights max, per VISUAL DIRECTION

  touch: {
    min: 48,      // hard floor, LAYOUT section
    minGap: 12,   // minimum spacing between adjacent targets
  },

  tabBar: {
    height: 56,   // minimum, ABOVE the safe-area inset — NAVIGATION section
    tabMin: 48,
  },
};

/**
 * CONTRAST LEDGER — every text colour against every background it is used on in this redesign.
 * Computed via the WCAG relative-luminance formula. AAA body = 7:1, everything else = 4.5:1 min.
 */
tokens.contrast = [
  { fg: "ink", bg: "cream", ratio: 15.9, usage: "body text", passes: "AAA (7:1)" },
  { fg: "ink", bg: "card", ratio: 18.2, usage: "body text on cards", passes: "AAA (7:1)" },
  { fg: "inkMuted", bg: "cream", ratio: 6.64, usage: "secondary/meta text, 15px+", passes: "AA (4.5:1)" },
  { fg: "inkMuted", bg: "card", ratio: 7.61, usage: "secondary/meta text on cards", passes: "AAA (7:1)" },
  { fg: "terracotta", bg: "cream", ratio: 3.97, usage: "NOT used for text on cream — fails 4.5:1 floor", passes: "FAIL — decorative/icon only here" },
  { fg: "terracotta", bg: "card", ratio: 4.56, usage: "icons, small labels on white cards only", passes: "AA (4.5:1), thin margin — bold weight required" },
  { fg: "onTerracotta", bg: "terracotta", ratio: 4.56, usage: "button labels, active tab pill text", passes: "AA (4.5:1), thin margin — bold weight required, 17px+" },
  { fg: "needsConfirmingText", bg: "needsConfirmingBg", ratio: 6.19, usage: "status badge text", passes: "AA (4.5:1)" },
  { fg: "confirmedText", bg: "confirmedBg", ratio: 7.5, usage: "status badge text", passes: "AAA (7:1)" },
];

if (typeof module !== "undefined") module.exports = tokens;
