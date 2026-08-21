/* ==========================================================
   CalcMAX Performance MAX

   Load this BEFORE your main script.js.

   Main feature:
   FAST-FIRST-GRAPH
   Removes avoidable Plotly animation/transition delays,
   batches resize work, and keeps graph updates lightweight.
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxPerformance) return;

  const state = {
    frame: 0,
    resizeTimer: 0,
    lastResize: 0,
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

  // Run expensive work at most once per animation frame.
  function schedule(callback) {
    if (state.frame) return;

    state.frame = requestAnimationFrame(() => {
      state.frame = 0;

      try {
        callback();
      } catch (error) {
        console.error(
          "CalcMAX performance error:",
          error
        );
      }
    });
  }

  // Remove unnecessary Plotly animation and transition delays.
  function patchPlotly() {
    if (state.patched || !window.Plotly) {
      return;
    }

    const P = window.Plotly;

    // Speed up initial graph creation.
    if (typeof P.newPlot === "function") {
      const originalNewPlot = P.newPlot.bind(P);

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

    // Speed up graph updates.
    if (typeof P.react === "function") {
      const originalReact = P.react.bind(P);

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

    // Remove Plotly animation delays.
    if (typeof P.animate === "function") {
      const originalAnimate = P.animate.bind(P);

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

  // Resize the graph without repeatedly hammering Plotly.
  function resizeGraph() {
    const graph =
      document.getElementById("graph");

    if (
      graph &&
      window.Plotly &&
      Plotly.Plots &&
      typeof Plotly.Plots.resize === "function"
    ) {
      Plotly.Plots.resize(graph);
    }
  }

  // Throttle resize events.
  function scheduleResize() {
    if (state.resizeTimer) {
      return;
    }

    const now = performance.now();

    const delay = Math.max(
      0,
      100 - (now - state.lastResize)
    );

    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = 0;
      state.lastResize = performance.now();

      schedule(resizeGraph);
    }, delay);
  }

  /*
   * Public performance API.
   *
   * You can use:
   *
   * CalcMaxPerformance.requestDraw(() => {
   *   draw();
   * });
   *
   * Repeated calls within the same frame
   * collapse into one draw.
   */
  window.CalcMaxPerformance = {
    version: "MAX-1.0",

    fastMode: true,

    requestDraw(callback) {
      if (typeof callback === "function") {
        schedule(callback);
      }
    },

    patchPlotly,

    resize: resizeGraph,

    /*
     * Pick a sensible graph sample count
     * based on the user's screen width.
     */
    smartSampleCount(base = 1200) {
      const width = Math.max(
        320,
        window.innerWidth || 1200
      );

      return Math.max(
        300,
        Math.min(
          base,
          Math.round(width * 1.8)
        )
      );
    }
  };

  // Patch Plotly immediately.
  patchPlotly();

  /*
   * Plotly may load slightly after performance.js.
   * Keep trying briefly until it becomes available.
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

  // Throttled graph resizing.
  window.addEventListener(
    "resize",
    scheduleResize,
    {
      passive: true
    }
  );

})();
