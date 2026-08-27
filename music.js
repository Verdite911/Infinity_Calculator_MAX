document.addEventListener("DOMContentLoaded", function () {

  const musicBtn = document.getElementById("musicBtn");
  const audio = document.getElementById("myAudio");

  if (!musicBtn) {
    console.error("CALCMAX MUSIC: musicBtn not found.");
    return;
  }

  if (!audio) {
    console.error("CALCMAX MUSIC: myAudio not found.");
    return;
  }

  // Loop forever
  audio.loop = true;

  // Background volume
  audio.volume = 0.18;

  // Starting state
  musicBtn.textContent = "♫ Music:OFF";

  /*
  ==========================================================
  CLICK LOGIC
  ==========================================================
  */

  musicBtn.addEventListener("click", function (event) {

    event.preventDefault();
    event.stopPropagation();

    /*
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
    ========================================================
    USE THE NEW BUTTON TEXT
    ========================================================
    */

    if (
      musicBtn.textContent.trim() ===
      "♫ Music:ON"
    ) {

      console.log("CALCMAX MUSIC: PLAY");

      audio.play()
        .then(function () {

          musicBtn.textContent =
            "♫ Music:ON";

        })
        .catch(function (error) {

          console.error(
            "CALCMAX MUSIC PLAY ERROR:",
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

      console.log("CALCMAX MUSIC: STOP");

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

  audio.addEventListener("play", function () {

    musicBtn.textContent =
      "♫ Music:ON";

  });

  audio.addEventListener("pause", function () {

    musicBtn.textContent =
      "♫ Music:OFF";

  });

  /*
  ==========================================================
  AUDIO ERROR
  ==========================================================
  */

  audio.addEventListener("error", function () {

    console.error(
      "CALCMAX MUSIC FILE ERROR:",
      audio.src,
      audio.error
    );

  });

});
