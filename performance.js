/* ==========================================================
   CalcMAX Performance MAX
   Smooth scrolling + fast graph rendering

   IMPORTANT:
   This file does NOT control expression deletion.
   CalcMAX's own delete/clear code remains in charge of that.
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
    patched: false,
    pendingCallback: null
  };

  /* ==========================================================
     FAST PLOTLY SETTINGS
     ========================================================== */

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

  /* ==========================================================
     SCROLL DETECTION
     ========================================================== */

  function markScrolling() {
    state.scrolling = true;

    clearTimeout(state.scrollTimer);

    state.scrollTimer = setTimeout(() => {
      state.scrolling = false;

      if (state.pendingCallback) {
        const callback = state.pendingCallback;
        state.pendingCallback = null;

        requestAnimationFrame(() => {
          try {
            callback();
          } catch (error) {
            console.error(
              "CalcMAX redraw error:",
              error
            );
          }
        });
      }
    }, 140);
  }

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

  /* ==========================================================
     SMART DRAW SCHEDULER
     ========================================================== */

  function requestDraw(callback) {
    if (typeof callback !== "function") {
      return;
    }

    state.pendingCallback = callback;

    const now = performance.now();

    const fps = state.scrolling
      ? state.scrollFPS
      : state.normalFPS;

    const minimumInterval = 1000 / fps;

    if (
      now - state.lastDraw <
      minimumInterval
    ) {
      return;
    }

    if (state.frame) {
      return;
    }

    state.frame = requestAnimationFrame(() => {
      state.frame = 0;
      state.lastDraw = performance.now();

      const draw = state.pendingCallback;
      state.pendingCallback = null;

      if (!draw) {
        return;
      }

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

  /* ==========================================================
     PLOTLY OPTIMIZATION
     ========================================================== */

  function patchPlotly() {
    if (
      state.patched ||
      !window.Plotly
    ) {
      return;
    }

    const P = window.Plotly;

    /* ---------- newPlot ---------- */

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

    /* ---------- react ---------- */

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

    /* ---------- animate ---------- */

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

  /* ==========================================================
     RESIZE OPTIMIZATION
     ========================================================== */

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

  /* ==========================================================
     SMART SAMPLE COUNT
     ========================================================== */

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

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.CalcMaxPerformance = {
    version: "MAX-CLEAN",

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

    _pendingCallback: null
  };

  /* ==========================================================
     START
     ========================================================== */

  patchPlotly();

  /*
   * Plotly may load after performance.js.
   * Retry briefly.
   */

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
