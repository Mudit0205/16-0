# 16-0 — Build the Ultimate All-Time IPL XI

Spin the slot, draft a real IPL squad player by player, and chase a flawless **16-0** season — win all 14 league games and lift the cup.

🎮 **Play:** _(your GitHub Pages URL will go here once deployed)_

## What it is

16-0 is a draft-and-simulate cricket game built from real IPL ball-by-ball data (2008–2026). Pick a formation, spin to land on a real franchise squad, and draft players into your XI under authentic constraints (max 4 overseas, position eligibility, no take-backs). Then simulate a full campaign against any season's real ten-team field and try to go unbeaten.

### Features
- **Per-season player ratings (0–99)** — era-adjusted, role-aware, derived from real ball-by-ball data.
- **Draft engine** — spin & pick with two re-rolls, a hard "no re-spin" bar, formations, and an overseas cap.
- **Pick any season's league** to face — every IPL year from 2008 to 2026 with that season's real franchises and squads.
- **Batting-vs-bowling match simulation** — a strong attack genuinely suppresses scores; reorder your line-up within each player's real historical batting positions.
- **Match-by-match reveal**, full league table, playoffs, **Orange & Purple Caps**, **MVP** and season awards.
- **20 achievements** (incl. a few memes) that save locally on your device.
- **Light / dark themes** and a responsive mobile layout.

## How to play
1. Choose a formation and the IPL season you want to take on.
2. Spin the wheel to land on a real squad, then draft one player into an open slot.
3. Fill all 11 positions (every XI needs a keeper).
4. Reorder your batting line-up, then **Simulate the season**.
5. Win all 14 + the title for a perfect 16-0.

## Tech
A single self-contained `index.html` — React (via CDN) with the player dataset embedded inline. No build step, no backend; progress and achievements are stored in the browser's localStorage.

## Credits & disclaimer
- Match data: [Cricsheet](https://cricsheet.org) (openly licensed).
- Concept inspired by [38-0.app](https://38-0.app) and its Calcio XI cousin.
- This is an independent, non-commercial fan project. Not affiliated with, endorsed by, or sponsored by the IPL, BCCI, or any franchise. All team and player names belong to their respective owners.
