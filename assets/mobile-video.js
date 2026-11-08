/* mobile pass (2026-11-08): video overrides */
(function () {
  var video = document.querySelector(".em-video");
  if (!video) return;

  /* 1. Phones get the 720p encode (9.0 MB instead of 17.2 MB, same 60 fps, same sound). A phone screen shows
     the video at most ~1250 device pixels wide inline, so 720p loses nothing there, and the smallest text in the
     frames stays readable even full screen. Decided by the screen's short side, so turning the phone does not
     switch files mid-way. Tablets and desktops keep the 1080p file. */
  var shortSide = Math.min(screen.width || 9999, screen.height || 9999);
  var mp4 = video.querySelector('source[type="video/mp4"]');
  if (shortSide <= 600 && mp4 && video.paused && video.currentTime === 0) {
    var src = mp4.getAttribute("src");
    var small = src.replace("emeans_video_v3.mp4", "emeans_video_v3_720p.mp4");
    if (small !== src) {
      mp4.setAttribute("src", small);
      video.load();   /* re-pick the source; with preload="metadata" this fetches only the header */
      var dl = video.querySelector("a[href]");
      if (dl) dl.setAttribute("href", small);
    }
  }

  /* 2. Turning a phone sideways while the video is playing (or paused part-way): bring the video into view,
     where the landscape layout sizes it to fit the screen height. */
  var mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
  function onTurn() {
    if (!mq.matches || video.currentTime === 0) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) return;
    setTimeout(function () { video.scrollIntoView({block: "start", behavior: "smooth"}); }, 250);
  }
  if (mq.addEventListener) mq.addEventListener("change", onTurn);
  else if (mq.addListener) mq.addListener(onTurn);
})();
