// Landing page: the lists lists line takes a random lists lists typeface on every visit,
// like the lists themselves (fonts from LISTS_FONTS, written in by build.py).
(() => {
  "use strict";
  const a = document.querySelector(".to-lists a");
  const fonts = window.LISTS_FONTS || [];
  if (!a || !fonts.length) return;
  const font = fonts[Math.floor(Math.random() * fonts.length)];
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(font).replace(/%20/g, "+") + "&display=swap";
  document.head.appendChild(link);
  a.style.fontFamily = `"${font}", var(--font)`;
  a.title = font;
})();

// lists lists, a list of lists: hovering opens the line into three subtasks, each the same link again
// (user, 2026-10-15). They copy the line's face; screen readers and the tab key get the one link only.
(() => {
  "use strict";
  const a = document.querySelector(".to-lists a");
  if (!a) return;
  const subs = document.createElement("ul");
  subs.className = "subs";
  subs.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) {
    const li = document.createElement("li");
    const copy = a.cloneNode(true);
    copy.tabIndex = -1;
    li.appendChild(copy);
    subs.appendChild(li);
  }
  a.closest("li").appendChild(subs);
})();

// Red belongs to cut copy alone on this page (user, 2026-10-15), so the random look below skips reds.
const isRed = h => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (max !== r || d < .25) return false;                    // not red-led, or too grey to read as red
  const hue = ((g - b) / d * 60 + 360) % 360;
  return hue < 15 || hue > 335;                              // reds and crimsons; oranges, browns, pinks stay
};

// About Simon: the line takes one of Too Many Bios' paper/ink pairs each visit, like a bio
// (pairs from BIOS_PAPERS, written in by build.py).
(() => {
  "use strict";
  const a = document.querySelector(".to-bios a");
  // only papers that show up as a swatch against this page's own background (light or dark)
  const lum = rgb => rgb.reduce((s, c, i) => s + [.2126, .7152, .0722][i] * c, 0) / 255;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const bg = lum((getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [255, 255, 255]).slice(0, 3).map(Number));
  const papers = (window.BIOS_PAPERS || []).filter(([p, i]) => Math.abs(lum(hex(p)) - bg) > .12 && !isRed(p) && !isRed(i));
  if (!a || !papers.length) return;
  let now = -1;
  const roll = () => {                                         // never the same pair twice in a row
    let i; do { i = Math.floor(Math.random() * papers.length); } while (papers.length > 1 && i === now);
    now = i;
    const w = a.querySelector(".word") || a;                  // the swatch is behind the words, not the 🪪
    w.style.background = papers[i][0];
    w.style.color = papers[i][1];
  };
  roll();
  // a new paper and ink on every hover, like tapping for the next bio
  a.addEventListener("pointerenter", roll);
  a.addEventListener("focus", roll);
})();

// Three-word horoscope: hovering spins the zodiac above the line, one sign after another, and it settles
// on today's sun sign, since the link leads to today's horoscope (user, 2026-10-15).
(() => {
  "use strict";
  const a = document.querySelector(".to-twh a");
  if (!a) return;
  const SIGNS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map(g => g + "\uFE0E");
  // the day each sign begins, in calendar order, with its index in SIGNS; before Jan 20 it's Capricorn
  const BEGINS = [[120, 10], [219, 11], [321, 0], [420, 1], [521, 2], [621, 3], [723, 4], [823, 5], [923, 6],
                  [1023, 7], [1122, 8], [1222, 9]];
  const now = new Date(), md = (now.getMonth() + 1) * 100 + now.getDate();
  let today = 9;
  BEGINS.forEach(([day, i]) => { if (md >= day) today = i; });
  const start = (today + 1) % 12;                  // one full turn, ending on today's sign
  a.dataset.sign = SIGNS[today];
  let timer = null;
  const spin = () => {
    clearInterval(timer);
    let k = 0;
    timer = setInterval(() => {
      a.dataset.sign = SIGNS[(start + k) % 12];
      if (++k > 11) clearInterval(timer);
    }, 55);
  };
  a.addEventListener("pointerenter", spin);
  a.addEventListener("focus", spin);
})();

// badvice: a new badvice face each visit (never the lists lists line's), like a piece of badvice;
// the hover swell is in style.css (fonts from BADVICE_FONTS, written in by build.py).
(() => {
  "use strict";
  const a = document.querySelector(".to-badvice a");
  const taken = (document.querySelector(".to-lists a") || {}).title;
  const fonts = (window.BADVICE_FONTS || []).filter(f => f !== taken);
  if (!a || !fonts.length) return;
  const font = fonts[Math.floor(Math.random() * fonts.length)];
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(font).replace(/%20/g, "+") + "&display=swap";
  document.head.appendChild(link);
  a.style.fontFamily = `"${font}", var(--font)`;
  a.title = font;
})();

// Social: Twitter's own link blue (style.css; user, 2026-10-15). The line counts its own characters for
// the hover's n/140.
(() => {
  "use strict";
  const a = document.querySelector(".to-social a");
  if (a) a.dataset.count = [...(a.querySelector(".word") || a).textContent.trim()].length;
})();

// Contact: the address is stored reversed and base64'd in two halves, and only becomes a
// mailto when the link is about to be used, so scrapers reading the HTML never see it.
(() => {
  "use strict";
  const dec = s => atob(s).split("").reverse().join("");
  document.querySelectorAll("a.mail").forEach(a => {
    const arm = () => { a.href = "mailto:" + dec(a.dataset.u) + "\u0040" + dec(a.dataset.d); };
    ["pointerenter", "focus", "touchstart"].forEach(ev => a.addEventListener(ev, arm, { once: true, passive: true }));
    a.addEventListener("click", () => { if (!a.href.startsWith("mailto:")) arm(); });
  });
})();

// The business card turns over when it's clicked (not when a blank is being filled in), showing the address on
// the back; click again to turn it back. A hidden button does the same for the keyboard (user, 2026-10-15).
(() => {
  "use strict";
  const card = document.querySelector(".card");
  if (!card) return;
  const front = card.querySelector(".front"), back = card.querySelector(".back");
  const turn = () => {
    const flipped = card.classList.toggle("flipped");
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
  };
  card.addEventListener("click", e => {
    if (e.target.closest("input, label, a, .turn")) return;
    turn();
  });
  card.querySelector(".turn").addEventListener("click", turn);
})();

// The business card's handwriting: every letter gets its own slight tilt, lift and size, new each visit,
// so it reads like a hand rather than a font (user, 2026-10-15: "much messier").
(() => {
  "use strict";
  const r = (lo, hi) => lo + Math.random() * (hi - lo);
  document.querySelectorAll(".card .pen").forEach(pen => {
    const text = pen.textContent;
    pen.setAttribute("aria-label", text);
    pen.textContent = "";
    [...text].forEach(c => {
      const s = document.createElement("span");
      s.className = "ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = c;
      if (c.trim()) s.style.transform = `translateY(${r(-.09, .07).toFixed(3)}em) rotate(${r(-7, 6).toFixed(1)}deg) ` +
                                        `scale(${r(.9, 1.1).toFixed(3)})`;
      else s.style.width = r(.22, .4).toFixed(2) + "em";   // uneven word spacing
      pen.appendChild(s);
    });
  });
})();

// The business card's blanks stretch to fit what's typed into them, like writing past the line, and a
// long line (an answer, or the title in the profession blank) shrinks rather than running off the card. Widths are in em, so they shrink too.
(() => {
  "use strict";
  const ctx = document.createElement("canvas").getContext("2d");
  const fitLine = line => {
    line.style.fontSize = "";
    line.querySelectorAll("input").forEach(input => {
      input.style.width = "";                                 // back to the blank's own width
      const cs = getComputedStyle(input), px = parseFloat(cs.fontSize);
      ctx.font = cs.font;
      const need = (ctx.measureText(input.value).width + 6) / px;
      if (need * px > input.getBoundingClientRect().width) input.style.width = need + "em";
    });
    const face = line.closest(".face");
    const room = face.clientWidth - parseFloat(getComputedStyle(face).paddingLeft) * 2;
    if (line.scrollWidth > room) line.style.fontSize = parseFloat(getComputedStyle(line).fontSize) * room / line.scrollWidth + "px";
  };
  const lines = [...document.querySelectorAll(".card .face > p")];   // every line fits, typed into or not
  lines.forEach(line => line.addEventListener("input", () => fitLine(line)));
  window.addEventListener("resize", () => lines.forEach(fitLine));
  document.fonts.ready.then(() => lines.forEach(fitLine));
})();
