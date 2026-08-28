(() => {
  "use strict";

  function setupMusic() {
    const musicBtn = document.getElementById("musicBtn");
    const audio = document.getElementById("myAudio");

    if (!musicBtn) {
      console.error("CALCMAX MUSIC: #musicBtn not found.");
      return;
    }

    if (!audio) {
      console.error("CALCMAX MUSIC: #myAudio not found.");
      return;
    }

    // Make sure the HTML audio element loops.
    audio.loop = true;

    // Quiet background volume.
    audio.volume = 0.18;

    // Exact starting text.
    musicBtn.textContent = "♫ Music:OFF";

    /*
    ==========================================================
    CLICK LOGIC
    ==========================================================
    */

    musicBtn.onclick = async function (event) {

      event.preventDefault();
      event.stopPropagation();

      /*
      First change the button text.

      OFF -> ON
      ON  -> OFF
      */

      if (musicBtn.textContent.trim() === "♫ Music:OFF") {

        musicBtn.textContent = "♫ Music:ON";

      } else {

        musicBtn.textContent = "♫ Music:OFF";

      }

      /*
      ========================================================
      NOW CHECK THE NEW TEXT
      ========================================================
      */

      if (musicBtn.textContent.trim() === "♫ Music:ON") {

        try {

          await audio.play();

          // Keep the text ON after successful playback.
          musicBtn.textContent = "♫ Music:ON";

        } catch (error) {

          console.error(
            "CALCMAX MUSIC PLAY FAILED:",
            error
          );

          musicBtn.textContent = "♫ Music:OFF";

        }

      }

      else if (
        musicBtn.textContent.trim() === "♫ Music:OFF"
      ) {

        audio.pause();

        audio.currentTime = 0;

        musicBtn.textContent = "♫ Music:OFF";

      }
    };

    /*
    ==========================================================
    AUDIO EVENTS
    ==========================================================
    */

    audio.addEventListener("play", function () {
      musicBtn.textContent = "♫ Music:ON";
    });

    audio.addEventListener("pause", function () {
      /*
        Don't immediately overwrite the button during
        a user click that is stopping the music.
      */
      if (audio.currentTime === 0) {
        musicBtn.textContent = "♫ Music:OFF";
      }
    });

    audio.addEventListener("error", function () {

      console.error(
        "CALCMAX MUSIC FILE ERROR:",
        audio.currentSrc,
        audio.error
      );

      musicBtn.textContent = "♫ Music:OFF";
    });

    /*
    ==========================================================
    TEST THE FILE
    ==========================================================
    */

    console.log(
      "CALCMAX MUSIC READY:",
      audio.currentSrc || audio.src
    );
  }

  /*
  ==========================================================
  WAIT FOR THE HTML
  ==========================================================
  */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      setupMusic,
      { once: true }
    );

  } else {

    setupMusic();

  }

})();
