#!/usr/bin/env node
// Reconstruct the Queens board from LinkedIn page source pasted into puzzle_source.txt.
// Usage: node reconstruct.js [--open]
// Prints an ASCII preview and a file:// URL that loads the board straight into index.html.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const MIN_N = 5, MAX_N = 14;

// LinkedIn embeds the official answer: "solution":[{"row":0,"col":7},...]
// (quotes may be \-escaped). Returns cols[row] = col, or null if absent/invalid.
function extractEmbeddedSolution(text, size) {
  const startM = /\\?"solution\\?":\s*\[/.exec(text);
  if (!startM) return null;
  let i = startM.index + startM[0].length, depth = 1;
  const start = i;
  while (i < text.length && depth > 0) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") depth--;
    i++;
  }
  const block = text.slice(start, i - 1);
  const cols = new Array(size).fill(-1);
  const pairRe = /\\?"row\\?":\s*(\d+)\s*,\s*\\?"col\\?":\s*(\d+)/g;
  let m, count = 0;
  while ((m = pairRe.exec(block))) {
    const r = +m[1], c = +m[2];
    if (r >= size || c >= size || cols[r] !== -1) return null;
    cols[r] = c;
    count++;
  }
  return (count === size && !cols.includes(-1)) ? cols : null;
}

function solve(size, regionMap) {
  const usedCols = new Array(size).fill(false);
  const usedRegions = new Set();
  const cols = new Array(size).fill(-1);
  function backtrack(row) {
    if (row === size) return true;
    for (let c = 0; c < size; c++) {
      if (usedCols[c]) continue;
      const reg = regionMap[row * size + c];
      if (usedRegions.has(reg)) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      usedCols[c] = true;
      usedRegions.add(reg);
      cols[row] = c;
      if (backtrack(row + 1)) return true;
      usedCols[c] = false;
      usedRegions.delete(reg);
      cols[row] = -1;
    }
    return false;
  }
  return backtrack(0) ? cols : null;
}

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

console.log(`Board: ${n}×${n}, ${colors} regions`);
if (colors !== n) {
  console.log(`⚠️  ${colors} regions on a ${n}×${n} board — a valid Queens puzzle needs exactly ${n}.`);
}

const embedded = extractEmbeddedSolution(text, n);
const answer = embedded || solve(n, regions);
console.log(embedded ? "\nAnswer (embedded in page source):" : answer ? "\nAnswer (computed by solver):" : "\nNo solution found!");
console.log("");
for (let r = 0; r < n; r++) {
  const row = regions.slice(r * n, (r + 1) * n).map(v => v.toString(36).toUpperCase());
  if (answer) row[answer[r]] = "👑";
  console.log(row.join(" "));
}
if (answer) {
  console.log("\nQueens (row → column, 1-based): " + answer.map((c, r) => `R${r + 1}C${c + 1}`).join("  "));
}

const hash = `#b=${n}:${regions.map(v => v.toString(36)).join("")}`;
const url = "file://" + encodeURI(path.join(__dirname, "index.html")) + hash;
console.log("\nOpen in solver:\n" + url);

if (process.argv.includes("--open")) {
  execFileSync("open", [url]);
  console.log("\nOpened in browser.");
}
