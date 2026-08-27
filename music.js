document.addEventListener("DOMContentLoaded", function () {

  const musicBtn = document.getElementById("musicBtn");
  const audio = document.getElementById("myAudio");

  if (!musicBtn) {
    console.error("CalcMAX: musicBtn not found.");
    return;
  }

  if (!audio) {
    console.error("CalcMAX: myAudio not found.");
    return;
  }

  // Make the music loop forever.
  audio.loop = true;

  // Background volume.
  audio.volume = 0.18;

  // Start OFF.
  musicBtn.textContent = "♫ Music:OFF";

  /*
  ==========================================================
  MUSIC BUTTON
  ==========================================================
  */

  musicBtn.addEventListener("click", function () {

    /*
    ----------------------------------------------------------
    FIRST CHANGE THE BUTTON TEXT
    ----------------------------------------------------------

    OFF -> ON
    ON  -> OFF
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
    NOW CHECK THE NEW TEXT
    ----------------------------------------------------------

    ON  -> PLAY
    OFF -> STOP
    */

    const currentText =
      musicBtn.textContent.trim();

    if (
      currentText ===
      "♫ Music:ON"
    ) {

      audio.play()
        .then(function () {

          musicBtn.textContent =
            "♫ Music:ON";

        })
        .catch(function (error) {

          console.error(
            "CalcMAX music playback failed:",
            error
          );

          musicBtn.textContent =
            "♫ Music:OFF";

        });

    } else if (
      currentText ===
      "♫ Music:OFF"
    ) {

      audio.pause();

      audio.currentTime = 0;

      musicBtn.textContent =
        "♫ Music:OFF";
    }

  });

  /*
  ==========================================================
  AUDIO ELEMENT EVENTS
  ==========================================================
  */

  audio.addEventListener("play", function () {

    musicBtn.textContent =
      "♫ Music:ON";

  });

  audio.addEventListener("pause", function () {

    musicBtn.textContent =
      "♫ Music:OFF";

  });

  audio.addEventListener("error", function () {

    console.error(
      "CalcMAX: Could not load Golden-Hour-chosic.com_.mp3",
      audio.error
    );

    musicBtn.textContent =
      "♫ Music:OFF";

  });

});
