/*! mobile-header.js: MIT License, Copyright (c) Meta Platforms, Inc. and affiliates. See https://github.com/e-means/e-means.github.io/blob/main/LICENSE */
/* mobile pass (2026-11-08): header behaviour shared by all four pages.
   - the Paper and Code pop-ups close on a tap outside them, on Escape, and never stay open together
     (the results map had none of this, so its pop-ups could not be closed except by their own link)
   - one "Copy citation" handler everywhere, with a fallback for browsers without the clipboard API
     (the results map's button did nothing at all)
   - the zoomed wordmark: on an upright phone it is shown large in a strip that pans sideways, and the
     page behind it does not scroll while it is open */
(function () {
  "use strict";
  var pops = Array.prototype.slice.call(document.querySelectorAll(".em-header details.em-paper"));

  function closeOthers(keep) {
    pops.forEach(function (d) { if (d !== keep && d.open) d.open = false; });
  }
  pops.forEach(function (d) {
    d.addEventListener("toggle", function () { if (d.open) closeOthers(d); });
  });
  function outside(e) {
    pops.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  }
  document.addEventListener("pointerdown", outside);
  document.addEventListener("click", outside);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeOthers(null);
  });

  /* copy: runs in the capture phase and stops the event, so the page's own handler (if any) does not
     run a second time on top of this one */
  var cite = document.getElementById("emCite");
  function label(btn, text) {
    btn.textContent = text;
    clearTimeout(btn._emT);
    btn._emT = setTimeout(function () { btn.textContent = "Copy citation"; }, 1800);
  }
  function selectCite() {
    var r = document.createRange();
    r.selectNodeContents(cite);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  function legacyCopy(btn) {
    selectCite();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    label(btn, ok ? "Copied" : "Selected: copy it from the menu");
  }
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest && e.target.closest("#emCopy");
    if (!btn || !cite) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    var text = cite.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { label(btn, "Copied"); },
        function () { legacyCopy(btn); });
    } else {
      legacyCopy(btn);
    }
  }, true);

  /* zoom dialog */
  var zoom = document.getElementById("emZoom");
  if (!zoom) return;
  var img = zoom.querySelector("img");
  if (img && !zoom.querySelector(".em-zoom-pan")) {
    var pan = document.createElement("div");
    pan.className = "em-zoom-pan";
    img.parentNode.insertBefore(pan, img);
    pan.appendChild(img);
    var hint = document.createElement("div");
    hint.className = "em-zoom-hint";
    hint.textContent = "Swipe sideways to see the whole logo. Tap to close.";
    zoom.appendChild(hint);
  }
  var panEl = zoom.querySelector(".em-zoom-pan");
  function centre() {
    if (panEl && panEl.scrollWidth > panEl.clientWidth) {
      panEl.scrollLeft = (panEl.scrollWidth - panEl.clientWidth) / 2;
    }
  }
  function sync() {
    var open = zoom.classList.contains("open");
    document.documentElement.classList.toggle("em-zoom-lock", open);
    if (open) {
      closeOthers(null);
      requestAnimationFrame(centre);
      if (img && !img.complete) img.addEventListener("load", centre, {once: true});
    }
  }
  new MutationObserver(sync).observe(zoom, {attributes: true, attributeFilter: ["class"]});
  sync();
})();
