(() => {
  const AUDIO_FILE = "Golden-Hour-chosic.com_.mp3";

  let musicAudio = null;
  let musicOn = false;

  function startMusic() {
    if (!musicAudio) {
      musicAudio = new Audio(AUDIO_FILE);

      musicAudio.loop = true;
      musicAudio.volume = 0.18;
    }

    musicAudio.play().then(() => {
      musicOn = true;

      const b = document.getElementById("musicBtn");
      if (b) {
        b.textContent = "♫ Music:ON";
        b.classList.add("active");
      }
    }).catch(error => {
      console.warn("Music could not start:", error);
    });
  }

  function stopMusic() {
    if (!musicAudio) return;

    musicAudio.pause();
    musicAudio.currentTime = 0;

    musicOn = false;

    const b = document.getElementById("musicBtn");

    if (b) {
      b.textContent = "♫ Music:OFF";
      b.classList.remove("active");
    }
  }

  function toggleMusic() {
    if (musicOn) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  /*
    Use the SAME button pattern as script.js.
  */
  function setupMusicButton() {
    if (typeof bindButton === "function") {
      bindButton("musicBtn", () => {
        toggleMusic();
      });
    } else {
      const b = document.getElementById("musicBtn");

      if (!b) return;

      b.onclick = null;

      b.addEventListener("click", function(e) {
        e.preventDefault();
        toggleMusic();
      });
    }

    const b = document.getElementById("musicBtn");

    if (b) {
      b.textContent = "♫ Music:OFF";
    }
  }

  window.CalcMaxFocusMusic = {
    start: startMusic,
    stop: stopMusic,
    toggle: toggleMusic,
    isPlaying: () => musicOn
  };

  /*
    Wait for the existing CalcMAX DOM.
  */
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      setupMusicButton
    );
  } else {
    setupMusicButton();
  }

})();
