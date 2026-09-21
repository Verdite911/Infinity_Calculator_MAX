/* ==========================================================
   CalcMAX Performance SAFE

   FIXED:
   - Pending graph draws can no longer get stuck.
   - Scrolling uses a lower FPS, but NEVER drops the final draw.
   - A guaranteed trailing draw happens after scrolling stops.
   - Multiple rapid draw requests are safely combined.
   - Plotly graph gets a safe resize after scrolling ends.

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
    throttleTimer: 0,
    resizeTimer: 0,
    scrollTimer: 0,

    scrolling: false,

    lastScheduledDraw: 0,

    normalFPS: 60,
    scrollFPS: 30,

    pendingDraw: null
  };


  /* ==========================================================
     DRAW SCHEDULER
     ========================================================== */

  function runPendingDraw() {
    if (state.frameId) return;
    if (!state.pendingDraw) return;

    state.frameId = requestAnimationFrame(() => {
      state.frameId = 0;

      const callback = state.pendingDraw;
      state.pendingDraw = null;

      if (!callback) return;

      state.lastScheduledDraw = performance.now();

      try {
        callback();
      } catch (error) {
        console.error(
          "CalcMAX performance draw failed:",
          error
        );
      }

      /*
         IMPORTANT:

         If another draw request appeared while this draw
         was happening, schedule it too.

         This prevents graph changes from getting lost.
      */
      if (state.pendingDraw) {
        schedulePendingDraw();
      }
    });
  }


  function schedulePendingDraw(force = false) {
    if (!state.pendingDraw) return;

    /*
       A frame is already waiting.

       It will use the newest pending callback,
       so nothing else is needed.
    */
    if (state.frameId) return;


    /*
       If we're forcing a final draw after scrolling,
       remove any old throttle timer and draw ASAP.
    */
    if (force) {
      if (state.throttleTimer) {
        clearTimeout(state.throttleTimer);
        state.throttleTimer = 0;
      }

      runPendingDraw();
      return;
    }


    /*
       If a throttle timer already exists,
       DO NOT create another one.

       The pending callback has already been updated.
    */
    if (state.throttleTimer) return;


    const now = performance.now();

    const fps = state.scrolling
      ? state.scrollFPS
      : state.normalFPS;

    const minimumInterval = 1000 / fps;

    const elapsed =
      now - state.lastScheduledDraw;

    const wait =
      Math.max(0, minimumInterval - elapsed);


    if (wait <= 0) {
      runPendingDraw();
      return;
    }


    /*
       THIS IS THE IMPORTANT FIX.

       The old performance.js simply returned here.

       That meant a draw could remain in pendingDraw forever.

       Now we schedule a timer so the draw is guaranteed
       to happen once the FPS interval has passed.
    */
    state.throttleTimer = setTimeout(() => {
      state.throttleTimer = 0;

      runPendingDraw();
    }, wait);
  }


  function requestDraw(callback) {
    if (typeof callback !== "function") {
      return;
    }

    /*
       Keep only the newest draw.

       This is safe because draw() redraws the complete
       current calculator state.
    */
    state.pendingDraw = callback;

    schedulePendingDraw();
  }


  function cancelDraw() {
    if (state.frameId) {
      cancelAnimationFrame(state.frameId);
      state.frameId = 0;
    }

    if (state.throttleTimer) {
      clearTimeout(state.throttleTimer);
      state.throttleTimer = 0;
    }

    state.pendingDraw = null;
  }



  /* ==========================================================
     SCROLL DETECTION
     ========================================================== */

  function markScrolling() {
    state.scrolling = true;

    clearTimeout(state.scrollTimer);

    state.scrollTimer = setTimeout(() => {
      state.scrollTimer = 0;
      state.scrolling = false;

      /*
         GUARANTEED FINAL DRAW.

         Even if many graph changes happened during scrolling,
         the newest state is rendered immediately when scrolling
         finishes.
      */
      if (state.pendingDraw) {
        schedulePendingDraw(true);
      }

      /*
         Plotly occasionally needs its dimensions refreshed
         after browser scrolling/layout movement.
      */
      scheduleGraphResize();

    }, 120);
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
     RESIZE HELPERS
     ========================================================== */

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

    /*
       Don't resize an unmounted graph.
    */
    if (!graph.isConnected) {
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



  /* ==========================================================
     TAB / WINDOW RESTORE
     ========================================================== */

  /*
     Browsers may pause requestAnimationFrame when the tab
     becomes hidden.

     If the user comes back while a draw is pending,
     force that graph draw to happen.
  */
  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState === "visible" &&
        state.pendingDraw
      ) {
        schedulePendingDraw(true);
      }
    }
  );


  window.addEventListener(
    "pageshow",
    () => {
      if (state.pendingDraw) {
        schedulePendingDraw(true);
      }

      scheduleGraphResize();
    }
  );



  /* ==========================================================
     ADAPTIVE SAMPLE COUNT
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
    version: "SAFE-1.1",

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

      frameQueued:
        Boolean(state.frameId),

      throttleQueued:
        Boolean(state.throttleTimer),

      drawPending:
        Boolean(state.pendingDraw)
    })
  };

})();
