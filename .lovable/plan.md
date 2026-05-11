## Fixes

### 1. Status chip overlap (`SpinningWheel.tsx`)
Remove the absolutely positioned chip inside the live-name pill. Add it as its own line **above** the pill:

```
[ 1 / 3  ·  spinning ]      <- small gold chip, centered
[      @username         ]  <- big name pill, no overlap
```

- Drop `absolute left-3 top-3` from the chip.
- Render chip in a flex column wrapper just before the name pill (`mb-2`).
- Use plain numbers (`1 / 3`, `Winner 1`) — already done.

### 2. Wheel — cap visible slices at 24
The wheel currently renders one slice per participant, so with 50+ entries slices become invisible slivers. Cap visible slices to **24** while keeping the full participant list intact for selection logic and the scrolling panel.

- Add `MAX_VISIBLE_SLICES = 24`.
- Compute `visibleSlices = Math.min(active.length, MAX_VISIBLE_SLICES)`.
- The wheel SVG renders `visibleSlices` alternating dark/gold-tinted slices (decorative only when `active.length > 24`).
- Pointer-name tracking decoupled from slice count: when over 24, each slice represents a bucket — under the hood we still pick the real winner from `active` by name (already the case via `winners[spinIndex]` lookup), and the displayed `currentName` cycles through `active` based on rotation velocity instead of slice index. This keeps tickers and the live name moving naturally.
- Landing animation: when capped, after the final rotation we resolve the winner from `winners[spinIndex]` (unchanged), then highlight the *bucket* slice that visually aligns with the pointer.

### 3. Wheel visual polish
While in there, make it feel more premium:
- Bolder alternating fill: `#0c0c0c` and `color-mix(in oklab, var(--gold) 14%, #050505)` instead of two near-blacks.
- Thicker outer rim (`strokeWidth 6`) with a second inner rim ring at `R - RIM - 2` in faint gold for depth.
- Larger pointer (border 24px/24px/44px) with stronger gold drop-shadow.
- Bigger center hub (`R * 0.26`) so the logo has more breathing room.

### 4. Proportions check on 390×720
- Keep current wheel size cap (`min(70vw, 44svh, 400px)`).
- New chip-above-pill adds ~20px vertical → reduce live-name pill height `h-16` → `h-14` and `mt-4` → `mt-3` to compensate.

## Out of scope
Winner selection logic, audio, participant editor, business rules. No new deps.
