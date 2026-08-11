/**
 * Design tokens — single source of truth (PORTABILITY: plain numbers, not scattered CSS values).
 *
 * Spacing/radius/type are UNITLESS numbers so they map cleanly two ways with no conversion logic:
 *   this web prototype → divide by 16 for rem (applyTokens below does this via px, CSS handles it)
 *   native (later)     → used as-is: React Native's layout system is already unitless dp, so a
 *                        token like space.lg = 24 becomes `padding: 24` directly, no unit stripping.
 *
 * Colours match the CURRENT app's real values (apps/mobile/components/warm.ts, app/lib/theme.ts),
 * not approximated — this is a redesign of the existing app, not a new palette.
 */
export const tokens = {
  color: {
    cream: "#f2efe9",
    card: "#ffffff",
    hairline: "#e6e0d6",

    ink: "#0d1526",
    inkMuted: "#4a5468",

    // Accent — sparing use only. 3.97:1 on cream (below the 4.5:1 floor), 4.56:1 on white (clears
    // it, thin margin). Rule: terracotta text/icons sit on WHITE surfaces only.
    terracotta: "#c0562a",
    onTerracotta: "#ffffff",

    needsConfirmingBg: "#fdf3e7",
    needsConfirmingText: "#8a4b0a", // 6.19:1 on needsConfirmingBg
    confirmedBg: "#e6f2e9",
    confirmedText: "#1e5631", // 7.50:1 on confirmedBg
  },

  space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  itemGap: 12,   // within a section
  sectionGap: 24, // between sections

  radius: { card: 16, control: 12, pill: 999 },

  type: { display: 40, h1: 28, h2: 22, body: 17, label: 15 },
  weight: { regular: 400, semibold: 600, bold: 800 },

  touch: { min: 48, minGap: 12 },
  tabBar: { height: 56, tabMin: 48 },
} as const;

/**
 * CONTRAST LEDGER — every text colour against every background it is used on in this redesign.
 * Computed via the WCAG relative-luminance formula. AAA body = 7:1, everything else = 4.5:1 min.
 */
export const contrastLedger = [
  { fg: "ink", bg: "cream", ratio: 15.9, usage: "body text", passes: "AAA (7:1)" },
  { fg: "ink", bg: "card", ratio: 18.2, usage: "body text on cards", passes: "AAA (7:1)" },
  { fg: "inkMuted", bg: "cream", ratio: 6.64, usage: "secondary/meta text, 15px+", passes: "AA (4.5:1)" },
  { fg: "inkMuted", bg: "card", ratio: 7.61, usage: "secondary/meta text on cards", passes: "AAA (7:1)" },
  { fg: "terracotta", bg: "cream", ratio: 3.97, usage: "NOT used for text on cream", passes: "FAIL — decorative/icon only" },
  { fg: "terracotta", bg: "card", ratio: 4.56, usage: "icons, small labels on white cards only", passes: "AA (4.5:1), thin margin" },
  { fg: "onTerracotta", bg: "terracotta", ratio: 4.56, usage: "button labels, active tab pill text", passes: "AA (4.5:1), thin margin" },
  { fg: "needsConfirmingText", bg: "needsConfirmingBg", ratio: 6.19, usage: "status badge text", passes: "AA (4.5:1)" },
  { fg: "confirmedText", bg: "confirmedBg", ratio: 7.5, usage: "status badge text", passes: "AAA (7:1)" },
] as const;

/** Injects every token as a CSS custom property on :root — tokens.ts stays the single source; CSS
 * never hardcodes a number. Call once at app startup (see main.tsx). */
export function applyTokens(): void {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(tokens.color)) root.setProperty(`--color-${k}`, v);
  for (const [k, v] of Object.entries(tokens.space)) root.setProperty(`--space-${k}`, `${v}px`);
  for (const [k, v] of Object.entries(tokens.radius)) root.setProperty(`--radius-${k}`, `${v}px`);
  for (const [k, v] of Object.entries(tokens.type)) root.setProperty(`--type-${k}`, `${v}px`);
  for (const [k, v] of Object.entries(tokens.weight)) root.setProperty(`--weight-${k}`, String(v));
  root.setProperty("--touch-min", `${tokens.touch.min}px`);
  root.setProperty("--touch-gap", `${tokens.touch.minGap}px`);
  root.setProperty("--tabbar-height", `${tokens.tabBar.height}px`);
}
