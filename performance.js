/* ==========================================================
   CalcMAX Performance MAX — Smooth Scroll + Live Variables
   + HARD GRAPH CLEANUP

   Features:
   - Smooth scrolling while variables animate
   - Coalesced redraws
   - Reduced Plotly transitions
   - Throttled resize
   - HARD graph purge after expression deletion
   - HARD graph purge after Clear
   - Prevents stale/deleted graph traces
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
    cleanupInstalled: false,

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

  /* ==========================================================
     SMART REDRAW
     ========================================================== */

  function requestDraw(callback) {
    if (typeof callback !== "function") {
      return;
    }

    state.pendingCallback = callback;

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
     HARD GRAPH PURGE
     ========================================================== */

  function hardClearGraph() {
    const graph =
      document.getElementById("graph");

    if (!graph) {
      return;
    }

    // Cancel any pending performance redraw.
    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    state.pendingCallback = null;

    /* --------------------------------------------------------
       Completely purge Plotly
       -------------------------------------------------------- */

    try {
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

    /* --------------------------------------------------------
       Remove leftover Plotly DOM
       -------------------------------------------------------- */

    try {
      graph.innerHTML = "";
    } catch {}

    /* --------------------------------------------------------
       Remove Plotly's internal references
       -------------------------------------------------------- */

    try {
      delete graph.data;
    } catch {}

    try {
      delete graph.layout;
    } catch {}

    try {
      delete graph._fullData;
    } catch {}

    try {
      delete graph._fullLayout;
    } catch {}

    try {
      delete graph._transitionData;
    } catch {}

    try {
      delete graph._fullLayout;
    } catch {}

    /* --------------------------------------------------------
       Remove old Plotly SVG/canvas layers if any remain
       -------------------------------------------------------- */

    try {
      graph.querySelectorAll(
        "svg, canvas, .plot-container, .svg-container"
      ).forEach(node => {
        node.remove();
      });
    } catch {}

    return true;
  }

  /* ==========================================================
     GET CURRENT EXPRESSION COUNT
     ========================================================== */

  function getExpressionCount() {
    return document.querySelectorAll(
      ".expr"
    ).length;
  }

  /* ==========================================================
     ASK CALCMAX TO REDRAW
     ========================================================== */

  function requestCalcMaxRedraw() {
    /*
      Try the application's own draw functions if exposed.
      Otherwise simulate a safe redraw request through the
      existing queueDraw mechanism.
    */

    try {
      if (
        typeof window.queueDraw ===
        "function"
      ) {
        window.queueDraw();
        return;
      }
    } catch {}

    try {
      if (
        typeof window.draw ===
        "function"
      ) {
        requestAnimationFrame(() => {
          window.draw();
        });

        return;
      }
    } catch {}
  }

  /* ==========================================================
     EXPRESSION DELETE / CLEAR HANDLER
     ========================================================== */

  function installGraphCleanup() {
    if (state.cleanupInstalled) {
      return;
    }

    state.cleanupInstalled = true;

    /*
      EVENT DELEGATION

      We listen at document level so this still works even when
      CalcMAX creates new expression rows dynamically.
    */

    document.addEventListener(
      "click",
      event => {
        const target = event.target;

        if (!target) {
          return;
        }

        /* ----------------------------------------------------
           X DELETE BUTTON ON AN EXPRESSION
           ---------------------------------------------------- */

        const deleteButton =
          target.closest?.(
            ".delete, .row-action.delete, [data-action='delete']"
          );

        if (deleteButton) {
          /*
            Let CalcMAX delete the expression first.
          */
          setTimeout(() => {
            hardClearGraph();

            /*
              If there are still expressions remaining,
              redraw the graph from scratch.
            */
            if (getExpressionCount() > 0) {
              requestAnimationFrame(() => {
                requestCalcMaxRedraw();
              });
            }
          }, 0);

          return;
        }

        /* ----------------------------------------------------
           CLEAR ALL EXPRESSIONS BUTTON
           ---------------------------------------------------- */

        const clearButton =
          target.closest?.(
            "#clearBtn, [data-action='clear'], .clear-btn"
          );

        if (clearButton) {
          /*
            Let CalcMAX clear its expressions first.
          */
          setTimeout(() => {
            hardClearGraph();

            /*
              If CalcMAX keeps a blank expression row,
              don't redraw anything automatically.
            */
            if (getExpressionCount() === 0) {
              hardClearGraph();
            }
          }, 0);

          return;
        }
      },
      true
    );

    /*
      MUTATION OBSERVER

      This catches expression rows disappearing even if the
      deletion happens through code instead of a click.
    */

    const expressions =
      document.getElementById("expressions");

    if (expressions) {
      let previousCount =
        expressions.querySelectorAll(".expr").length;

      const observer =
        new MutationObserver(() => {
          const currentCount =
            expressions.querySelectorAll(".expr").length;

          if (currentCount < previousCount) {
            setTimeout(() => {
              hardClearGraph();

              if (currentCount > 0) {
                requestAnimationFrame(() => {
                  requestCalcMaxRedraw();
                });
              }
            }, 0);
          }

          previousCount = currentCount;
        });

      observer.observe(
        expressions,
        {
          childList: true,
          subtree: true
        }
      );
    }
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

    /* --------------------------------------------------------
       newPlot
       -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       react
       -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       animate
       -------------------------------------------------------- */

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

  /* ==========================================================
     SMART GRAPH SAMPLING
     ========================================================== */

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

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.CalcMaxPerformance = {
    version: "MAX-4.0",

    fastMode: true,

    requestDraw,

    schedule: requestDraw,

    patchPlotly,

    resize: resizeGraph,

    smartSampleCount,

    clearGraph: hardClearGraph,

    redraw: requestCalcMaxRedraw,

    isScrolling: () =>
      state.scrolling,

    getFrameRate: () =>
      state.scrolling
        ? state.scrollFPS
        : state.normalFPS,

    _pendingCallback: null
  };

  /* ==========================================================
     STARTUP
     ========================================================== */

  patchPlotly();

  /*
    Plotly can load slightly after performance.js.
  */

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

  /*
    Install delete/clear cleanup.
  */

  installGraphCleanup();

})();
