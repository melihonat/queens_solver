# queens_solver

A webapp that solves the LinkedIn Queens game: exactly one 👑 per row, column, and color region, and no two queens touching (not even diagonally).

## Run it

Open `index.html` in a browser — no build step, no dependencies.

## Getting the day's board in

Four ways, from most to least automatic:

0. **🤖 Auto-Solve userscript (`autosolve.user.js`)** — solves the puzzle *and places the crowns for you* on LinkedIn's own page, no clicking required. Install [Tampermonkey](https://www.tampermonkey.net/), add a new script, paste in the contents of `autosolve.user.js`, save. Open `linkedin.com/games/queens`, click the **👑 Auto-Solve** button that appears bottom-right. Reads the board straight from each cell's `aria-label` (e.g. `"Empty cell of color Lavender, row 1, column 5"`), solves it, then simulates the clicks needed to cycle each target cell to the queen state.
1. **📋 Import button (in the app)** — on the LinkedIn Queens page, right-click the grid → **Inspect**, copy the grid's outer HTML, paste it into the Import dialog. The board is read from each cell's `aria-label` text, and the answer is displayed instantly — pulled straight from the live board if it's already solved, otherwise computed by the solver. (Plain **View Source** no longer works — LinkedIn now renders the board client-side, so the raw HTML response doesn't contain it. Older cached pages using `cell-color-N` classes or embedded `"gridSize"`/`"colors"` JSON are still supported as a fallback.)
2. **Ask Claude to reconstruct** — paste the Inspect-copied outer HTML into `puzzle_source.txt` and say **"reconstruct"**. Claude runs `node reconstruct.js --open`, which prints the answer in the terminal and opens the solver with the solution already placed.
3. **🎨 Paint mode** — draw the regions by hand with click/drag (right-click erases), then hit **Solve**.

## Features

- Instant solution on import: uses LinkedIn's own board state when the puzzle's already solved, backtracking solver otherwise
- Board validation (unpainted cells, wrong region count, unsolvable layouts)
- Play mode: tap to cycle ✕ → 👑 → empty, with live conflict highlighting and win detection
- Board sizes 5×5 to 14×14, auto-saved to localStorage
- `autosolve.user.js`: a Tampermonkey userscript that solves the board and places the queens directly on LinkedIn's page
