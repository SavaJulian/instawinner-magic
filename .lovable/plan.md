## Goals (9:16 / 390px phone viewport)

1. Better proportions for the whole story stage on mobile.
2. Replace `01 / 02 / 03` style numbering with plain `1`, `2`, `3` everywhere.
3. Bigger EmiModa logo on the winner screen.
4. Replace the depressing sawtooth "drone" spin sound with something warmer that sits nicely under background music.

## Changes

### WinnerCard.tsx
- Winner logo: bump from `w-[55%] max-w-[300px]` → `w-[70%] max-w-[360px]`, add a touch more top margin breathing room.
- Number labels next to each winner: replace the small mono `0{i+1}` chip with a clean display-font number `{i+1}` — larger (`text-3xl md:text-4xl`), gold color, no leading zero, no mono.
- Slightly increase row vertical padding so the bigger €100 tag and number balance.
- Tighten card paddings on small screens (`px-5 py-8` mobile, `md:py-10`).

### SpinningWheel.tsx — proportions
- Prize header: shrink `€300` from `text-6xl md:text-7xl` → `text-5xl md:text-6xl` on mobile so it doesn't crowd the wheel.
- Wheel size: keep cap but reduce mobile width slightly → `min(70vw, 44svh, 400px)` so the participants panel below has more room.
- Live name display under the wheel: reduce height `h-20` → `h-16` and `mt-6` → `mt-4`, minWidth `min(72vw, 480px)`.
- Participants panel: reduce height `26vh` → `22vh` and tighten row padding so more names fit without scrolling pressure.
- Overall vertical rhythm checked at 390×720.

### SpinningWheel.tsx — sound
Replace the current `startDrone()` (two detuned sawtooths through a low lowpass — that's the "depressing" hum) with a softer, more cinematic bed that complements music:
- Two sine oscillators an octave apart (A3 220Hz + A4 440Hz) instead of sawtooths.
- Very gentle slow LFO (0.25Hz) on a bandpass around 800Hz for subtle motion.
- Lower master gain on the bed (`0.03` peak instead of `0.05`) so background music stays front.
- Slow fade-in (1.8s) and fade-out (0.8s) for a smoother in/out under music.
- Keep the existing per-slice `click()` (the satisfying tick) and `landingChime` / `finaleChime` unchanged — those are the good parts.

### routes/index.tsx
- No structural change; just verify the "Ready to draw" screen still feels balanced after the wheel scene shrinks.

## Out of scope
- No changes to participant editor, business logic, winner selection, intro, or background music handling.
- No new dependencies.
