## Better spin sound + Instagram-story-ready presentation

Two-part polish pass on the giveaway page. No backend changes, no new dependencies (except optional `tone` only if needed — current WebAudio approach is enough).

### 1. New spin sound design

The current sound is a single dry triangle "tick" on every slice crossing. Replace it with a richer, more cinematic sound bed built from WebAudio synthesis (still no audio files, still zero load time).

Layered sound design inside `useTicker` (rewritten as `useSpinAudio`):

- **Mechanical click** — short filtered noise burst (12ms) instead of a raw triangle wave. Gives a real "wheel detent" feel instead of a beep. Pitch drifts down as the wheel slows (1200 Hz → 500 Hz mapped from velocity).
- **Sub-thump** — very low sine (60 Hz, 40ms) layered under each click at high speed only, to add weight while the wheel is fast. Fades out as it slows so the final clicks feel delicate.
- **Suspense drone** — a soft detuned saw pad (two oscillators ~3 Hz apart, lowpass-filtered, very low gain) that fades in when a spin starts and fades out on landing. This is the missing "tension" layer.
- **Landing chime** — on the final slice, play a 3-note gold-bell arpeggio (E5, G5, B5 sines with short reverb-like decay via gain envelopes) instead of just confetti. Triggers exactly when the pointer locks in.
- **Final flourish** — after winner 3, an extra brighter chime (octave up) for the finale moment.

All gains are kept moderate (~0.05–0.12) and master-bus through a single GainNode so a future mute toggle is one line. Sound still works after user interaction (we already gate audio behind the SPIN click, so AudioContext resumes cleanly on iOS/Safari).

### 2. Instagram Story presentation polish

Instagram Stories are 9:16, viewed on a phone, often muted-with-captions, and the top ~14% / bottom ~20% are covered by the username header and the reply bar. Optimize for that.

**Safe-zone aware layout**
- Wrap the whole giveaway view in a 9:16 "stage" container with `padding-top: 14vh` and `padding-bottom: 20vh` (only when viewport is portrait phone-sized). All key elements — prize banner, wheel, live name, winner cards — sit inside the safe zone so nothing important is ever hidden by IG's UI.
- Center the wheel vertically within the safe zone; reduce wheel size slightly on narrow viewports so the live-name card always fits below without scrolling.

**Stronger hero moment**
- Intro logo: hold one extra beat (1.2s), add a subtle gold light-sweep across the letters before fading.
- Add a one-line tagline under the logo on the intro: "Win €100 · 3 winners · Live draw" with a slow fade-in. This makes a screenshot of the very first second still tell the whole story.

**Prize banner upgrade**
- Replace the current static text with a small animated stack:
  - Tiny eyebrow line "LIVE GIVEAWAY" with a pulsing gold dot.
  - Big number "€300" rendered in the display font at ~7xl with a soft gold gradient fill.
  - Subline "3 × €100 winners".
- Sits in the top safe zone so it's always readable in the story frame.

**Live-name card upgrade**
- Add a thin animated gold progress bar under the name card that fills as the spin progresses (driven by the same animate controller). Gives viewers a visual countdown — perfect for muted viewing.
- Show a small `01 / 03` chip on the card during each spin, swapping to `WINNER` in gold when it locks.

**Winner reveal upgrade**
- After all 3 winners land, transition to a dedicated "podium" frame: three stacked cards centered vertically, big @handles, "€100" tag on each, big "EmiModa" wordmark above, "DM to claim within 48h" line below. This is the screenshot/repost frame.
- Keep the corner watermark on all frames (already done).

**Motion / camera polish**
- Add a slow continuous gentle parallax glow behind the wheel (already partially there) — animate the radial gradient's position with a 12s loop so the frame never looks static even between spins.
- Add a very subtle film-grain overlay (CSS `background-image` with an inline SVG noise filter, ~3% opacity) over the whole page. Reads as "premium" on Instagram's compression.

**Typography & contrast for phone viewing**
- Bump the live-name font size one step on narrow viewports so it stays legible when the story is viewed on a phone scrolling fast.
- Make sure all gold text passes contrast against pure black; the current `--gold` already does, just verifying.

### Technical details

- Rewrite `useTicker` inside `SpinningWheel.tsx` into a `useSpinAudio()` hook that returns `{ tick, startDrone, stopDrone, landingChime, finaleChime }`. All built on a single `AudioContext` + master `GainNode`.
- Call `startDrone()` at the top of each spin's `useEffect`, `stopDrone()` + `landingChime()` in `onComplete`, and `finaleChime()` in the final-spin branch.
- Drive the progress bar from a `useMotionValue(0)` animated alongside the rotation (same duration), or read `rotation`'s normalized progress.
- Safe-zone wrapper: a new `<StoryStage>` component in `src/components/giveaway/StoryStage.tsx` that applies the 9:16 padding via Tailwind classes and a CSS variable, used in `index.tsx` around all phases except `setup`.
- Film grain: inline SVG `<feTurbulence>` filter as a `data:` URL background on a fixed full-screen `<div aria-hidden>` at z-index 0.
- New "podium" frame replaces the current `WinnerCard` final layout — edit `WinnerCard.tsx`, no new route.
- All colors stay on existing tokens (`--gold`, `--background`, `--foreground`). No new dependencies.

### Out of scope

- No real audio file imports (kept synth-based for instant load and offline).
- No video export; user records the screen with Instagram's screen recorder as before.
- No changes to the rigged-winner logic, participant editor, or storage.
