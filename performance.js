/* ==========================================================
   CalcMAX Performance MAX — Smooth Scroll + Live Variables
   + SMART GRAPH CLEANUP

   Delete one expression:
     -> keep all other graphs
     -> redraw remaining expressions

   Delete the last expression:
     -> completely remove graph

   Clear all:
     -> completely remove graph
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
        const callback =
          state.pendingCallback;

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

      const draw =
        state.pendingCallback;

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
     GET EXPRESSION COUNT
     ========================================================== */

  function getExpressionCount() {
    const container =
      document.getElementById("expressions");

    if (!container) {
      return 0;
    }

    return container.querySelectorAll(".expr").length;
  }

  /* ==========================================================
     COMPLETELY DELETE THE GRAPH
     
     IMPORTANT:
     This is ONLY used when everything was cleared.
     It is NOT used when deleting one expression.
     ========================================================== */

  function hardClearGraph() {
    const graph =
      document.getElementById("graph");

    if (!graph) {
      return;
    }

    /* Cancel queued redraw */
    if (state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    }

    state.pendingCallback = null;

    /* Purge Plotly completely */
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

    /* Remove leftover graph DOM */
    try {
      graph.innerHTML = "";
    } catch {}

    /* Remove Plotly references */
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
  }

  /* ==========================================================
     REDRAW REMAINING EXPRESSIONS
     ========================================================== */

  function redrawRemainingExpressions() {
    /*
      IMPORTANT:
      We do NOT purge Plotly here.

      CalcMAX's own draw system should rebuild the graph
      from the expressions that still exist.
    */

    requestAnimationFrame(() => {

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
          window.draw();
          return;
        }
      } catch {}

      /*
        Fallback: dispatch an input event so the calculator's
        normal reactive system redraws.
      */

      try {
        const expressions =
          document.getElementById(
            "expressions"
          );

        const input =
          expressions?.querySelector(
            ".expr input[type='text']"
          );

        if (input) {
          input.dispatchEvent(
            new Event("input", {
              bubbles: true
            })
          );
        }
      } catch {}
    });
  }

  /* ==========================================================
     DELETE / CLEAR HANDLING
     ========================================================== */

  function installCleanupHandlers() {
    if (state.cleanupInstalled) {
      return;
    }

    state.cleanupInstalled = true;

    /* --------------------------------------------------------
       DELETE ONE EXPRESSION
       -------------------------------------------------------- */

    document.addEventListener(
      "click",
      event => {

        const target =
          event.target;

        if (!target) {
          return;
        }

        const deleteButton =
          target.closest?.(
            ".delete, .row-action.delete, [data-action='delete']"
          );

        if (deleteButton) {

          /*
            Let CalcMAX delete the expression first.
          */

          setTimeout(() => {

            const count =
              getExpressionCount();

            if (count === 0) {

              /*
                There is nothing left.
                Completely remove the graph.
              */

              hardClearGraph();

            } else {

              /*
                Other expressions still exist.

                DO NOT purge the graph.

                Just ask CalcMAX to redraw using
                the remaining expressions.
              */

              redrawRemainingExpressions();
            }

          }, 0);

          return;
        }

        /* ----------------------------------------------------
           CLEAR ALL EXPRESSIONS
           ---------------------------------------------------- */

        const clearButton =
          target.closest?.(
            "#clearBtn, [data-action='clear'], .clear-btn"
          );

        if (clearButton) {

          setTimeout(() => {

            const count =
              getExpressionCount();

            if (count === 0) {

              /*
                Everything was cleared.
                Now completely destroy Plotly.
              */

              hardClearGraph();

            } else {

              /*
                Some CalcMAX versions keep a blank row.
                Don't destroy the graph if expressions
                are still present.
              */

              redrawRemainingExpressions();
            }

          }, 0);

          return;
        }

      },
      true
    );

    /* --------------------------------------------------------
       WATCH EXPRESSION ROW CHANGES
       -------------------------------------------------------- */

    const expressions =
      document.getElementById(
        "expressions"
      );

    if (!expressions) {
      return;
    }

    let previousCount =
      expressions.querySelectorAll(
        ".expr"
      ).length;

    const observer =
      new MutationObserver(() => {

        const currentCount =
          expressions.querySelectorAll(
            ".expr"
          ).length;

        /*
          Expression removed.
        */

        if (
          currentCount <
          previousCount
        ) {

          setTimeout(() => {

            if (currentCount === 0) {

              /*
                Last expression was deleted.
                Completely remove graph.
              */

              hardClearGraph();

            } else {

              /*
                Some expressions remain.
                Keep the graph alive and redraw.
              */

              redrawRemainingExpressions();
            }

          }, 0);
        }

        previousCount =
          currentCount;
      });

    observer.observe(
      expressions,
      {
        childList: true,
        subtree: true
      }
    );
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

    const P =
      window.Plotly;

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
      document.getElementById(
        "graph"
      );

    if (
      graph &&
      window.Plotly &&
      Plotly.Plots &&
      typeof Plotly.Plots.resize ===
        "function"
    ) {

      Plotly.Plots.resize(
        graph
      );
    }
  }

  function scheduleResize() {

    clearTimeout(
      state.resizeTimer
    );

    state.resizeTimer =
      setTimeout(() => {

        state.resizeTimer = 0;

        requestAnimationFrame(
          resizeGraph
        );

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
     SMART SAMPLE COUNT
     ========================================================== */

  function smartSampleCount(
    base = 1200
  ) {

    const width =
      window.innerWidth || 1200;

    const maximum =
      Math.max(
        400,
        Math.round(
          width * 1.5
        )
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

    version: "MAX-5.0",

    fastMode: true,

    requestDraw,

    schedule: requestDraw,

    patchPlotly,

    resize: resizeGraph,

    smartSampleCount,

    clearGraph:
      hardClearGraph,

    redraw:
      redrawRemainingExpressions,

    isScrolling: () =>
      state.scrolling,

    getFrameRate: () =>
      state.scrolling
        ? state.scrollFPS
        : state.normalFPS,

    _pendingCallback:
      null
  };

  /* ==========================================================
     STARTUP
     ========================================================== */

  patchPlotly();

  /*
    Plotly might load after performance.js.
  */

  if (!state.patched) {

    const retry =
      setInterval(() => {

        patchPlotly();

        if (state.patched) {
          clearInterval(
            retry
          );
        }

      }, 50);

    setTimeout(() => {
      clearInterval(
        retry
      );
    }, 5000);
  }

  /*
    Install smart cleanup.
  */

  installCleanupHandlers();

})();
