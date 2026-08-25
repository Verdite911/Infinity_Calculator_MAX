/* ==========================================================
   CalcMAX Focus Music

   Audio file:
   Golden-Hour-chosic.com_.mp3

   Button:
   <button class="icon-btn" id="musicBtn" type="button">
     ♫ Music
   </button>

   Features:
   - Play / pause
   - Loops forever
   - Uses your existing musicBtn
   - Low background volume
   ========================================================== */

(() => {
  "use strict";

  // Prevent the script from loading twice.
  if (window.CalcMaxFocusMusic) return;

  let audio = null;
  let playing = false;
  let ready = false;

  // IMPORTANT:
  // This must exactly match the MP3 filename
  // in your GitHub project.
  const AUDIO_FILE =
    "Golden-Hour-chosic.com_.mp3";

  /* ==========================================================
     GET BUTTON
     ========================================================== */

  function getButton() {
    return document.getElementById("musicBtn");
  }

  /* ==========================================================
     UPDATE BUTTON
     ========================================================== */

  function updateButton() {
    const button = getButton();

    if (!button) return;

    if (playing) {
      button.textContent = "♫ Music ON";

      button.classList.add("active");

      button.setAttribute(
        "aria-pressed",
        "true"
      );

      button.title = "Stop focus music";
    } else {
      button.textContent = "♫ Music";

      button.classList.remove("active");

      button.setAttribute(
        "aria-pressed",
        "false"
      );

      button.title = "Play focus music";
    }
  }

  /* ==========================================================
     CREATE AUDIO PLAYER
     ========================================================== */

  function createAudio() {
    if (audio) {
      return audio;
    }

    audio = new Audio(AUDIO_FILE);

    // LOOP FOREVER
    audio.loop = true;

    // Quiet concentration background volume.
    audio.volume = 0.18;

    // Let the browser preload it.
    audio.preload = "auto";

    /* --------------------------------------------------------
       AUDIO EVENTS
       -------------------------------------------------------- */

    audio.addEventListener(
      "loadeddata",
      () => {
        ready = true;
        updateButton();
      }
    );

    audio.addEventListener(
      "canplaythrough",
      () => {
        ready = true;
        updateButton();
      }
    );

    audio.addEventListener(
      "play",
      () => {
        playing = true;
        updateButton();
      }
    );

    audio.addEventListener(
      "pause",
      () => {
        playing = false;
        updateButton();
      }
    );

    audio.addEventListener(
      "ended",
      () => {
        // loop=true should handle this,
        // but this is an extra safety fallback.
        if (playing) {
          audio.currentTime = 0;

          audio.play().catch(() => {});
        }
      }
    );

    audio.addEventListener(
      "error",
      () => {
        ready = false;
        playing = false;

        updateButton();

        const button = getButton();

        if (button) {
          button.title =
            "Music file could not be loaded.";
        }

        console.error(
          "CalcMAX music could not load:",
          AUDIO_FILE,
          audio.error
        );
      }
    );

    return audio;
  }

  /* ==========================================================
     START MUSIC
     ========================================================== */

  async function startMusic() {
    const player = createAudio();

    try {
      await player.play();

      playing = true;

      updateButton();

    } catch (error) {
      playing = false;

      updateButton();

      console.warn(
        "CalcMAX music needs a user interaction:",
        error
      );
    }
  }

  /* ==========================================================
     STOP MUSIC
     ========================================================== */

  function stopMusic() {
    if (!audio) {
      playing = false;
      updateButton();
      return;
    }

    audio.pause();

    // Restart from beginning next time.
    audio.currentTime = 0;

    playing = false;

    updateButton();
  }

  /* ==========================================================
     TOGGLE MUSIC
     ========================================================== */

  async function toggleMusic() {
    if (playing) {
      stopMusic();
    } else {
      await startMusic();
    }
  }

  /* ==========================================================
     SET VOLUME
     Example:
       CalcMaxFocusMusic.setVolume(0.1);
     ========================================================== */

  function setVolume(volume) {
    const player = createAudio();

    const value = Number(volume);

    if (!Number.isFinite(value)) {
      return;
    }

    player.volume = Math.max(
      0,
      Math.min(1, value)
    );
  }

  /* ==========================================================
     SETUP BUTTON
     ========================================================== */

  function setupButton() {
    const button = getButton();

    if (!button) {
      console.warn(
        "CalcMAX: #musicBtn was not found."
      );

      return;
    }

    // Prevent duplicate event listeners.
    if (
      button.dataset.musicReady === "true"
    ) {
      updateButton();
      return;
    }

    button.dataset.musicReady = "true";

    button.type = "button";

    button.addEventListener(
      "click",
      toggleMusic
    );

    // Create the audio player now.
    // It will NOT autoplay.
    createAudio();

    updateButton();
  }

  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.CalcMaxFocusMusic = {
    start: startMusic,

    stop: stopMusic,

    toggle: toggleMusic,

    setVolume,

    isPlaying: () => playing,

    isReady: () => ready
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
      setupButton
    );
  } else {
    setupButton();
  }

})();
