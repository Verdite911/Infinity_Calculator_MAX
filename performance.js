/* ==========================================================
   CalcMAX Performance Booster
   Drop-in JavaScript file

   Add this BEFORE your main script.js:
     <script src="performance.js"></script>
     <script src="script.js"></script>

   It improves responsiveness by:
   - coalescing repeated redraw requests
   - throttling expensive Plotly resize work
   - preventing duplicate animation-frame work
   - exposing a small scheduler for CalcMAX to use
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxPerformance) return;

  const state = {
    drawFrame: 0,
    resizeTimer: 0,
    lastResize: 0,
    resizeDelay: 100
  };

  function scheduleFrame(callback) {
    if (state.drawFrame) return;

    state.drawFrame = requestAnimationFrame(() => {
      state.drawFrame = 0;

      try {
        callback();
      } catch (error) {
        console.error("CalcMAX performance callback failed:", error);
      }
    });
  }

  function scheduleResize(callback) {
    if (state.resizeTimer) return;

    const now = performance.now();
    const elapsed = now - state.lastResize;
    const delay = Math.max(0, state.resizeDelay - elapsed);

    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = 0;
      state.lastResize = performance.now();

      requestAnimationFrame(() => {
        try {
          callback();
        } catch (error) {
          console.error("CalcMAX resize callback failed:", error);
        }
      });
    }, delay);
  }

  window.CalcMaxPerformance = {
    version: "1.0.0",

    scheduleDraw(callback) {
      scheduleFrame(callback);
    },

    scheduleResize(callback) {
      scheduleResize(callback);
    },

    cancelDraw() {
      if (!state.drawFrame) return;

      cancelAnimationFrame(state.drawFrame);
      state.drawFrame = 0;
    }
  };

  // Automatically throttle Plotly graph resizing.
  window.addEventListener(
    "resize",
    () => {
      scheduleResize(() => {
        const graph = document.getElementById("graph");

        if (
          graph &&
          window.Plotly &&
          Plotly.Plots &&
          typeof Plotly.Plots.resize === "function"
        ) {
          Plotly.Plots.resize(graph);
        }
      });
    },
    { passive: true }
  );

  // Make repeated queueDraw() calls cheaper if CalcMAX already defines it.
  const originalQueueDraw = window.queueDraw;

  if (typeof originalQueueDraw === "function") {
    window.queueDraw = function optimizedQueueDraw() {
      scheduleFrame(() => {
        originalQueueDraw();
      });
    };
  }
})();
