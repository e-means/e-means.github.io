/*! mobile-blog.js: MIT License, Copyright (c) Meta Platforms, Inc. and affiliates. See https://github.com/e-means/e-means.github.io/blob/main/LICENSE */
/* mobile pass (2026-11-08): blog overrides */
/* Behaviour fixes for the blog post body on phones and tablets. Nothing here runs on a wide screen with a mouse:
   every feature checks MOBILE() at the moment it acts, so the desktop page is untouched.
   1. Wide figures open full screen on tap, where they can be zoomed (tap, or pinch) and panned.
   2. Display equations that are a little wider than the column are scaled down to fit (never below 72%).
   3. Boxes that scroll sideways (tables, code, BibTeX) get a "swipe for more" line while they overflow.
   4. Links that have no target yet (href="#", the paper) show a short note instead of jumping to the top. */
(function () {
  "use strict";
  var MQ = window.matchMedia ? window.matchMedia("(max-width: 1139px), (pointer: coarse)") : null;
  function MOBILE() { return !!(MQ && MQ.matches); }
  var ready = function (fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  };

  /* ---------- 1. full-screen figure viewer ---------- */
  var lb = null, lbImg, lbCap, lbScroll, lbHint, fitW = 0, isOpen = false, pushed = false;
  function buildViewer() {
    lb = document.createElement("div");
    lb.className = "mb-lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Figure, full screen");
    lb.innerHTML = '<div class="mb-lb-bar"><div class="mb-lb-hint"></div>' +
      '<button type="button" class="mb-lb-btn mb-lb-zoom" aria-label="Zoom in or out">&#8853;</button>' +
      '<button type="button" class="mb-lb-btn mb-lb-close" aria-label="Close">&times;</button></div>' +
      '<div class="mb-lb-scroll"><img alt=""></div><div class="mb-lb-cap"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lbCap = lb.querySelector(".mb-lb-cap");
    lbScroll = lb.querySelector(".mb-lb-scroll");
    lbHint = lb.querySelector(".mb-lb-hint");
    lb.querySelector(".mb-lb-close").addEventListener("click", function () { closeViewer(true); });
    lb.querySelector(".mb-lb-zoom").addEventListener("click", function () {
      var r = lbScroll.getBoundingClientRect();
      toggleZoom(r.left + r.width / 2, r.top + r.height / 2);
    });
    // a tap on the image zooms in around the finger, a second tap fits it back
    lbImg.addEventListener("click", function (ev) { if (!pinching) toggleZoom(ev.clientX, ev.clientY); });
    // two fingers on the image: pinch zoom, handled here so the page underneath does not zoom
    var pinching = false, d0 = 0, w0 = 0, cx = 0, cy = 0, fx = 0, fy = 0;
    function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
    lbScroll.addEventListener("touchstart", function (ev) {
      if (ev.touches.length !== 2) return;
      pinching = true; d0 = dist(ev.touches); w0 = lbImg.getBoundingClientRect().width;
      cx = (ev.touches[0].clientX + ev.touches[1].clientX) / 2;
      cy = (ev.touches[0].clientY + ev.touches[1].clientY) / 2;
      var r = lbImg.getBoundingClientRect();
      fx = (cx - r.left) / r.width; fy = (cy - r.top) / r.height;
      ev.preventDefault();
    }, { passive: false });
    lbScroll.addEventListener("touchmove", function (ev) {
      if (!pinching || ev.touches.length !== 2) return;
      ev.preventDefault();
      setWidth(w0 * dist(ev.touches) / d0, fx, fy, cx, cy);
    }, { passive: false });
    lbScroll.addEventListener("touchend", function (ev) {
      if (pinching && ev.touches.length < 2) {
        setTimeout(function () { pinching = false; }, 350);  // the lifting finger must not count as a tap
      }
    });
  }
  function maxW() { return Math.max(fitW * 4, 1200); }
  function setWidth(w, fx, fy, cx, cy) {
    w = Math.max(fitW, Math.min(maxW(), w));
    lbImg.style.width = w + "px";
    var z = w > fitW * 1.02;
    lb.classList.toggle("zoomed", z);
    var zb = lb.querySelector(".mb-lb-zoom");
    zb.innerHTML = z ? "&#8854;" : "&#8853;";
    zb.setAttribute("aria-label", z ? "Fit the figure to the screen" : "Zoom in");
    // keep the point under the finger (fx, fy as fractions of the image) under the finger
    var r = lbImg.getBoundingClientRect();
    lbScroll.scrollLeft += (r.left + fx * r.width) - cx;
    lbScroll.scrollTop += (r.top + fy * r.height) - cy;
  }
  function computeFit() {
    var sr = lbScroll.getBoundingClientRect();
    var nw = lbImg.naturalWidth || 1000, nh = lbImg.naturalHeight || 600;
    var ar = nh / nw;
    fitW = Math.min(sr.width - 16, (sr.height - 16) / ar);
    fitW = Math.max(120, fitW);
  }
  function toggleZoom(cx, cy) {
    var r = lbImg.getBoundingClientRect();
    var fx = (cx - r.left) / r.width, fy = (cy - r.top) / r.height;
    fx = Math.max(0, Math.min(1, fx)); fy = Math.max(0, Math.min(1, fy));
    if (lb.classList.contains("zoomed")) setWidth(fitW, fx, fy, cx, cy);
    else {
      // zoom so the figure's text reads at about the size it has on a desktop screen
      var sr = lbScroll.getBoundingClientRect();
      var target = Math.max(fitW * 2.5, Math.min(900, maxW()));
      setWidth(target, fx, fy, sr.left + sr.width / 2, sr.top + sr.height / 2);
    }
  }
  function openViewer(img) {
    if (!lb) buildViewer();
    var fig = img.closest("figure"), cap = fig && fig.querySelector("figcaption");
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt || "";
    lbCap.textContent = cap ? cap.textContent.replace(/\s+/g, " ").trim() : "";
    lbHint.textContent = "Tap or pinch to zoom, drag to move." +
      (window.innerHeight > window.innerWidth ? " Holding the phone sideways gives a bigger view." : "");
    lb.classList.add("open");
    lb.classList.remove("zoomed");
    lb.querySelector(".mb-lb-zoom").innerHTML = "&#8853;";
    document.documentElement.style.overflow = "hidden";
    isOpen = true;
    var go = function () { computeFit(); lbImg.style.width = fitW + "px"; lbScroll.scrollLeft = 0; lbScroll.scrollTop = 0; };
    if (lbImg.complete && lbImg.naturalWidth) go(); else lbImg.onload = go;
    try { history.pushState({ mbLb: 1 }, ""); pushed = true; } catch (e) { pushed = false; }
    lb.querySelector(".mb-lb-close").focus({ preventScroll: true });
  }
  function closeViewer(fromUi) {
    if (!isOpen) return;
    isOpen = false;
    lb.classList.remove("open");
    document.documentElement.style.overflow = "";
    if (fromUi && pushed) { pushed = false; history.back(); }
    pushed = false;
  }
  window.addEventListener("popstate", function () { if (isOpen) { pushed = false; closeViewer(false); } });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && isOpen) closeViewer(true); });
  window.addEventListener("resize", function () {
    if (!isOpen) return;
    var z = lb.classList.contains("zoomed");
    computeFit();
    if (!z) lbImg.style.width = fitW + "px";
  });

  function setupFigures() {
    var imgs = document.querySelectorAll(".wrap figure > img, .wide figure > img");
    Array.prototype.forEach.call(imgs, function (img) {
      var fig = img.parentNode;
      fig.classList.add("mb-zoomable");
      var badge = document.createElement("span");
      badge.className = "mb-zoom-badge";
      badge.setAttribute("role", "button");
      badge.setAttribute("tabindex", "0");
      badge.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); if (MOBILE()) openViewer(img); } });
      badge.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M7 1h4v4M5 11H1V7M11 1L7.2 4.8M1 11l3.8-3.8"' +
        ' fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Tap the figure to enlarge';
      fig.insertBefore(badge, img.nextSibling);
      var open = function (ev) {
        if (!MOBILE()) return;
        ev.preventDefault();
        openViewer(img);
      };
      img.addEventListener("click", open);
      badge.addEventListener("click", open);
    });
    // the badge is only drawn where the viewer works
    var sync = function () {
      Array.prototype.forEach.call(document.querySelectorAll(".mb-zoom-badge"), function (b) {
        b.style.display = MOBILE() ? "" : "none";
      });
    };
    sync();
    if (MQ && MQ.addEventListener) MQ.addEventListener("change", sync);
  }

  /* ---------- 2. display equations fit the column ---------- */
  function fitEquations() {
    Array.prototype.forEach.call(document.querySelectorAll(".eq-display"), function (box) {
      var k = box.querySelector(".katex-display > .katex");
      if (!k) return;
      k.style.fontSize = "";
      if (!MOBILE() || !box.offsetParent) return;
      var cw = box.clientWidth, sw = box.scrollWidth;
      if (sw > cw + 1) {
        var s = Math.max(0.72, (cw - 4) / sw);
        k.style.fontSize = (1.21 * s).toFixed(3) + "em";
      }
    });
  }

  /* ---------- 3. "swipe for more" under boxes that scroll sideways ---------- */
  var swipeBoxes = [];
  function setupSwipe() {
    Array.prototype.forEach.call(document.querySelectorAll(".coef-scroll, .wrap > .eq-block, .citebox"), function (box) {
      var note = document.createElement("div");
      note.className = "mb-swipe";
      note.hidden = true;
      note.setAttribute("aria-hidden", "true");
      note.textContent = box.classList.contains("coef-scroll") ? "Swipe the table sideways for more columns →"
        : "Swipe sideways to read the long lines →";
      box.parentNode.insertBefore(note, box.nextSibling);
      if (box.classList.contains("citebox") || box.classList.contains("eq-block")) note.style.marginTop = "-0.6em";
      swipeBoxes.push([box, note]);
      box.addEventListener("scroll", function () { syncSwipe(); }, { passive: true });
    });
  }
  function syncSwipe() {
    swipeBoxes.forEach(function (p) {
      var box = p[0], over = box.scrollWidth > box.clientWidth + 2;
      var atEnd = box.scrollLeft + box.clientWidth >= box.scrollWidth - 4;
      p[1].hidden = !(MOBILE() && over && !atEnd);
    });
  }

  /* ---------- 4. links with no target yet ---------- */
  var toast = null, toastT = 0;
  function showToast(msg) {
    if (!toast) { toast = document.createElement("div"); toast.className = "mb-toast"; toast.setAttribute("role", "status");
      document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }
  function setupDeadLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('.wrap a[href="#"], header.hero a[href="#"]'), function (a) {
      a.addEventListener("click", function (ev) {
        if (!MOBILE()) return;
        ev.preventDefault();
        showToast("The paper link is added on release (the paper is under review).");
      });
    });
  }

  var rq = false;
  function relayout() {
    if (rq) return;
    rq = true;
    requestAnimationFrame(function () { rq = false; fitEquations(); syncSwipe(); });
  }

  ready(function () {
    setupFigures();
    setupSwipe();
    setupDeadLinks();
    // KaTeX renders on DOMContentLoaded (a listener registered before this one); measure after it and after the fonts
    setTimeout(relayout, 0);
    window.addEventListener("load", relayout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    window.addEventListener("resize", relayout);
    if (MQ && MQ.addEventListener) MQ.addEventListener("change", relayout);
    // opening a side topic reveals equations and figures that were not measured yet
    Array.prototype.forEach.call(document.querySelectorAll("details.aside"), function (d) {
      d.addEventListener("toggle", relayout);
    });
  });
})();
