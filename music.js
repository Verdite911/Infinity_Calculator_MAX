(() => {
  "use strict";
const MUSIC_FILE = "./Golden-Hour-chosic.com_.mp3";

  let clickCount = 0;
  let audio = null;

  function getButton() {
    return document.getElementById("musicBtn");
  }

  function setupAudio() {
    if (audio) return;

    audio = new Audio(MUSIC_FILE);
    audio.loop = true;
    audio.volume = 0.18;
    audio.preload = "auto";
  }

  async function updateMusic() {
    const button = getButton();

    if (!button) return;

    /*
      The BUTTON TEXT is the state.
    */

    if (button.textContent === "♫ Music:ON") {

      setupAudio();

      try {
        await audio.play();
      } catch (error) {
        console.warn(
          "CalcMAX music could not start:",
          error
        );
      }

    } else if (
      button.textContent === "♫ Music:OFF"
    ) {

      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }

  function setupButton() {
    const button = getButton();

    if (!button) {
      console.error(
        "CalcMAX: musicBtn not found."
      );
      return;
    }

    /*
      Start OFF.
    */

    button.textContent = "♫ Music:OFF";

    /*
      Every click increases the counter.
    */

    button.addEventListener("click", async () => {

      clickCount++;

      /*
        ODD = ON
        EVEN = OFF
      */

      if (clickCount % 2 === 1) {

        button.textContent = "♫ Music:ON";

      } else {

        button.textContent = "♫ Music:OFF";

      }

      /*
        The TEXT now decides what happens.
      */

      await updateMusic();
    });

    setupAudio();
  }

  /*
    Wait for the button to exist.
  */

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      setupButton,
      { once: true }
    );

  } else {

    setupButton();

  }

})();
