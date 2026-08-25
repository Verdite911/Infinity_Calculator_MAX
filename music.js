/* ==========================================================
   CalcMAX Focus Music
   Uses: focus-music.mp3

   Music button:
   <button class="icon-btn" id="musicBtn" type="button">
     ♫ Music
   </button>

   The track loops continuously while enabled.
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxFocusMusic) return;

  let audio = null;
  let running = false;

  function createAudio() {
    if (audio) return audio;

    audio = new Audio("focus-music.mp3");

    // LOOP FOREVER
    audio.loop = true;

    // Keep it as quiet background music.
    audio.volume = 0.18;

    // Don't preload the whole track until needed.
    audio.preload = "auto";

    audio.addEventListener("play", () => {
      running = true;
      updateButton();
    });

    audio.addEventListener("pause", () => {
      running = false;
      updateButton();
    });

    audio.addEventListener("ended", () => {
      // Extra safety even though loop=true.
      if (running) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    });

    return audio;
  }

  async function startMusic() {
    const player = createAudio();

    try {
      await player.play();

      running = true;
      updateButton();
    } catch (error) {
      console.warn(
        "CalcMAX music needs user interaction:",
        error
      );

      running = false;
      updateButton();
    }
  }

  function stopMusic() {
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    running = false;
    updateButton();
  }

  async function toggleMusic() {
    if (running) {
      stopMusic();
    } else {
      await startMusic();
    }
  }

  function updateButton() {
    const button =
      document.getElementById("musicBtn");

    if (!button) return;

    if (running) {
      button.textContent = "♫ Music ON";
      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
    } else {
      button.textContent = "♫ Music";
      button.classList.remove("active");
      button.setAttribute("aria-pressed", "false");
    }
  }

  function setupButton() {
    const button =
      document.getElementById("musicBtn");

    if (!button) return;

    button.addEventListener(
      "click",
      toggleMusic
    );

    updateButton();
  }

  window.CalcMaxFocusMusic = {
    start: startMusic,
    stop: stopMusic,
    toggle: toggleMusic,
    isPlaying: () => running
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      setupButton
    );
  } else {
    setupButton();
  }

})();
