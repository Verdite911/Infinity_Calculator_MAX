/* ==========================================================
   CalcMAX Performance SAFE

   IMPORTANT:
   - Does NOT handle expression deletion.
   - Does NOT handle the Clear button.
   - Does NOT call Plotly.purge().
   - Does NOT replace Plotly.newPlot(), react(), or animate().
   - Does NOT replace queueDraw() or draw().

   Load BEFORE script.js:

     <script src="performance.js"></script>
     <script src="script.js"></script>
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxPerformance) return;

  const state = {
    frameId: 0,
    resizeTimer: 0,
    scrollTimer: 0,
    scrolling: false,
    lastScheduledDraw: 0,
    normalFPS: 60,
    scrollFPS: 30,
    pendingDraw: null
  };

  /* -------------------- Scroll detection -------------------- */

  function markScrolling() {
    state.scrolling = true;

    clearTimeout(state.scrollTimer);

    state.scrollTimer = setTimeout(() => {
      state.scrolling = false;

      if (state.pendingDraw) {
        const callback = state.pendingDraw;
        state.pendingDraw = null;

        requestAnimationFrame(() => {
          try {
            callback();
          } catch (error) {
            console.error(
              "CalcMAX performance callback failed:",
              error
            );
          }
        });
      }
    }, 140);
  }

  window.addEventListener("scroll", markScrolling, {
    passive: true
  });

  window.addEventListener("wheel", markScrolling, {
    passive: true
  });

  window.addEventListener("touchmove", markScrolling, {
    passive: true
  });

  /* -------------------- Safe frame scheduler -------------------- */

  function requestDraw(callback) {
    if (typeof callback !== "function") {
      return;
    }

    state.pendingDraw = callback;

    const now = performance.now();

    const fps = state.scrolling
      ? state.scrollFPS
      : state.normalFPS;

    const minimumInterval = 1000 / fps;

    if (
      now - state.lastScheduledDraw <
      minimumInterval
    ) {
      return;
    }

    if (state.frameId) {
      return;
    }

    state.frameId = requestAnimationFrame(() => {
      state.frameId = 0;
      state.lastScheduledDraw = performance.now();

      const callbackToRun = state.pendingDraw;
      state.pendingDraw = null;

      if (!callbackToRun) {
        return;
      }

      try {
        callbackToRun();
      } catch (error) {
        console.error(
          "CalcMAX performance draw failed:",
          error
        );
      }
    });
  }

  function cancelDraw() {
    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }

    state.pendingDraw = null;
  }

  /* -------------------- Safe resize helpers -------------------- */

  function scheduleResize(callback) {
    if (typeof callback !== "function") {
      return;
    }

    clearTimeout(state.resizeTimer);

    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = 0;

      requestAnimationFrame(() => {
        try {
          callback();
        } catch (error) {
          console.error(
            "CalcMAX resize callback failed:",
            error
          );
        }
      });
    }, 100);
  }

  function resizeGraph() {
    const graph =
      document.getElementById("graph");

    if (
      !graph ||
      !window.Plotly ||
      !Plotly.Plots ||
      typeof Plotly.Plots.resize !== "function"
    ) {
      return;
    }

    try {
      Plotly.Plots.resize(graph);
    } catch (error) {
      console.warn(
        "CalcMAX graph resize failed:",
        error
      );
    }
  }

  function scheduleGraphResize() {
    scheduleResize(resizeGraph);
  }

  window.addEventListener(
    "resize",
    scheduleGraphResize,
    { passive: true }
  );

  /* -------------------- Adaptive sample count -------------------- */

  function smartSampleCount(base = 1200) {
    const width =
      window.innerWidth || 1200;

    const maximum = Math.max(
      400,
      Math.round(width * 1.5)
    );

    return Math.min(
      base,
      maximum
    );
  }

  /* -------------------- Public API -------------------- */

  window.CalcMaxPerformance = {
    version: "SAFE-1.0",

    requestDraw,
    schedule: requestDraw,
    cancelDraw,

    resize: resizeGraph,
    scheduleResize,
    scheduleGraphResize,

    smartSampleCount,

    isScrolling: () =>
      state.scrolling,

    getFrameRate: () =>
      state.scrolling
        ? state.scrollFPS
        : state.normalFPS,

    getState: () => ({
      scrolling: state.scrolling,
      normalFPS: state.normalFPS,
      scrollFPS: state.scrollFPS,
      frameQueued: Boolean(state.frameId)
    })
  };

})();
