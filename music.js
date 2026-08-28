document.addEventListener("DOMContentLoaded", function () {

  const musicBtn =
    document.getElementById("musicBtn");

  const audio =
    document.getElementById("myAudio");

  if (!musicBtn) {
    console.error("CALCMAX MUSIC: musicBtn not found.");
    return;
  }

  if (!audio) {
    console.error("CALCMAX MUSIC: myAudio not found.");
    return;
  }

  audio.loop = true;
  audio.volume = 0.18;

  musicBtn.textContent = "♫ Music:OFF";

  musicBtn.addEventListener("click", function () {

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
            "CALCMAX MUSIC PLAY FAILED:",
            error
          );

          musicBtn.textContent =
            "♫ Music:OFF";
        });

    } else if (
      musicBtn.textContent.trim() ===
      "♫ Music:OFF"
    ) {

      audio.pause();
      audio.currentTime = 0;

    }

  });

});
