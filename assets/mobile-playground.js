/*! mobile-playground.js: MIT License, Copyright (c) Meta Platforms, Inc. and affiliates. See https://github.com/e-means/e-means.github.io/blob/main/LICENSE */
/* mobile pass (2026-11-08): playground overrides */
/* The key under the two cluster plots shows a one-phrase gloss on hover or focus. With a finger there is no
   hover, and on iOS a tapped entry keeps its focus and its sticky hover, so the gloss could not be put away
   again and sat over the readouts. Here a tap opens the gloss, a second tap on the same entry closes it, and a
   tap anywhere else closes it too. Mouse input is left alone, so the desktop behaviour is unchanged. */
(function () {
  "use strict";
  var KEY = ".panel-key [data-tip]";
  var style = document.createElement("style");
  style.textContent = KEY + ".pk-open::after{display:block;}" + KEY + ".pk-closed::after{display:none !important;}";
  document.head.appendChild(style);

  function closeAll(except) {
    var open = document.querySelectorAll(KEY + ".pk-open");
    for (var i = 0; i < open.length; i++) {
      if (open[i] === except) continue;
      open[i].classList.remove("pk-open");
      open[i].classList.add("pk-closed");
      if (document.activeElement === open[i]) open[i].blur();
    }
  }

  document.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse") return;
    var t = e.target && e.target.closest ? e.target.closest(KEY) : null;
    if (!t) {
      closeAll(null);
      var a = document.activeElement;
      if (a && a.matches && a.matches(KEY)) a.blur();
      return;
    }
    if (t.classList.contains("pk-open")) {
      closeAll(null);
      e.preventDefault();   // keeps the tap from focusing the entry again
      return;
    }
    closeAll(t);
    t.classList.remove("pk-closed");
    t.classList.add("pk-open");
  }, true);

  /* A refused setting (for instance more work than a phone allows) is reported in the status line, which on a
     phone sits under the plots, the chart and the result, a screen or two below the Train button. The tap on
     Train then seemed to do nothing. A copy of the error is shown right under the Train button, on phone layouts
     only (the stylesheet hides it elsewhere), and only while the plots are on screen to push the original down. */
  function wireErrorCopy() {
    var status = document.getElementById("statusBox");
    var controls = document.querySelector(".wide .controls");
    var anim = document.getElementById("animRow");
    if (!status || !controls || !anim) return;
    var copy = document.createElement("div");
    copy.className = "mpg-err";
    copy.setAttribute("role", "alert");
    controls.parentNode.insertBefore(copy, controls.nextSibling);
    function sync() {
      var msgs = [];
      if (status.classList.contains("err")) msgs.push(status.textContent.trim());
      else {
        var errs = status.querySelectorAll(".err");
        for (var i = 0; i < errs.length; i++) msgs.push(errs[i].textContent.trim());
      }
      var shown = anim.style.display !== "none";
      copy.textContent = shown ? msgs.filter(Boolean).join("\n") : "";
    }
    new MutationObserver(sync).observe(status, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["class"] });
    new MutationObserver(sync).observe(anim, { attributes: true, attributeFilter: ["style"] });
    sync();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireErrorCopy);
  else wireErrorCopy();

  // a mouse brings back the page's own hover behaviour
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var c = document.querySelectorAll(KEY + ".pk-closed");
    for (var i = 0; i < c.length; i++) c[i].classList.remove("pk-closed");
  }, { passive: true });
})();
