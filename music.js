document.addEventListener("DOMContentLoaded", function () {

  const button = document.getElementById("musicBtn");
  const audio = document.getElementById("myAudio");

  if (!button || !audio) {
    console.error("Music setup failed.");
    return;
  }

  audio.loop = true;
  audio.volume = 0.18;

  button.textContent = "♫ Music:OFF";

  button.addEventListener("click", function () {

    if (button.textContent.trim() === "♫ Music:OFF") {

      button.textContent = "♫ Music:ON";

    } else {

      button.textContent = "♫ Music:OFF";

    }

    if (button.textContent.trim() === "♫ Music:ON") {

      audio.play().catch(function (error) {
        console.error("Music playback failed:", error);
        button.textContent = "♫ Music:OFF";
      });

    } else if (button.textContent.trim() === "♫ Music:OFF") {

      audio.pause();
      audio.currentTime = 0;

    }

  });

});
