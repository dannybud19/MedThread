# MedThread — design (patient web app)

The patient app is a phone-sized web app in `apps/web` (PROJECT.md D22). Tokens and primitives live in
[`apps/web/app/globals.css`](./apps/web/app/globals.css); shared components in `apps/web/components/`.
Pages never hard-code a hex value or a font size — they use the CSS variables and classes.

## The idea

The reader is an older hospital inpatient: tired, often low-vision, sometimes with shaky hands. The
app's one job is to show **what a clinician said, word for word, and who said it**. So the clinician's
words get their own voice: a reading serif, large, inside curly quotes, with the speaker's badge on
top like a hospital ID. Everything the *app* writes is in a plain, highly legible sans. You can tell at
a glance which words are theirs and which are ours.

## Colour

| Token | Hex | Use |
|---|---|---|
| `--plum` | `#5a2d82` | The one accent: primary buttons, the Record block, active tab, quote marks. White on plum is ~10:1. |
| `--plum-tint` | `#f0e9f7` | Speaker badges, icon tiles, active tab pill, hold-to-confirm fill. |
| `--ink` | `#14233a` | All text. |
| `--muted` | `#4b5870` | Provenance, hints (~7:1 on white). |
| `--page` / `--surface` | `#f6f7f9` / `#ffffff` | Cool page, white cards. |
| `--ask-bg` / `--ask-ink` | `#fcefd6` / `#6f4100` | "Worth asking about" only. |
| `--neutral-bg` / `--neutral-ink` | `#e8edf3` / `#344054` | Every other status. |
| `--record` | `#a3201b` | A running recording. A state, not an error. |

**Status is a product invariant, not a style choice.** A claim's status is never red or green and never
reads as an error. Words carry the meaning: "Worth asking about", "Everyone said the same thing",
"Mentioned once".

## Type

- **Atkinson Hyperlegible Next** (Braille Institute, built for low vision) for the interface:
  display 32/38 bold, title 26/32, heading 22/28, body 19/29, small 16/24.
- **Literata** (a screen-reading serif) for clinicians' words only: 22/34, in plum curly quotes.
- Sentence case everywhere. No all-caps labels.

## Layout

- One column, max 480px, centred on wide screens; 20px gutter.
- A fixed bottom tab bar with four **labelled** destinations: Today, Record, Ask, Papers. It hides
  on the two full-screen moments (recording, the medicine reminder).
- Pushed pages have a sticky top bar with a labelled "Back" pill, never an icon-only arrow.
- Radii grow with size: 10 (small), 16 (buttons, tiles), 24 (cards).

```
Sunday 4 October
Hello, Bill
┌──────────────────────────────┐
│ (mic)  Record a conversation │   plum block — the bedside action
└──────────────────────────────┘
┌──────────────────────────────┐
│ (?)  1 thing is worth asking │   amber, only when there's a disagreement
└──────────────────────────────┘
Latest from your care team
┌──────────────────────────────┐
│ (K) Dr Kelly / Consultant    │   speaker badge
│ “We're starting you on …”    │   Literata, the loudest thing on screen
│ Said on 25 Jul at 09:11      │
└──────────────────────────────┘
[ Today | Record | Ask | Papers ]
```

## Accessibility (elder-first)

- Every control is at least 56px tall; tabs 68px; list rows 76px.
- No icon-only controls. Icons are `aria-hidden`; a word always carries the meaning.
- Irreversible actions (finishing a recording, confirming a dose) are **press-and-hold**, with mouse,
  touch and keyboard (hold Space/Enter).
- Visible 3px focus ring; `prefers-reduced-motion` respected.
- Motion only answers an action (hold fill, spinner) or shows live audio (the level meter).

## Don't

- Don't say "error", "wrong" or "conflict" about a claim, or colour one red/green.
- Don't add a second accent colour, gradients, or illustrations.
- Don't set the Literata quote face on anything a clinician didn't say.
