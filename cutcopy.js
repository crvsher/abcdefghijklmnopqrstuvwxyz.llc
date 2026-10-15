// cut copy (user, 2026-10-14): one line at a time by default, plus two views of the whole pile:
// a numbered list in a random order, and the wall (the strings note as written). In list and
// wall, any line hovered, tapped, clicked or held gets the same red cross-out as one at a time
// (user, 2026-10-14). ?view=list|wall opens a view;
// #n is line n of the strings note in every view. Lines come from lines.js (CUT_LINES).
(() => {
  "use strict";
  const LINES = window.CUT_LINES;
  const root = document.getElementById("cc");
  if (!root || !LINES) return;

  const VIEWS = { one: "one at a time", list: "list", wall: "wall" };

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const shuffled = () => {
    const a = LINES.map((_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Lines already cut: every line shown in one at a time, plus any tapped in list or wall
  // (user, 2026-10-14). Kept in this browser by a short hash of each line's text, so edits to
  // the note don't cross out the wrong lines. Browser storage can be missing; then it's per visit.
  const KEY = "cut-copy-cut";
  const hash = t => {
    let h = 0x811c9dc5;
    for (let k = 0; k < t.length; k++) h = Math.imul(h ^ t.charCodeAt(k), 0x01000193);
    return (h >>> 0).toString(36);
  };
  const cut = new Set();
  try { JSON.parse(localStorage.getItem(KEY) || "[]").forEach(h => cut.add(h)); } catch (e) {}
  let saving;
  const save = () => {
    clearTimeout(saving);
    saving = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify([...cut])); } catch (e) {} }, 300);
  };
  const isCut = i => cut.has(hash(LINES[i]));
  const setCut = (i, on) => { on ? cut.add(hash(LINES[i])) : cut.delete(hash(LINES[i])); save(); };

  const hashIndex = () => {
    const n = parseInt(location.hash.slice(1), 10);
    return n >= 1 && n <= LINES.length ? n - 1 : -1;
  };

  // Crossing out in list and wall: hover crosses a line out while the pointer is on it, pressing
  // (mouse or finger) while held, and a click or tap keeps it crossed out until tapped again.
  function lights(box, sel) {
    const line = e => e.target.closest?.(sel);
    box.addEventListener("pointerdown", e => line(e)?.classList.add("lit"));
    const off = e => {
      const l = line(e);
      if (l) setTimeout(() => l.classList.remove("lit"), 150);
    };
    box.addEventListener("pointerup", off);
    box.addEventListener("pointercancel", off);
    box.addEventListener("pointerout", off);
    box.addEventListener("click", e => {
      const l = line(e);
      if (!l || e.target.closest("a")) return;
      setCut(+l.dataset.i, l.classList.toggle("held"));
    });
    // A finger dragged across crosses out each line it passes, briefly.
    box.addEventListener("pointermove", e => {
      if (e.pointerType !== "touch") return;
      const l = document.elementFromPoint(e.clientX, e.clientY)?.closest(sel);
      if (!l) return;
      l.classList.add("lit");
      clearTimeout(l._t);
      l._t = setTimeout(() => l.classList.remove("lit"), 250);
    });
  }
  function jumpTo(box, sel) {
    const h = hashIndex();
    const l = h >= 0 && box.querySelector(`${sel}[data-i="${h}"]`);
    if (l) {
      l.classList.add("held");
      l.scrollIntoView({ block: "center" });
    }
  }

  // One line at a time: it types out; tap, click or space strikes it through for the next.
  let stop = () => {};
  function one(box) {
    const stage = el("div", "stage");
    stage.tabIndex = 0;
    stage.setAttribute("role", "button");
    stage.setAttribute("aria-label", "next line");
    const line = el("p", "line");
    line.setAttribute("aria-live", "polite");
    const t = el("span", "t");
    const caret = el("span", "caret");
    caret.setAttribute("aria-hidden", "true");
    line.append(t, caret);
    const meta = el("div", "meta");
    const num = el("a", "num");
    meta.append(num, el("span", null, "tap, click or press space"));
    stage.append(line, meta);
    box.append(stage);

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Unseen lines first, in a random order; the ones already cut come round after (user, 2026-10-14).
    const mixed = shuffled();
    const order = mixed.filter(i => !isCut(i)).concat(mixed.filter(i => isCut(i)));
    const h = hashIndex();
    if (h >= 0) order.unshift(h);
    let k = -1, typing = null, cutting = null, busy = false;
    function type(text) {
      clearInterval(typing);
      if (still) { t.textContent = text; return; }
      let n = 0;
      const step = Math.max(1, Math.round(text.length / 90));   // long lines type faster
      t.textContent = "";
      typing = setInterval(() => {
        n += step;
        t.textContent = text.slice(0, n);
        if (n >= text.length) clearInterval(typing);
      }, 28);
    }
    function next() {
      if (busy) return;
      const go = () => {
        k = (k + 1) % order.length;
        line.classList.remove("cut");
        num.textContent = "#" + (order[k] + 1);
        num.href = "#" + (order[k] + 1);
        type(LINES[order[k]]);
        setCut(order[k], true);                 // seen here = crossed out in list and wall
        busy = false;
      };
      if (k < 0 || still) return go();
      busy = true;
      clearInterval(typing);
      t.textContent = LINES[order[k]];          // finish the line before cutting it
      line.classList.add("cut");
      cutting = setTimeout(go, 650);
    }
    stage.addEventListener("click", e => { if (!e.target.closest("a")) next(); });
    const key = e => {
      if (e.target.closest("input, textarea, a, button")) return;
      if ([" ", "Enter", "ArrowRight"].includes(e.key)) { e.preventDefault(); next(); }
    };
    addEventListener("keydown", key);
    stop = () => { clearInterval(typing); clearTimeout(cutting); removeEventListener("keydown", key); };
    next();
  }

  // Every line, numbered, in a new random order each time.
  function list(box) {
    const ol = el("ol", "pile-list");
    const frag = document.createDocumentFragment();
    for (const i of shuffled()) {
      const li = el("li", "l");
      li.append(el("span", "t", LINES[i]));        // inline, so the cross-out follows the text
      li.dataset.i = i;
      if (isCut(i)) li.classList.add("held");
      frag.appendChild(li);
    }
    ol.appendChild(frag);
    box.append(ol);
    lights(ol, "li.l");
    jumpTo(ol, "li.l");
  }

  // The note as written: one run, lines between red ✱s, all crossed out until hovered or pressed
  // (style.css); a tap marks a line seen, which leaves a thin grey cross-out instead.
  function wall(box) {
    const p = el("p", "wall");
    const frag = document.createDocumentFragment();
    LINES.forEach((text, i) => {
      if (i) {
        const s = el("span", "sep", "✱");
        s.setAttribute("aria-hidden", "true");
        frag.appendChild(s);
      }
      const l = el("span", "l", text);
      l.dataset.i = i;
      if (isCut(i)) l.classList.add("held");
      frag.appendChild(l);
    });
    p.appendChild(frag);
    box.append(p);
    lights(p, "span.l");
    jumpTo(p, "span.l");
  }

  // The switch between views, above the lines.
  const bar = el("nav", "views");
  bar.setAttribute("aria-label", "view");
  const box = el("div", "view");
  root.append(bar, box);
  const draw = { one, list, wall };
  function show(view) {
    stop();
    stop = () => {};
    box.replaceChildren();
    document.body.dataset.view = view;
    for (const b of bar.children) b.setAttribute("aria-pressed", String(b.dataset.view === view));
    draw[view](box);
  }
  for (const [key, label] of Object.entries(VIEWS)) {
    const b = el("button", null, label);
    b.type = "button";
    b.dataset.view = key;
    b.addEventListener("click", () => {
      const url = new URL(location.href);
      if (key === "one") url.searchParams.delete("view"); else url.searchParams.set("view", key);
      url.hash = "";
      history.replaceState(null, "", url);
      show(key);
    });
    bar.append(b);
  }
  const asked = new URLSearchParams(location.search).get("view");
  show(asked in VIEWS ? asked : "one");
})();
