# queens_solver

A webapp that solves the LinkedIn Queens game: exactly one 👑 per row, column, and color region, and no two queens touching (not even diagonally).

## Run it

Open `index.html` in a browser — no build step, no dependencies.

## Getting the day's board in

Three ways, from most to least automatic. **Pasting the page source shows the solution immediately** — no extra clicks:

1. **📋 Import button (in the app)** — on the LinkedIn Queens page, open View Source, select all, paste it into the Import dialog. The board is read from the embedded puzzle JSON (`"gridSize"`/`"colors"`), and the answer is displayed instantly — straight from the page's embedded `"solution"` when present, otherwise computed by the solver. Copying the grid's outer HTML from Inspect (`cell-color-N` classes) also works.
2. **Ask Claude to reconstruct** — paste the page source into `puzzle_source.txt` and say **"reconstruct"**. Claude runs `node reconstruct.js --open`, which prints the answer in the terminal and opens the solver with the solution already placed.
3. **🎨 Paint mode** — draw the regions by hand with click/drag (right-click erases), then hit **Solve**.

## Features

- Instant solution on import: uses LinkedIn's embedded answer when available, backtracking solver otherwise
- Board validation (unpainted cells, wrong region count, unsolvable layouts)
- Play mode: tap to cycle ✕ → 👑 → empty, with live conflict highlighting and win detection
- Board sizes 5×5 to 14×14, auto-saved to localStorage
