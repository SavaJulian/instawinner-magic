## Switch from slot reels to a suspenseful spinning wheel

Keep everything else (black/gold cinematic look, fake Instagram verification, pre-marked rigged winners, intro + corner watermark, screen-record friendly). Two focused changes:

### 1. Replace slot reels with a spinning wheel that picks 3 winners

Replace `SlotReels.tsx` with a new `SpinningWheel.tsx` component.

**Visuals**
- A single large circular wheel centered on screen, filling most of the 9:16 frame.
- Every participant gets a thin slice around the wheel with their @handle written along the radius. With many names the slices look like a fine gold-on-black "barcode" ring — already cinematic before it even moves.
- Gold rim, subtle inner glow, soft drop shadow. A fixed gold pointer/arrow at the top (12 o'clock).
- Center hub: black disc with the EmiModa logo (transparent PNG, letters only).

**Suspense choreography (one wheel, three winners in sequence)**
- Press Space → wheel starts spinning fast (blurred names, audible ticking as slices pass the pointer).
- Long ramp-up: ~2s accelerate, ~4s full speed, then a slow ease-out lasting ~6–8s before it lands on Winner 1. Total ≈ 12s per winner.
- On landing: pointer "clicks" into the slice, that slice lights up gold, a confetti burst fires, the name flies out to a "Winner 01" card on the side.
- That winner's slice is then visually removed (collapses, the wheel re-balances) so they can't win twice.
- Short pause (~1.5s of held tension on the winner card), then the wheel ramps up again for Winner 2, and again for Winner 3.
- Final state: three winner cards stacked, big confetti finale, logo watermark stays in the corner the whole time.

**Rigged outcome (same hidden mechanism as before)**
- Pre-marked winners from the admin panel are still the forced result.
- The final rotation angle is computed so the pointer lands exactly on the pre-marked slice; the long ease-out hides this completely on camera.
- If fewer than 3 are pre-marked, the remaining picks are truly random from the remaining participants.

### 2. Logo treatment

- Replace the current square logo asset with a transparent PNG that shows only the "EmiModa" letters (no square background).
- Use it in three places: intro draw-in, top-left corner watermark, and the center hub of the wheel.
- Generate it via image generation with transparent background so it sits cleanly on the black wheel and corners.

### Technical notes

- New file `src/components/giveaway/SpinningWheel.tsx`. Drawn with SVG (slices as `<path>` arcs, labels with `<textPath>` along an arc) so the names actually curve along their slice and stay sharp at any size. Rotation animated with `framer-motion`'s `animate` on the SVG group.
- Sequential spins handled in component state: array of forced winner indexes, current spin index, callback fires after each landing, then triggers the next spin. Slices for already-won names are filtered out between spins.
- Ticking sound = a short WebAudio "tick" played on each slice crossing the pointer; frequency drops as the wheel slows, reinforcing the suspense. Can be muted.
- Confetti reused from `canvas-confetti` (gold + bone white, same palette).
- Delete `SlotReels.tsx` and update `src/routes/index.tsx` to render `SpinningWheel` in the spinning phase; also fix the existing runtime error where `ParticipantEditor` import path needs to resolve.
- Reuse existing `WinnerCard.tsx` for the side-stacked winner reveals.

No backend, no schema, no new dependencies.
