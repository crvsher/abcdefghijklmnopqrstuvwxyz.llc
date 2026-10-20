// The mirrors (user, 2026-10-19). Loaded at the top of <head>, not deferred, on all four of the user's framed sites
// (abcdefghijklmnopqrstuvwxyz.llc, badvice.fyi, listslists.xyz, toomanybios.com). It does nothing unless the page
// is inside one of the mirrors, which it can tell from the frame's name (a name stays with every page loaded in it):
//   "mirror"          zyxwvutsrqponmlkjihgfedcba.llc: the site, live, flipped left to right
//   "mirror-plain:N"  zyxwvutsrqponmlkjihgfedcbabcdefghijklmnopqrstuvw.xyz, right half: the site as it is
//   "mirror-glass:N"  the same, left half: flipped
// In any mirror, links to the user's own sites stay inside the frame; links to sites that refuse to be framed
// (LinkedIn, Substack, X…) leave it in the same tab; the three addresses at the foot of each page lead out.
// In the pair, the two halves keep together: N seeds Math.random (with the page's path), so both halves roll the
// same fonts, colors and lines; each click on one side is replayed on the other; scrolling and the pointer are
// passed across; and whichever page one side goes to, the other follows.
(() => {
  "use strict";
  const FRAMEABLE = ["abcdefghijklmnopqrstuvwxyz.llc", "badvice.fyi", "listslists.xyz", "toomanybios.com"];
  const PAIR = ["https://zyxwvutsrqponmlkjihgfedcbabcdefghijklmnopqrstuvw.xyz"];
  if (!/^mirror/.test(window.name) || window.parent === window) return;
  const pair = window.name.match(/^mirror-(plain|glass):(\d+)$/);
  const fromPair = e => e.source === window.parent &&
    (PAIR.includes(e.origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(e.origin));

  // Same seed, same page → same random numbers on both sides (mulberry32).
  if (pair) {
    let h = 2166136261;
    for (const c of pair[2] + location.pathname + location.search) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    let s = h >>> 0;
    Math.random = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Each side keeps its own browser storage (badvice and Too Many Bios remember what's been shown), or the side that
  // loads second would skip what the first just showed. Doing the same things from the same start, the two keep the same memories.
  if (pair) {
    try {
      const real = window.localStorage, pre = "mirror-" + pair[1] + ":" + pair[2] + ":";   // this visit only, so both start alike
      const own = {
        getItem: k => real.getItem(pre + k),
        setItem: (k, v) => real.setItem(pre + k, v),
        removeItem: k => real.removeItem(pre + k),
        clear: () => Object.keys(real).filter(k => k.startsWith(pre)).forEach(k => real.removeItem(k)),
        key: i => (Object.keys(real).filter(k => k.startsWith(pre))[i] || "").slice(pre.length) || null,
        get length() { return Object.keys(real).filter(k => k.startsWith(pre)).length; },
      };
      Object.defineProperty(window, "localStorage", { configurable: true, get: () => own });
    } catch (e) { /* storage blocked: nothing to keep apart */ }
  }

  // Addresses read as they would in the address bar, always (user, 2026-10-19). On a flipped side every address link is
  // turned back the right way; one that names this site (the business card's back, the top of a page) names the mirror
  // instead, since that's where the reader is. The three addresses at the foot of each page lead out of the mirror.
  const flipped = window.name === "mirror" || (pair && pair[1] === "glass");
  const ADDRESS = "abcdefghijklmnopqrstuvwxyz.llc", MIRRORED = "zyxwvutsrqponmlkjihgfedcba.llc";
  const ADDRESSES = [ADDRESS, MIRRORED, "zyxwvutsrqponmlkjihgfedcbabcdefghijklmnopqrstuvw.xyz"];
  const address = () => {
    document.querySelectorAll("a").forEach(a => {
      const text = a.textContent.trim();
      if (!ADDRESSES.includes(text)) return;
      if (text === ADDRESS && !a.classList.contains("addr")) {
        a.textContent = MIRRORED;
        a.href = "https://" + MIRRORED + "/";
        a.classList.add("addr");
      }
      Object.assign(a.style, { display: "inline-block", maxWidth: "100%", transform: "scaleX(-1)" });
    });
  };

  const links = () => {
    if (flipped) address();
    document.querySelectorAll("a.addr").forEach(a => { a.target = "_top"; });
    document.querySelectorAll("a[href]:not(.addr)").forEach(a => {
      let u;
      try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
      if (!/^https?:$/.test(u.protocol)) return;                     // mailto and friends: leave alone
      const ours = u.origin === location.origin ||
        FRAMEABLE.some(h => u.hostname === h || u.hostname.endsWith("." + h));
      if (ours) a.removeAttribute("target");
      else a.target = "_top";
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", links);
  else links();
  if (!pair) return;

  const tell = msg => window.parent.postMessage(Object.assign({ mirror: 1 }, msg), "*");

  // An element's place in the page, as child indexes from <body>: the same on both sides, since they're the same page.
  const pathTo = el => {
    const path = [];
    for (; el && el !== document.body; el = el.parentElement) {
      if (!el.parentElement) return null;
      path.unshift([...el.parentElement.children].indexOf(el));
    }
    return el ? path : null;
  };
  const find = path => path.reduce((el, i) => el && el.children[i], document.body);

  // Clicks. Ones that leave the page aren't replayed: the page they lead to is passed across instead (below), and
  // mail or a site outside the mirrors should only happen once.
  let replaying = false;
  window.addEventListener("click", e => {
    if (replaying || !e.isTrusted) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (a && !e.defaultPrevented) {
      if (a.target === "_top" || !/^https?:$/.test(a.protocol)) return;
      if (a.pathname !== location.pathname || a.origin !== location.origin) return;   // a new page
    }
    const path = pathTo(e.target);
    if (path) tell({ k: "click", path });
  });

  // Typing (the business card's blanks).
  document.addEventListener("input", e => {
    if (replaying || !e.isTrusted) return;
    const path = pathTo(e.target);
    if (path && "value" in e.target) tell({ k: "input", path, value: e.target.value });
  });

  // Scrolling, as a share of the way down, so it matches even if the two sides differ a little in height.
  let quietUntil = 0;
  const room = () => document.documentElement.scrollHeight - innerHeight;
  window.addEventListener("scroll", () => {
    if (performance.now() < quietUntil) return;
    tell({ k: "scroll", at: room() > 0 ? scrollY / room() : 0 });
  }, { passive: true });

  // The pointer, in the page's own coordinates; the pair draws it over the other side, reflected.
  document.addEventListener("pointermove", e => tell({ k: "point", x: e.clientX / innerWidth, y: e.clientY / innerHeight }), { passive: true });
  document.addEventListener("pointerleave", () => tell({ k: "point", x: null }));

  window.addEventListener("message", e => {
    if (!fromPair(e) || !e.data || !e.data.mirror) return;
    const m = e.data;
    if (m.k === "click" || m.k === "input") {
      const el = find(m.path);
      if (!el) return;
      replaying = true;
      try {
        if (m.k === "input") {
          el.value = m.value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        } else el.click();
      } finally { replaying = false; }
    } else if (m.k === "scroll") {
      quietUntil = performance.now() + 150;
      window.scrollTo(0, m.at * room());
    } else if (m.k === "go" && m.href !== location.href) {
      location.replace(m.href);
    }
  });

  // Where this side is: on arrival, and on moves within the page.
  const here = () => tell({ k: "here", href: location.href, v: 4 });
  here();
  window.addEventListener("hashchange", here);
  window.addEventListener("popstate", here);
})();
