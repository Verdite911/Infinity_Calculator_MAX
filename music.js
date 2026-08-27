document.addEventListener("DOMContentLoaded", function () {

  const audio =
    document.getElementById("myAudio");

  const musicBtn =
    document.getElementById("musicBtn");

  if (!audio) {
    console.error(
      "CalcMAX: myAudio was not found."
    );
    return;
  }

  if (!musicBtn) {
    console.error(
      "CalcMAX: musicBtn was not found."
    );
    return;
  }

  // Loop forever.
  audio.loop = true;

  // Quiet background volume.
  audio.volume = 0.18;

  // Starting state.
  musicBtn.textContent =
    "♫ Music:OFF";

  /*
  ----------------------------------------------------------
  MUSIC BUTTON
  ----------------------------------------------------------
  */

  musicBtn.addEventListener(
    "click",
    function () {

      if (
        musicBtn.textContent ===
        "♫ Music:OFF"
      ) {

        try {

          const playPromise =
            audio.play();

          if (
            playPromise !== undefined
          ) {

            playPromise
              .then(function () {

                musicBtn.textContent =
                  "♫ Music:ON";

              })
              .catch(function (error) {

                console.error(
                  "Playback failed:",
                  error
                );

              });

          }

        } catch (error) {

          console.error(
            "Error starting audio:",
            error
          );

        }

      } else {

        try {

          audio.pause();

          audio.currentTime = 0;

          musicBtn.textContent =
            "♫ Music:OFF";

        } catch (error) {

          console.error(
            "Error stopping audio:",
            error
          );

        }

      }

    }
  );

  /*
  ----------------------------------------------------------
  KEEP BUTTON IN SYNC WITH AUDIO
  ----------------------------------------------------------
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
  ----------------------------------------------------------
  AUDIO ERROR
  ----------------------------------------------------------
  */

  audio.addEventListener(
    "error",
    function () {

      console.error(
        "CalcMAX could not load:",
        "Golden-Hour-chosic.com_.mp3",
        audio.error
      );

    }
  );

});
