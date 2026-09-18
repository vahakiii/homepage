/** Loaded last: idempotent initQuotes + idle prefetch of fa-brands font. */
(function () {
  "use strict";

  if (typeof initQuotes === "function") {
    initQuotes();
  }

  var idle = window.requestIdleCallback || function (cb) {
    return setTimeout(cb, 1);
  };

  idle(function () {
    try {
      var link = document.createElement("link");
      link.rel = "prefetch";
      link.as = "font";
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
      link.href = "css/fontawesome/webfonts/fa-brands-400.woff2";
      document.head.appendChild(link);
    } catch (_) { /* ignore */ }
  }, { timeout: 2000 });
})();
