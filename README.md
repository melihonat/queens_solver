# queens_solver

A webapp that solves the LinkedIn Queens game: exactly one 👑 per row, column, and color region, and no two queens touching (not even diagonally).

## Run it

Open `index.html` in a browser — no build step, no dependencies.

## Getting the day's board in

Three ways, from most to least automatic:

1. **📋 Import button (in the app)** — on the LinkedIn Queens page, open View Source (or Inspect and copy the grid's outer HTML), paste it into the Import dialog, and the board is reconstructed from the `cell-color-N` classes. Then hit **Solve**.
2. **Ask Claude to reconstruct** — paste the page source into `puzzle_source.txt` and say **"reconstruct"**. Claude runs `node reconstruct.js --open`, which parses the source and opens the solver with the board pre-loaded (via a `#b=<n>:<cells>` URL hash).
3. **🎨 Paint mode** — draw the regions by hand with click/drag; right-click erases.

## Features

- Backtracking solver with board validation (unpainted cells, wrong region count, unsolvable layouts)
- Play mode: tap to cycle ✕ → 👑 → empty, with live conflict highlighting and win detection
- Hint button: reveals one correct queen at a time
- Board sizes 6×6 to 11×11, auto-saved to localStorage
