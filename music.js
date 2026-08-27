(() => {
  "use strict";

  let musicAudio = null;
  let musicPlaying = false;

  const MUSIC_FILE = "Golden-Hour-chosic.com_.mp3";

  function getMusicButton() {
    return document.getElementById("musicBtn");
  }

  function updateMusicButton() {
    const button = getMusicButton();

    if (!button) return;

    button.textContent = musicPlaying
      ? "♫ Music:ON"
      : "♫ Music:OFF";
  }

  function createMusic() {
    if (musicAudio) return musicAudio;

    musicAudio = new Audio(MUSIC_FILE);

    musicAudio.loop = true;
    musicAudio.volume = 0.18;
    musicAudio.preload = "auto";

    musicAudio.addEventListener("play", () => {
      musicPlaying = true;
      updateMusicButton();
    });

    musicAudio.addEventListener("pause", () => {
      musicPlaying = false;
      updateMusicButton();
    });

    musicAudio.addEventListener("error", () => {
      musicPlaying = false;
      updateMusicButton();

      console.error(
        "CalcMAX could not load:",
        MUSIC_FILE
      );
    });

    return musicAudio;
  }

  async function toggleMusic() {
    const audio = createMusic();

    if (audio.paused) {
      try {
        await audio.play();

        musicPlaying = true;
        updateMusicButton();

      } catch (error) {
        console.error(
          "CalcMAX music could not start:",
          error
        );
      }

    } else {
      audio.pause();
      audio.currentTime = 0;

      musicPlaying = false;
      updateMusicButton();
    }
  }

  function setupMusicButton() {
    const button = getMusicButton();

    if (!button) {
      console.error(
        "CalcMAX: musicBtn was not found."
      );
      return;
    }

    /*
      Remove anything previously attached by this script.
      Then attach one clean click handler.
    */
    button.onclick = null;

    button.addEventListener(
      "click",
      toggleMusic
    );

    button.textContent = "♫ Music:OFF";

    createMusic();
  }

  /*
    Wait until the HTML button definitely exists.
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

  /*
    Optional global controls.
  */
  window.CalcMaxFocusMusic = {
    start: async () => {
      const audio = createMusic();

      try {
        await audio.play();
        musicPlaying = true;
        updateMusicButton();
      } catch (error) {
        console.error(
          "CalcMAX music could not start:",
          error
        );
      }
    },

    stop: () => {
      if (!musicAudio) return;

      musicAudio.pause();
      musicAudio.currentTime = 0;

      musicPlaying = false;
      updateMusicButton();
    },

    toggle: toggleMusic,

    isPlaying: () => musicPlaying
  };

})();
