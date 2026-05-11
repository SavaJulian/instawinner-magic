## Goal

Tighten copy on the winner card, make the €100 prize tags more prominent, and make every participant visible during the spin via a scrolling panel placed under the wheel (works for 9:16 story layout).

## Changes

### 1. WinnerCard.tsx — copy + prize tag

- Remove the "Congratulations" eyebrow line above "Our 3 winners" (the "elegible text" the user dislikes lives here as that small uppercase line — and the matching "Eligibility complete" line on the ready screen will go too, see step 3).
- Remove the bottom "DM @emimoda to claim · within 48h" line entirely.
- Make the €100 tag bigger and bolder so it reads as the headline reward:
  - Increase from `text-lg` / `px-3 py-1` to roughly `text-2xl md:text-3xl`, `px-5 py-2`, font-display.
  - Add a soft gold glow shadow around each tag so it pops on dark background.
  - Slightly increase row padding so the bigger tag sits comfortably next to the @handle.

### 2. SpinningWheel.tsx — shrink wheel, add scrolling participants panel

- Reduce the wheel's max width so it never dominates with 100+ names; cap it at roughly 55–60% of the stage height and center it.
- Below the wheel, add a new `ParticipantsPanel` block:
  - Header: small mono label "Participants · {count}".
  - A bordered, semi-transparent dark card with a soft gold border (matches existing token style).
  - Inside: a vertically auto-scrolling list of every `allNames` entry, rendered as `@handle` chips in a single column.
  - Continuous loop scroll using a CSS keyframe (`translateY(0)` → `translateY(-50%)`) on a doubled list, so it never visibly resets. Speed proportional to participant count (slower for many, ~30–60s per loop).
  - The currently-highlighted spinning name (the one already shown in the big live-name card above) also gets highlighted in this panel: gold background, black text, slight scale. Other rows are muted white at ~60% opacity.
  - When the spin lands on a winner, that row stays gold and gets a subtle pulse for ~1s before the next round.
  - Panel is scrollable visually only — no user interaction (`pointer-events-none` on the inner track).

- Layout on 9:16 story stage:
  - Top: prize banner (already there).
  - Middle: smaller wheel + live name card.
  - Bottom: participants panel (`flex-1`, capped height ~30vh), so the wheel + panel together fill the safe zone without overflow.

### 3. routes/index.tsx — ready screen copy

- Remove the "Eligibility complete" mono label above the "Ready to draw" headline so no "eligible" wording remains anywhere.

## Out of scope

- No changes to participant editor, storage, audio, or rigged-winner logic.
- No new dependencies; scrolling uses CSS keyframes already supported by the project.

## Technical notes

- Scrolling loop: render `[...allNames, ...allNames]` inside a flex column, apply a single keyframe animation on the inner wrapper with `animationDuration: ${Math.max(30, allNames.length * 0.6)}s`, `linear`, `infinite`.
- Highlight match: compare each row's name to the current `displayName` already tracked in `SpinningWheel`; when equal, apply gold styling.
- Keep all colors on existing tokens (`var(--gold)`, `foreground`, `background`). No new CSS variables needed.
