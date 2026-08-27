document.addEventListener("DOMContentLoaded", function () {

  const musicBtn =
    document.getElementById("musicBtn");

  const audio =
    document.getElementById("myAudio");

  if (!musicBtn) {
    console.error("CalcMAX: musicBtn not found.");
    return;
  }

  if (!audio) {
    console.error("CalcMAX: myAudio not found.");
    return;
  }

  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.18;

  /*
  ==========================================================
  INITIAL STATE
  ==========================================================
  */

  musicBtn.textContent = "♫ Music:OFF";

  /*
  ==========================================================
  CLICK
  ==========================================================
  */

  musicBtn.addEventListener("click", function () {

    /*
    First change the text.
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
    Then use the NEW text to decide what to do.
    */

    if (
      musicBtn.textContent.trim() ===
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

    }

    else if (
      musicBtn.textContent.trim() ===
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
  AUDIO EVENTS
  ==========================================================
  */

  audio.addEventListener(
    "play",
    function () {

      musicBtn.textContent =
        "♫ Music:ON";

    }
  );

  audio.addEventListener(
    "pause",
    function () {

      musicBtn.textContent =
        "♫ Music:OFF";

    }
  );

  /*
  ==========================================================
  AUDIO ERROR
  ==========================================================
  */

  audio.addEventListener(
    "error",
    function () {

      console.error(
        "CalcMAX could not load the music file.",
        audio.src,
        audio.error
      );

      musicBtn.textContent =
        "♫ Music:OFF";

    }
  );

});
