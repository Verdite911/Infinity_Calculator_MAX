"use strict";

const musicBtn = document.getElementById("musicBtn");
const audio = document.getElementById("myAudio");

if (musicBtn && audio) {

  audio.loop = true;
  audio.volume = 0.18;

  musicBtn.textContent = "♫ Music:OFF";

  musicBtn.onclick = function (event) {

    event.preventDefault();

    /*
      Change button text first.
    */

    if (musicBtn.textContent === "♫ Music:OFF") {

      musicBtn.textContent = "♫ Music:ON";

    } else {

      musicBtn.textContent = "♫ Music:OFF";

    }

    /*
      Button text decides what happens.
    */

    if (musicBtn.textContent === "♫ Music:ON") {

      audio.play().catch(function (error) {

        console.error(
          "Music playback failed:",
          error
        );

        musicBtn.textContent =
          "♫ Music:OFF";

      });

    }

    if (musicBtn.textContent === "♫ Music:OFF") {

      audio.pause();
      audio.currentTime = 0;

    }

  };

} else {

  console.error(
    "CalcMAX Music: musicBtn or myAudio not found."
  );

}
