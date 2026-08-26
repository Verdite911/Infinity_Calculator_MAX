(() => {
  const button = document.getElementById("musicBtn");

  if (!button) {
    console.error("musicBtn not found");
    return;
  }

  const audio = new Audio("Golden-Hour-chosic.com_.mp3");

  audio.loop = true;
  audio.volume = 0.18;

  button.textContent = "♫ Music:OFF";

  button.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();

        button.textContent = "♫ Music:ON";
        button.classList.add("active");
      } else {
        audio.pause();
        audio.currentTime = 0;

        button.textContent = "♫ Music:OFF";
        button.classList.remove("active");
      }
    } catch (error) {
      console.error("Music could not start:", error);
    }
  });

})();
