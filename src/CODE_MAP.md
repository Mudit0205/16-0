# Source structure

The game ships as one self-contained `deploy/index.html` (so it runs from a double-click or GitHub Pages with no build step). The **source is split into readable modules here in `src/`**, and `build.py` stitches them back into `index.html`.

```
src/
├── index.template.html   HTML shell (head, fonts, CDN React/Babel) with __CSS__, __JS__, __DATA__ slots
├── styles.css            all styling (themes, layout, cricket ground, modals, toasts)
├── 01-constants.js       React hook imports, CapIcon, ROLE_NAME, SLOTDEF, FORMATIONS, draft helpers, gauss()
├── 02-engine.js          the simulation engine (see table below)
├── 03-achievements.js    ACHIEVEMENTS list, BLANK_STATS, loadProfile()
├── 04-app.jsx            the React <App> component (UI, draft flow, screens) + mount
├── players.json          the player dataset embedded at build time (= __DATA__)
├── build.py              stitches the above into ../index.html
└── (rating pipeline)     master_data.py · rate_all.py · game_data.py · tags.py
```

> `game_template.html` is the older pre-split combined file — superseded by the modules above; you can delete it.

## The simulation engine — `02-engine.js`
| What | Function | Line |
|------|----------|------|
| Build a season's real franchises from squad data | `buildLeague(season)` | 3 |
| Fixture list — every team plays exactly 14 games | `buildSchedule(N)` | 19 |
| Innings total: your batting vs their bowling + variance | `innTotal(batTeam, bowlTeam)` | 33 |
| Spread an innings' runs across the order (Orange Cap) | `batInnings(team, total, tally)` | 38 |
| Spread wickets across the attack (Purple Cap) | `bowlInnings(bowlTeam, wk, tally)` | 50 |
| Play one match, decide the winner | `playMatch(A, B, tally)` | 57 |
| Reduce a match to your point of view | `youView(...)` | 67 |

The orchestrator, **`simulate()`**, lives in `04-app.jsx` (~line 197+): it assembles your XI + the chosen season's league, runs the schedule, sorts the table, plays the playoffs, then computes the Orange/Purple caps, MVP, awards, and achievement stats.

## The rating / data pipeline (Python → `players.json`)
Run in order; each reads the previous step's output. (They reference the original ball-by-ball match files and absolute paths — they document *how* ratings are derived, not a one-click build on a fresh machine.)
1. `master_data.py` — one pass over every IPL match → `master.json` (per player-season stats).
2. `rate_all.py` — the era-adjusted, role-based 0–99 rating engine → `ratings.json`.
3. `tags.py` — verified overseas / spinner / keeper name lists.
4. `game_data.py` — maps ratings to draft slots + historical batting-position floor → `players.json`.

## Build the game after editing source
```
cd src
python3 build.py      # regenerates ../index.html from the modules + players.json
```
