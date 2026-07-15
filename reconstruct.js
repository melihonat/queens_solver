#!/usr/bin/env node
// Reconstruct the Queens board from LinkedIn page source pasted into puzzle_source.txt.
// Usage: node reconstruct.js [--open]
// Prints an ASCII preview and a file:// URL that loads the board straight into index.html.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MIN_N = 6, MAX_N = 11;

function parseLinkedInSource(text) {
  // Format 1 (View Source): puzzle JSON in the hydration payload —
  // "gridSize":8 ... "colors":[0,0,0,1,0,0,0,2] per row (quotes may be \-escaped).
  const rows = [];
  const rowRe = /\\?"colors\\?":\s*\[([0-9,\s]+)\]/g;
  let rm;
  while ((rm = rowRe.exec(text))) rows.push(rm[1].split(",").map(Number));
  if (rows.length) {
    const sizeM = text.match(/\\?"gridSize\\?":\s*(\d+)/);
    const size = sizeM ? +sizeM[1] : rows.length;
    const grid = rows.slice(0, size);
    if (size >= MIN_N && size <= MAX_N && grid.length === size && grid.every(r => r.length === size)) {
      const colorMap = new Map();
      const reg = [];
      for (const row of grid) {
        for (const c of row) {
          if (!colorMap.has(c)) colorMap.set(c, colorMap.size);
          reg.push(colorMap.get(c));
        }
      }
      return { n: size, regions: reg, colors: colorMap.size };
    }
  }
  // Format 2 (Inspect → copy outerHTML): cell-color-N divs
  const cells = [];
  const tagRe = /<div\b[^>]*cell-color-(\d+)[^>]*>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    const tag = m[0];
    const idxM = tag.match(/data-cell-idx="(\d+)"/);
    cells.push({ idx: idxM ? +idxM[1] : cells.length, color: +m[1] });
  }
  const byIdx = new Map();
  for (const c of cells) if (!byIdx.has(c.idx)) byIdx.set(c.idx, c.color);
  const count = byIdx.size;
  const size = Math.round(Math.sqrt(count));
  if (count === 0) throw new Error("No cells found — the paste must include the grid HTML (cell-color-N classes).");
  if (size * size !== count || size < MIN_N || size > MAX_N) {
    throw new Error(`Found ${count} cells, which isn't a ${MIN_N}-${MAX_N} square board.`);
  }
  const colorMap = new Map();
  const reg = new Array(count);
  [...byIdx.entries()].sort((a, b) => a[0] - b[0]).forEach(([, color], pos) => {
    if (!colorMap.has(color)) colorMap.set(color, colorMap.size);
    reg[pos] = colorMap.get(color);
  });
  return { n: size, regions: reg, colors: colorMap.size };
}

const srcPath = path.join(__dirname, "puzzle_source.txt");
const text = fs.readFileSync(srcPath, "utf8");
const { n, regions, colors } = parseLinkedInSource(text);

console.log(`Board: ${n}×${n}, ${colors} regions\n`);
for (let r = 0; r < n; r++) {
  console.log(regions.slice(r * n, (r + 1) * n).map(v => v.toString(36).toUpperCase()).join(" "));
}
if (colors !== n) {
  console.log(`\n⚠️  ${colors} regions on a ${n}×${n} board — a valid Queens puzzle needs exactly ${n}.`);
}

const hash = `#b=${n}:${regions.map(v => v.toString(36)).join("")}`;
const url = "file://" + encodeURI(path.join(__dirname, "index.html")) + hash;
console.log("\nOpen in solver:\n" + url);

if (process.argv.includes("--open")) {
  execFileSync("open", [url]);
  console.log("\nOpened in browser.");
}
