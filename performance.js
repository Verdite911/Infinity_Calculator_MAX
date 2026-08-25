/* ==========================================================
   CalcMAX Performance MAX — Smooth Scroll + Live Variables
   + HARD GRAPH CLEAR

   Main goals:
   - Keep scrolling smooth while a variable is animating
   - Coalesce repeated graph redraws
   - Reduce redraw pressure during scroll
   - Remove Plotly transitions
   - Restore normal rendering after scrolling stops
   - HARD DELETE all graph traces when Clear is pressed
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

  // ==========================================================
  // SCROLL DETECTION
  // ==========================================================

  function markScrolling() {
    state.scrolling = true;

    clearTimeout(state.scrollTimer);

    state.scrollTimer = setTimeout(() => {
      state.scrolling = false;

      const pending =
        window.CalcMaxPerformance._pendingCallback;

      if (pending) {
        window.CalcMaxPerformance._pendingCallback = null;

        requestAnimationFrame(() => {
          try {
            pending();
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

  window.addEventListener(
    "scroll",
    markScrolling,
    {
      passive: true
    }
  );

  window.addEventListener(
    "wheel",
    markScrolling,
    {
      passive: true
    }
  );

  window.addEventListener(
    "touchmove",
    markScrolling,
    {
      passive: true
    }
  );

  // ==========================================================
  // SMART REDRAW
  // ==========================================================

  function requestDraw(callback) {
    if (typeof callback !== "function") {
      return;
    }

    window.CalcMaxPerformance._pendingCallback =
      callback;

    const now = performance.now();

    const targetFPS = state.scrolling
      ? state.scrollFPS
      : state.normalFPS;

    const minimumInterval =
      1000 / targetFPS;

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

      state.lastDraw =
        performance.now();

      const draw =
        window.CalcMaxPerformance._pendingCallback;

      window.CalcMaxPerformance._pendingCallback =
        null;

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

  // ==========================================================
  // HARD DELETE GRAPH
  // ==========================================================

  function hardClearGraph() {
    const graph =
      document.getElementById("graph");

    if (!graph) {
      return;
    }

    try {
      // Completely destroy Plotly's graph state.
      if (
        window.Plotly &&
        typeof Plotly.purge === "function"
      ) {
        Plotly.purge(graph);
      }
    } catch (error) {
      console.warn(
        "CalcMAX Plotly purge failed:",
        error
      );
    }

    // Remove any remaining Plotly-created DOM content.
    try {
      graph.innerHTML = "";
    } catch {}

    // Reset references that Plotly may have attached.
    try {
      delete graph.data;
    } catch {}

    try {
      delete graph.layout;
    } catch {}

    try {
      delete graph._fullLayout;
    } catch {}

    try {
      delete graph._fullData;
    } catch {}

    // Cancel pending redraw.
    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    window.CalcMaxPerformance._pendingCallback =
      null;
  }

  /*
   * Catch the Clear button before/after CalcMAX handles it.
   *
   * Your existing button should have:
   *
   *   id="clearBtn"
   */
  function installClearHandler() {
    document.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest?.("#clearBtn");

        if (!button) {
          return;
        }

        // Let CalcMAX's existing clear code run first,
        // then completely destroy the old Plotly graph.
        setTimeout(() => {
          hardClearGraph();
        }, 0);
      },
      true
    );
  }

  // ==========================================================
  // PLOTLY OPTIMIZATION
  // ==========================================================

  function patchPlotly() {
    if (
      state.patched ||
      !window.Plotly
    ) {
      return;
    }

    const P = window.Plotly;

    // --------------------------------------------------------
    // newPlot
    // --------------------------------------------------------

    if (
      typeof P.newPlot ===
      "function"
    ) {
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

    // --------------------------------------------------------
    // react
    // --------------------------------------------------------

    if (
      typeof P.react ===
      "function"
    ) {
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

    // --------------------------------------------------------
    // animate
    // --------------------------------------------------------

    if (
      typeof P.animate ===
      "function"
    ) {
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

  // ==========================================================
  // RESIZE
  // ==========================================================

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
    clearTimeout(
      state.resizeTimer
    );

    state.resizeTimer =
      setTimeout(() => {
        state.resizeTimer = 0;

        requestAnimationFrame(() => {
          resizeGraph();
        });
      }, 100);
  }

  window.addEventListener(
    "resize",
    scheduleResize,
    {
      passive: true
    }
  );

  // ==========================================================
  // SMART GRAPH SAMPLING
  // ==========================================================

  function smartSampleCount(
    base = 1200
  ) {
    const width =
      window.innerWidth || 1200;

    const maximum =
      Math.max(
        400,
        Math.round(width * 1.5)
      );

    return Math.min(
      base,
      maximum
    );
  }

  // ==========================================================
  // PUBLIC API
  // ==========================================================

  window.CalcMaxPerformance = {
    version: "MAX-3.0",

    fastMode: true,

    requestDraw,

    schedule: requestDraw,

    patchPlotly,

    resize: resizeGraph,

    smartSampleCount,

    clearGraph: hardClearGraph,

    isScrolling: () =>
      state.scrolling,

    getFrameRate: () =>
      state.scrolling
        ? state.scrollFPS
        : state.normalFPS,

    _pendingCallback: null
  };

  // ==========================================================
  // START
  // ==========================================================

  patchPlotly();

  // Plotly can sometimes load slightly later.
  if (!state.patched) {
    const retry =
      setInterval(() => {
        patchPlotly();

        if (state.patched) {
          clearInterval(retry);
        }
      }, 50);

    setTimeout(() => {
      clearInterval(retry);
    }, 5000);
  }

  // Install the hard-clear behavior.
  installClearHandler();

})();
