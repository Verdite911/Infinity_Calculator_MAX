(() => {
  "use strict";

  /*
  ==========================================================
  CALCMAX MUSIC
  ==========================================================

  Button:
    #musicBtn

  Audio file:
    Golden-Hour-chosic.com_.mp3

  Button states:
    ♫ Music:OFF
    ♫ Music:ON

  Features:
    - Play / stop
    - Infinite looping
    - Background volume
    - Uses the existing CalcMAX button
    - No dependency on script.js
  ==========================================================
  */

  const MUSIC_FILE = "Golden-Hour-chosic.com_.mp3";
  const DEFAULT_VOLUME = 0.18;

  let audio = null;
  let button = null;

  /*
  ----------------------------------------------------------
  GET BUTTON
  ----------------------------------------------------------
  */

  function getButton() {
    if (!button) {
      button = document.getElementById("musicBtn");
    }

    return button;
  }

  /*
  ----------------------------------------------------------
  UPDATE BUTTON
  ----------------------------------------------------------
  */

  function updateButton() {
    const b = getButton();

    if (!b) {
      return;
    }

    const playing =
      audio &&
      !audio.paused &&
      !audio.ended;

    b.textContent = playing
      ? "♫ Music:ON"
      : "♫ Music:OFF";

    b.classList.toggle(
      "active",
      playing
    );

    b.setAttribute(
      "aria-pressed",
      playing ? "true" : "false"
    );
  }

  /*
  ----------------------------------------------------------
  CREATE AUDIO
  ----------------------------------------------------------
  */

  function createAudio() {
    if (audio) {
      return audio;
    }

    audio = new Audio(MUSIC_FILE);

    audio.loop = true;
    audio.preload = "auto";
    audio.volume = DEFAULT_VOLUME;

    /*
    Audio events keep the button synchronized with
    the real player state.
    */

    audio.addEventListener(
      "play",
      updateButton
    );

    audio.addEventListener(
      "playing",
      updateButton
    );

    audio.addEventListener(
      "pause",
      updateButton
    );

    audio.addEventListener(
      "error",
      () => {
        updateButton();

        console.error(
          "CalcMAX Music could not load:",
          MUSIC_FILE,
          audio.error
        );
      }
    );

    return audio;
  }

  /*
  ----------------------------------------------------------
  PLAY
  ----------------------------------------------------------
  */

  async function playMusic() {
    const player = createAudio();

    try {
      /*
      If the player is already playing,
      do nothing.
      */

      if (!player.paused) {
        updateButton();
        return;
      }

      await player.play();

      updateButton();

    } catch (error) {
      updateButton();

      console.warn(
        "CalcMAX Music could not start.",
        error
      );
    }
  }

  /*
  ----------------------------------------------------------
  STOP
  ----------------------------------------------------------
  */

  function stopMusic() {
    if (!audio) {
      updateButton();
      return;
    }

    audio.pause();

    /*
    Reset to the beginning so the next play starts
    from the beginning.
    */

    try {
      audio.currentTime = 0;
    } catch (error) {
      // Safe to ignore if the media isn't ready yet.
    }

    updateButton();
  }

  /*
  ----------------------------------------------------------
  TOGGLE
  ----------------------------------------------------------
  */

  async function toggleMusic() {
    const player = createAudio();

    if (player.paused) {
      await playMusic();
    } else {
      stopMusic();
    }
  }

  /*
  ----------------------------------------------------------
  VOLUME
  ----------------------------------------------------------
  */

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

  /*
  ----------------------------------------------------------
  BUTTON SETUP
  ----------------------------------------------------------
  */

  function setupMusicButton() {
    const b = getButton();

    if (!b) {
      console.error(
        "CalcMAX Music: #musicBtn was not found."
      );

      return;
    }

    /*
    Prevent this file from attaching the same handler
    multiple times.
    */

    if (
      b.dataset.musicReady === "true"
    ) {
      updateButton();
      return;
    }

    b.dataset.musicReady = "true";

    /*
    Initial state.
    */

    b.textContent = "♫ Music:OFF";

    b.classList.remove("active");

    b.setAttribute(
      "aria-pressed",
      "false"
    );

    /*
    One clean button handler.
    */

    b.addEventListener(
      "click",
      async (event) => {
        event.preventDefault();

        await toggleMusic();
      }
    );

    /*
    Create the player now so the browser can preload
    the music, but DON'T autoplay it.
    */

    createAudio();

    updateButton();
  }

  /*
  ----------------------------------------------------------
  PUBLIC API
  ----------------------------------------------------------
  */

  window.CalcMaxMusic = {
    play: playMusic,

    stop: stopMusic,

    toggle: toggleMusic,

    setVolume: setVolume,

    isPlaying: () => {
      return !!(
        audio &&
        !audio.paused &&
        !audio.ended
      );
    }
  };

  /*
  ----------------------------------------------------------
  STARTUP
  ----------------------------------------------------------
  */

  function init() {
    setupMusicButton();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();
