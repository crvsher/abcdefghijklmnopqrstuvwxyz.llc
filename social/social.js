// social: a new random order and classic Twitter profile theme on every visit, in Twitter's 2010 type.
(() => {
  "use strict";
  const pick = a => a[Math.floor(Math.random() * a.length)];
  // Twitter's built-in profile themes, 2009–2012: [background, link colour]
  const THEMES = [
    ["#c0deed", "#0084b4"], ["#c6e2ee", "#1f98c7"], ["#edece9", "#088253"], ["#0099b9", "#0099b9"],
    ["#352726", "#d02b55"], ["#709397", "#ff3300"], ["#ebebeb", "#990000"], ["#8b542b", "#9d582e"],
    ["#1a1b1f", "#2fc2ef"], ["#642d8b", "#ff0000"], ["#ff6699", "#b40b43"], ["#badfcd", "#ff0000"],
    ["#b2dfda", "#93a644"], ["#131516", "#009999"], ["#022330", "#0084b4"], ["#9ae4e8", "#0084b4"],
    ["#dbe9ed", "#cc3366"], ["#acded6", "#038543"], ["#fff04d", "#0099cc"],
  ];
  // links sit on the white panel: darken a theme's link colour until it reads (4.5:1)
  const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255)
    .map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((s, c, i) => s + c * [.2126, .7152, .0722][i], 0);
  const darken = (h, f) => "#" + [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * f)
    .toString(16).padStart(2, "0")).join("");
  const readable = h => { let c = h; for (let f = 1; (1.05 / (lum(c) + .05)) < 4.5 && f > .2; f -= .05) c = darken(h, f); return c; };

  const params = new URLSearchParams(location.search);
  const [bg, link] = THEMES[+params.get("theme")] || pick(THEMES);
  const root = document.documentElement.style;
  root.setProperty("--bg", bg);
  root.setProperty("--link", readable(link));

  // type: Twitter's own 2010 stack (user, 2026-10-15) — set in style.css, not picked per visit

  // times in the visitor's zone, old Twitter style: "4:13 PM Jun 2nd" (no year)
  const nth = d => (d % 100 >= 11 && d % 100 <= 13) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[d % 10] || "th");
  for (const t of document.querySelectorAll("time[data-ts]")) {
    const d = new Date(+t.dataset.ts * 1000);
    const h = d.getHours(), m = String(d.getMinutes()).padStart(2, "0");
    t.textContent = `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"} ${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}${nth(d.getDate())}`;
    t.dateTime = d.toISOString();
  }

  const list = document.getElementById("posts");
  const items = [...list.children];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  for (const li of items) {
    const p = li.querySelector("p");
    p.innerHTML = p.innerHTML.replace(/█+/g, m => `<span class="bar">${m}</span>`);
    list.appendChild(li);
  }
})();
