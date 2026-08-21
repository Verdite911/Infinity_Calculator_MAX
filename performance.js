/* ==========================================================
   CalcMAX Performance MAX — Smooth Scroll + Live Variables

   Main goals:
   - Keep scrolling smooth while a variable is animating
   - Coalesce repeated graph redraws
   - Reduce redraw pressure during scroll
   - Remove Plotly transitions
   - Restore normal rendering after scrolling stops
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxPerformance) return;

  const state = {
    frame: 0,
    resizeTimer: 0,
    scrollTimer: 0,

    scrolling: false,
    lastDraw: 0,
    lastResize: 0,

    normalFPS: 60,
    scrollFPS: 30,

    patched: false
  };

  const FAST_CONFIG = {
    displaylogo: false,
    responsive: true,
    showTips: false
  };

  const FAST_LAYOUT = {
    transition: {
      duration: 0
    },
    uirevision: "calcmax",
    dragmode: "pan"
  };

  const FAST_ANIMATION = {
    transition: {
      duration: 0
    },
    frame: {
      duration: 0,
      redraw: false
    }
  };

  // ----------------------------------------------------------
  // Detect scrolling
  // ----------------------------------------------------------

  function markScrolling() {
    state.scrolling = true;

    clearTimeout(state.scrollTimer);

    state.scrollTimer = setTimeout(() => {
      state.scrolling = false;

      // One final redraw after scrolling stops.
      if (window.CalcMaxPerformance._pendingCallback) {
        const callback =
          window.CalcMaxPerformance._pendingCallback;

        window.CalcMaxPerformance._pendingCallback = null;

        requestAnimationFrame(() => {
          try {
            callback();
          } catch (error) {
            console.error(
              "CalcMAX final redraw failed:",
              error
            );
          }
        });
      }
    }, 140);
  }

  // Passive listeners let the browser scroll immediately.
  window.addEventListener(
    "scroll",
    markScrolling,
    { passive: true }
  );

  window.addEventListener(
    "wheel",
    markScrolling,
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    markScrolling,
    { passive: true }
  );

  // ----------------------------------------------------------
  // Smart redraw scheduler
  // ----------------------------------------------------------

  function requestDraw(callback) {
    if (typeof callback !== "function") return;

    window.CalcMaxPerformance._pendingCallback =
      callback;

    const now = performance.now();

    // While scrolling, allow fewer expensive redraws.
    const targetFPS = state.scrolling
      ? state.scrollFPS
      : state.normalFPS;

    const minimumInterval = 1000 / targetFPS;

    if (
      now - state.lastDraw <
      minimumInterval
    ) {
      return;
    }

    if (state.frame) return;

    state.frame = requestAnimationFrame(() => {
      state.frame = 0;
      state.lastDraw = performance.now();

      const draw =
        window.CalcMaxPerformance._pendingCallback;

      window.CalcMaxPerformance._pendingCallback = null;

      if (!draw) return;

      try {
        draw();
      } catch (error) {
        console.error(
          "CalcMAX performance draw failed:",
          error
        );
      }
    });
  }

  // ----------------------------------------------------------
  // Plotly optimization
  // ----------------------------------------------------------

  function patchPlotly() {
    if (state.patched || !window.Plotly) {
      return;
    }

    const P = window.Plotly;

    // Initial graph creation
    if (typeof P.newPlot === "function") {
      const originalNewPlot =
        P.newPlot.bind(P);

      P.newPlot = function(
        graph,
        data,
        layout,
        config,
        ...rest
      ) {
        return originalNewPlot(
          graph,
          data,
          Object.assign(
            {},
            layout || {},
            FAST_LAYOUT
          ),
          Object.assign(
            {},
            config || {},
            FAST_CONFIG
          ),
          ...rest
        );
      };
    }

    // Fast graph updates
    if (typeof P.react === "function") {
      const originalReact =
        P.react.bind(P);

      P.react = function(
        graph,
        data,
        layout,
        config,
        ...rest
      ) {
        return originalReact(
          graph,
          data,
          Object.assign(
            {},
            layout || {},
            FAST_LAYOUT
          ),
          Object.assign(
            {},
            config || {},
            FAST_CONFIG
          ),
          ...rest
        );
      };
    }

    // Remove animation transitions
    if (typeof P.animate === "function") {
      const originalAnimate =
        P.animate.bind(P);

      P.animate = function(
        graph,
        animation,
        options,
        ...rest
      ) {
        return originalAnimate(
          graph,
          animation,
          Object.assign(
            {},
            options || {},
            FAST_ANIMATION
          ),
          ...rest
        );
      };
    }

    state.patched = true;
  }

  // ----------------------------------------------------------
  // Resize optimization
  // ----------------------------------------------------------

  function resizeGraph() {
    const graph =
      document.getElementById("graph");

    if (
      graph &&
      window.Plotly &&
      Plotly.Plots &&
      typeof Plotly.Plots.resize ===
        "function"
    ) {
      Plotly.Plots.resize(graph);
    }
  }

  function scheduleResize() {
    clearTimeout(state.resizeTimer);

    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = 0;

      requestAnimationFrame(() => {
        resizeGraph();
      });
    }, 100);
  }

  window.addEventListener(
    "resize",
    scheduleResize,
    { passive: true }
  );

  // ----------------------------------------------------------
  // Adaptive sampling helper
  // ----------------------------------------------------------

  function smartSampleCount(base = 1200) {
    const width =
      window.innerWidth || 1200;

    // Don't calculate thousands of unnecessary points
    // when the visible graph is only a few hundred pixels.
    const maximum =
      Math.max(400, Math.round(width * 1.5));

    return Math.min(base, maximum);
  }

  // ----------------------------------------------------------
  // Public API
  // ----------------------------------------------------------

  window.CalcMaxPerformance = {
    version: "MAX-2.0",

    fastMode: true,

    requestDraw,

    schedule: requestDraw,

    patchPlotly,

    resize: resizeGraph,

    smartSampleCount,

    isScrolling: () =>
      state.scrolling,

    getFrameRate: () =>
      state.scrolling
        ? state.scrollFPS
        : state.normalFPS,

    // Internal pending callback
    _pendingCallback: null
  };

  // Try immediately.
  patchPlotly();

  // Plotly may load after this file.
  if (!state.patched) {
    const retry = setInterval(() => {
      patchPlotly();

      if (state.patched) {
        clearInterval(retry);
      }
    }, 50);

    setTimeout(() => {
      clearInterval(retry);
    }, 5000);
  }

})();
