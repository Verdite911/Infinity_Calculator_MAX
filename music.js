document.addEventListener("DOMContentLoaded", function () {

  const audio = document.getElementById("myAudio");
  const musicBtn = document.getElementById("musicBtn");

  if (!audio) {
    console.error("CalcMAX: myAudio not found.");
    return;
  }

  if (!musicBtn) {
    console.error("CalcMAX: musicBtn not found.");
    return;
  }

  // Music settings
  audio.loop = true;
  audio.volume = 0.18;

  // Starting state
  musicBtn.textContent = "♫ Music:OFF";

  musicBtn.addEventListener("click", async function () {

    /*
    ----------------------------------------------------------
    CHANGE THE BUTTON STATE
    ----------------------------------------------------------
    */

    if (
      musicBtn.textContent.trim() ===
      "♫ Music:OFF"
    ) {

      musicBtn.textContent =
        "♫ Music:ON";

    } else {

      musicBtn.textContent =
        "♫ Music:OFF";

    }

    /*
    ----------------------------------------------------------
    MUSIC LOGIC
    ----------------------------------------------------------

    ON  = PLAY
    OFF = STOP
    */

    const currentText =
      musicBtn.textContent.trim();

    if (
      currentText ===
      "♫ Music:ON"
    ) {

      try {

        await audio.play();

      } catch (error) {

        console.error(
          "CalcMAX music playback failed:",
          error
        );

        // If playback fails, return button to OFF.
        musicBtn.textContent =
          "♫ Music:OFF";
      }

    } else if (
      currentText ===
      "♫ Music:OFF"
    ) {

      audio.pause();
      audio.currentTime = 0;

    }

  });

  /*
  ----------------------------------------------------------
  KEEP BUTTON SYNCHRONIZED
  ----------------------------------------------------------
  */

  audio.addEventListener("play", function () {

    musicBtn.textContent =
      "♫ Music:ON";

  });

  audio.addEventListener("pause", function () {

    musicBtn.textContent =
      "♫ Music:OFF";

  });

  /*
  ----------------------------------------------------------
  AUDIO ERROR
  ----------------------------------------------------------
  */

  audio.addEventListener("error", function () {

    console.error(
      "CalcMAX could not load the music file:",
      audio.src,
      audio.error
    );

    musicBtn.textContent =
      "♫ Music:OFF";

  });

});
