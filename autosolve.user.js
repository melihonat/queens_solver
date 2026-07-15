// ==UserScript==
// @name         LinkedIn Queens Auto-Solver
// @namespace    queens-solver
// @version      1.1
// @description  Solves the daily LinkedIn Queens puzzle and places the crowns for you
// @match        https://www.linkedin.com/games/queens*
// @match        http://localhost/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Each cell's aria-label is self-describing, e.g.:
  //   "Empty cell of color Lavender, row 1, column 5"
  //   "Cross of color Lavender, row 7, column 5"
  //   "Queen of color Soft Blue, row 2, column 8"
  const CELL_LABEL_RE = /^(Empty|Cross|Queen)(?: cell)? of color ([^,]+), row (\d+), column (\d+)/;

  function readBoard() {
    const els = Array.from(document.querySelectorAll("[data-cell-idx]"));
    if (!els.length) return null;
    els.sort((a, b) => +a.getAttribute("data-cell-idx") - +b.getAttribute("data-cell-idx"));
    const n = Math.round(Math.sqrt(els.length));
    if (n * n !== els.length) return null;

    const parsed = els.map(el => {
      const m = CELL_LABEL_RE.exec(el.getAttribute("aria-label") || "");
      return m ? { state: m[1], color: m[2], row: +m[3] - 1, col: +m[4] - 1 } : null;
    });
    if (parsed.some(p => !p)) return null;

    const colorMap = new Map();
    const regions = parsed.map(p => {
      if (!colorMap.has(p.color)) colorMap.set(p.color, colorMap.size);
      return colorMap.get(p.color);
    });

    return { n, regions, states: parsed.map(p => p.state), colorCount: colorMap.size };
  }

  function solve(n, regions) {
    const usedCols = new Array(n).fill(false);
    const usedRegions = new Set();
    const cols = new Array(n).fill(-1);
    function backtrack(row) {
      if (row === n) return true;
      for (let c = 0; c < n; c++) {
        if (usedCols[c]) continue;
        const reg = regions[row * n + c];
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

  function getCellByIdx(idx) {
    return document.querySelector(`[data-cell-idx="${idx}"]`);
  }

  function cellState(idx) {
    const el = getCellByIdx(idx);
    if (!el) return null;
    const m = CELL_LABEL_RE.exec(el.getAttribute("aria-label") || "");
    return m ? m[1] : null;
  }

  function fireClick(el) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const base = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
      const Ctor = type.startsWith("pointer") && "PointerEvent" in window ? PointerEvent : MouseEvent;
      el.dispatchEvent(new Ctor(type, base));
    }
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // "Tap once to place X and tap twice for a queen" — cycle is Empty -> Cross -> Queen -> Empty.
  async function clickUntilQueen(idx, maxClicks = 4) {
    for (let i = 0; i < maxClicks; i++) {
      if (cellState(idx) === "Queen") return true;
      const el = getCellByIdx(idx);
      if (!el) return false;
      fireClick(el);
      await sleep(150 + Math.random() * 100);
    }
    return cellState(idx) === "Queen";
  }

  async function solveBoard(btn) {
    const board = readBoard();
    if (!board) {
      alert("Queens Auto-Solver: couldn't read the board from this page.");
      return;
    }
    const { n, regions, states, colorCount } = board;
    if (colorCount !== n) {
      alert(`Queens Auto-Solver: found ${colorCount} colors on a ${n}x${n} board — expected ${n}. Board may not have loaded yet.`);
      return;
    }
    if (states.filter(s => s === "Queen").length === n) {
      alert("Queens Auto-Solver: today's puzzle is already solved!");
      return;
    }

    const answer = solve(n, regions);
    if (!answer) {
      alert("Queens Auto-Solver: no solution found — board may not have parsed correctly.");
      return;
    }

    for (let row = 0; row < n; row++) {
      const idx = row * n + answer[row];
      if (btn) btn.textContent = `Solving… ${row + 1}/${n}`;
      const ok = await clickUntilQueen(idx);
      if (!ok) console.warn(`Queens Auto-Solver: cell idx ${idx} (row ${row + 1}) never reached the Queen state — click simulation may need adjusting.`);
    }
  }

  function injectButton() {
    if (document.getElementById("qs-autosolve-btn")) return;
    if (!document.querySelector("[data-cell-idx]")) return; // wait for board to render

    const btn = document.createElement("button");
    btn.id = "qs-autosolve-btn";
    btn.textContent = "👑 Auto-Solve";
    btn.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:99999;padding:10px 16px;" +
      "background:#0a66c2;color:#fff;border:none;border-radius:20px;font-size:14px;" +
      "font-weight:600;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);";
    btn.addEventListener("click", () => {
      btn.disabled = true;
      const original = btn.textContent;
      solveBoard(btn).finally(() => {
        btn.disabled = false;
        btn.textContent = original;
      });
    });
    document.body.appendChild(btn);
  }

  new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
  injectButton();
})();
