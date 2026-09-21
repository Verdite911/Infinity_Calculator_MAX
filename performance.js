/* ==========================================================
   CalcMAX Performance SAFE 2.0

   - One graph draw at a time
   - Never drops a redraw
   - Does NOT throttle while scrolling
   - Does NOT resize during scrolling
   - Safe with async Plotly.react()
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxPerformance) return;

  const state = {
    frameId: 0,
    running: false,
    pendingDraw: null,
    resizeTimer: 0
  };


  /* -------------------- Draw scheduler -------------------- */

  function scheduleFrame() {
    if (state.frameId) return;
    if (state.running) return;
    if (!state.pendingDraw) return;

    state.frameId = requestAnimationFrame(runDraw);
  }


  async function runDraw() {
    state.frameId = 0;

    if (state.running) return;
    if (!state.pendingDraw) return;

    const callback = state.pendingDraw;
    state.pendingDraw = null;

    state.running = true;

    try {
      /*
        IMPORTANT:

        draw() is async because Plotly.react() is async.

        We WAIT for it to completely finish before
        allowing another draw.
      */
      await callback();

    } catch (error) {

      console.error(
        "CalcMAX graph draw failed:",
        error
      );

    } finally {

      state.running = false;

      /*
        If anything changed while Plotly was drawing,
        render the newest state now.
      */
      if (state.pendingDraw) {
        scheduleFrame();
      }
    }
  }


  function requestDraw(callback) {
    if (typeof callback !== "function") return;

    /*
      Replace old pending draws with the newest one.

      draw() rebuilds the entire graph anyway,
      so only the latest state matters.
    */
    state.pendingDraw = callback;

    scheduleFrame();
  }


  function cancelDraw() {
    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }

    state.pendingDraw = null;
  }


  /* -------------------- Resize -------------------- */

  function resizeGraph() {
    const graph = document.getElementById("graph");

    if (
      !graph ||
      !graph.isConnected ||
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
    clearTimeout(state.resizeTimer);

    state.resizeTimer = setTimeout(() => {
      state.resizeTimer = 0;

      requestAnimationFrame(resizeGraph);
    }, 100);
  }


  /*
    ONLY resize when the actual browser window changes size.

    DO NOT resize when scrolling.
  */
  window.addEventListener(
    "resize",
    scheduleGraphResize,
    { passive: true }
  );


  /* -------------------- Tab restore -------------------- */

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;

    if (state.pendingDraw) {
      scheduleFrame();
    }

    scheduleGraphResize();
  });


  window.addEventListener("pageshow", () => {
    if (state.pendingDraw) {
      scheduleFrame();
    }

    scheduleGraphResize();
  });


  /* -------------------- Sample helper -------------------- */

  function smartSampleCount(base = 1200) {
    const width = window.innerWidth || 1200;

    return Math.min(
      base,
      Math.max(
        400,
        Math.round(width * 1.5)
      )
    );
  }


  /* -------------------- Public API -------------------- */

  window.CalcMaxPerformance = {
    version: "SAFE-2.0",

    requestDraw,
    schedule: requestDraw,
    cancelDraw,

    resize: resizeGraph,
    scheduleResize: scheduleGraphResize,
    scheduleGraphResize,

    smartSampleCount,

    isDrawing: () => state.running,

    getState: () => ({
      drawing: state.running,
      frameQueued: Boolean(state.frameId),
      drawPending: Boolean(state.pendingDraw)
    })
  };

})();
