/* ==========================================================
   CalcMAX Focus Music

   Audio file:
   focus-music.mp3

   Features:
   - Play / pause
   - Loops forever
   - Uses the existing #musicBtn button
   - Keeps volume low for background concentration
   ========================================================== */

(() => {
  "use strict";

  // Prevent this script from being installed twice.
  if (window.CalcMaxFocusMusic) return;

  let audio = null;
  let playing = false;

  /* ==========================================================
     CREATE AUDIO PLAYER
     ========================================================== */

  function createAudio() {
    if (audio) {
      return audio;
    }

    audio = new Audio("focus-music.mp3");

    // LOOP FOREVER
    audio.loop = true;

    // Quiet background volume.
    audio.volume = 0.18;

    // Let browser load the track efficiently.
    audio.preload = "auto";

    audio.addEventListener("play", () => {
      playing = true;
      updateButton();
    });

    audio.addEventListener("pause", () => {
      playing = false;
      updateButton();
    });

    audio.addEventListener("error", () => {
      playing = false;

      console.error(
        "CalcMAX Focus Music could not load focus-music.mp3"
      );

      updateButton();
    });

    return audio;
  }

  /* ==========================================================
     UPDATE BUTTON
     ========================================================== */

  function updateButton() {
    const button =
      document.getElementById("musicBtn");

    if (!button) {
      return;
    }

    if (playing) {
      button.textContent = "♫ Music ON";
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      button.title = "Pause focus music";
    } else {
      button.textContent = "♫ Music";
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
      button.title = "Play focus music";
    }
  }

  /* ==========================================================
     START
     ========================================================== */

  async function startMusic() {
    const player = createAudio();

    try {
      await player.play();

      playing = true;
      updateButton();

    } catch (error) {
      /*
        Browsers can block audio until the user interacts
        with the page. Clicking the Music button counts as
        user interaction, so the normal button click works.
      */

      console.warn(
        "CalcMAX music could not start:",
        error
      );

      playing = false;
      updateButton();
    }
  }

  /* ==========================================================
     STOP
     ========================================================== */

  function stopMusic() {
    if (!audio) {
      return;
    }

    audio.pause();

    // Start from beginning next time.
    audio.currentTime = 0;

    playing = false;

    updateButton();
  }

  /* ==========================================================
     TOGGLE
     ========================================================== */

  async function toggleMusic() {
    if (playing) {
      stopMusic();
    } else {
      await startMusic();
    }
  }

  /* ==========================================================
     BUTTON SETUP
     ========================================================== */

  function setupMusicButton() {
    const button =
      document.getElementById("musicBtn");

    if (!button) {
      console.warn(
        "CalcMAX: #musicBtn was not found."
      );

      return;
    }

    // Prevent duplicate listeners.
    if (button.dataset.musicReady === "true") {
      return;
    }

    button.dataset.musicReady = "true";

    button.addEventListener(
      "click",
      toggleMusic
    );

    updateButton();
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.CalcMaxFocusMusic = {
    start: startMusic,
    stop: stopMusic,
    toggle: toggleMusic,

    isPlaying: () => playing,

    setVolume: (volume) => {
      if (!audio) {
        createAudio();
      }

      audio.volume = Math.max(
        0,
        Math.min(1, Number(volume))
      );
    }
  };

  /* ==========================================================
     STARTUP
     ========================================================== */

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      setupMusicButton
    );
  } else {
    setupMusicButton();
  }

})();
