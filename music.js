(() => {
  const AUDIO_FILE = "Golden-Hour-chosic.com_.mp3";

  let musicAudio = null;
  let musicPlaying = false;

  function setupMusic() {
    if (musicAudio) return musicAudio;

    musicAudio = new Audio(AUDIO_FILE);
    musicAudio.loop = true;
    musicAudio.volume = 0.18;
    musicAudio.preload = "auto";

    musicAudio.addEventListener("play", () => {
      musicPlaying = true;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:ON";
        b.classList.add("active");
      }
    });

    musicAudio.addEventListener("pause", () => {
      musicPlaying = false;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:OFF";
        b.classList.remove("active");
      }
    });

    musicAudio.addEventListener("error", () => {
      musicPlaying = false;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:OFF";
        b.classList.remove("active");
      }

      console.error(
        "CalcMAX music file could not be loaded:",
        AUDIO_FILE
      );
    });

    return musicAudio;
  }

  async function toggleMusic() {
    const audio = setupMusic();

    if (audio.paused) {
      try {
        await audio.play();

        musicPlaying = true;

        const b = document.getElementById("musicBtn");
        if (b) {
          b.textContent = "♫ Music:ON";
          b.classList.add("active");
        }

      } catch (error) {
        console.warn(
          "CalcMAX music playback was blocked:",
          error
        );
      }

    } else {
      audio.pause();
      audio.currentTime = 0;

      musicPlaying = false;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:OFF";
        b.classList.remove("active");
      }
    }
  }

  window.CalcMaxFocusMusic = {
    toggle: toggleMusic,
    start: async () => {
      const audio = setupMusic();
      try {
        await audio.play();
      } catch (error) {
        console.warn(
          "CalcMAX music playback was blocked:",
          error
        );
      }
    },
    stop: () => {
      if (!musicAudio) return;

      musicAudio.pause();
      musicAudio.currentTime = 0;
      musicPlaying = false;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:OFF";
        b.classList.remove("active");
      }
    },
    isPlaying: () => musicPlaying
  };

  /*
    This follows CalcMAX's existing button pattern:

      bindButton("exactBtn",()=>{ ... });

    So musicBtn is handled the same way as the other
    top-bar buttons.
  */

  if (typeof window.bindButton === "function") {
    bindButton("musicBtn", toggleMusic);
  } else {
    // Fallback in case music.js loads before script.js.
    document.addEventListener("DOMContentLoaded", () => {
      if (typeof window.bindButton === "function") {
        bindButton("musicBtn", toggleMusic);
      } else {
        const b = document.getElementById("musicBtn");

        if (b) {
          b.onclick = toggleMusic;
        }
      }
    });
  }

  // Make sure the initial text matches the requested pattern.
  document.addEventListener("DOMContentLoaded", () => {
    const b = document.getElementById("musicBtn");

    if (b && !musicPlaying) {
      b.textContent = "♫ Music:OFF";
      b.classList.remove("active");
    }

    setupMusic();
  });

})();
