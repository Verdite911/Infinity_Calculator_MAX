(() => {
  "use strict";

  /*
  ==========================================================
  CALCMAX MUSIC
  ==========================================================

  Button:
    #musicBtn

  Audio:
    Golden-Hour-chosic.com_.mp3

  Button states:
    ♫ Music:OFF
    ♫ Music:ON

  Features:
    - Play / stop
    - Infinite looping
    - Volume control
    - Works with the existing CalcMAX button
    - No dependency on script.js
  ==========================================================
  */

  const MUSIC_FILE = "Golden-Hour-chosic.com_.mp3";

  let audio = null;
  let isPlaying = false;

  /*
  ----------------------------------------------------------
  GET BUTTON
  ----------------------------------------------------------
  */

  function getButton() {
    return document.getElementById("musicBtn");
  }

  /*
  ----------------------------------------------------------
  UPDATE BUTTON
  ----------------------------------------------------------
  */

  function updateButton() {
    const button = getButton();

    if (!button) {
      return;
    }

    if (isPlaying) {
      button.textContent = "♫ Music:ON";
      button.classList.add("active");
    } else {
      button.textContent = "♫ Music:OFF";
      button.classList.remove("active");
    }
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

    /*
      Background concentration volume.
    */
    audio.volume = 0.18;

    audio.preload = "auto";

    /*
      AUDIO STARTED
    */
    audio.addEventListener("play", () => {

      isPlaying = true;

      updateButton();

    });

    /*
      AUDIO STOPPED
    */
    audio.addEventListener("pause", () => {

      isPlaying = false;

      updateButton();

    });

    /*
      AUDIO ERROR
    */
    audio.addEventListener("error", () => {

      isPlaying = false;

      updateButton();

      console.error(
        "CalcMAX Music Error:",
        MUSIC_FILE,
        audio.error
      );

    });

    /*
      Extra loop protection.
    */
    audio.addEventListener("ended", () => {

      if (!isPlaying) {
        return;
      }

      audio.currentTime = 0;

      audio.play().catch(() => {});

    });

    return audio;
  }

  /*
  ----------------------------------------------------------
  PLAY MUSIC
  ----------------------------------------------------------
  */

  async function playMusic() {

    const player = createAudio();

    try {

      await player.play();

      isPlaying = true;

      updateButton();

    } catch (error) {

      console.warn(
        "CalcMAX Music could not start.",
        error
      );

    }
  }

  /*
  ----------------------------------------------------------
  STOP MUSIC
  ----------------------------------------------------------
  */

  function stopMusic() {

    if (!audio) {
      return;
    }

    audio.pause();

    /*
      Reset position so the next play starts
      from the beginning.
    */
    audio.currentTime = 0;

    isPlaying = false;

    updateButton();
  }

  /*
  ----------------------------------------------------------
  TOGGLE MUSIC
  ----------------------------------------------------------
  */

  async function toggleMusic() {

    if (isPlaying) {

      stopMusic();

    } else {

      await playMusic();

    }
  }

  /*
  ----------------------------------------------------------
  SETUP BUTTON
  ----------------------------------------------------------
  */

  function setupMusicButton() {

    const button = getButton();

    if (!button) {

      console.error(
        "CalcMAX Music: #musicBtn not found."
      );

      return;

    }

    /*
      Prevent duplicate handlers if the script
      somehow gets loaded more than once.
    */
    if (button.dataset.musicReady === "true") {
      return;
    }

    button.dataset.musicReady = "true";

    /*
      Make sure the starting state is correct.
    */
    isPlaying = false;

    button.textContent = "♫ Music:OFF";

    button.classList.remove("active");

    /*
      THE BUTTON CLICK
    */
    button.addEventListener(
      "click",
      toggleMusic
    );

    /*
      Prepare audio without playing it.
    */
    createAudio();

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

    isPlaying: () => isPlaying,

    setVolume: (volume) => {

      const player = createAudio();

      let value = Number(volume);

      if (!Number.isFinite(value)) {
        return;
      }

      value = Math.max(
        0,
        Math.min(1, value)
      );

      player.volume = value;

    }

  };

  /*
  ----------------------------------------------------------
  START
  ----------------------------------------------------------
  */

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
