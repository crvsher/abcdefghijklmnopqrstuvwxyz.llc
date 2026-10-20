// The mirror (user, 2026-10-19): zyxwvutsrqponmlkjihgfedcbabcdefghijklmnopqrstuvw.xyz shows this site, live,
// in a frame flipped left to right. The frame is named "mirror", and that name stays with every page loaded
// in it, so each page can tell it's being mirrored:
//   - links to the user's own sites stay inside the mirror (they navigate the frame, so they're flipped too);
//   - links to sites that refuse to be framed (LinkedIn, Substack, X…) leave the mirror in the same tab;
//   - the "mirror" link at the foot of the landing page leads back out to the unflipped site.
(() => {
  "use strict";
  const HOME = "https://abcdefghijklmnopqrstuvwxyz.llc/";
  const FRAMEABLE = ["abcdefghijklmnopqrstuvwxyz.llc", "badvice.fyi", "listslists.xyz", "toomanybios.com"];
  const inMirror = window.name === "mirror";
  if (!inMirror) return;
  document.querySelectorAll("a.to-mirror").forEach(a => { a.href = HOME; a.target = "_top"; });
  document.querySelectorAll("a[href]:not(.to-mirror)").forEach(a => {
    let u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
    if (!/^https?:$/.test(u.protocol)) return;                       // mailto and friends: leave alone
    const ours = u.origin === location.origin ||
      FRAMEABLE.some(h => u.hostname === h || u.hostname.endsWith("." + h));
    if (ours) a.removeAttribute("target");
    else a.target = "_top";
  });
})();
