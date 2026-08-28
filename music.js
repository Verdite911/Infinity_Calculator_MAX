"use strict";

/*
==========================================================
CALCMAX MUSIC ENGINE
==========================================================

HTML audio element:

<audio
  id="myAudio"
  src="Golden-Hour-chosic.com_.mp3"
  preload="auto"
></audio>

This file ONLY controls the audio.

The Music button is controlled by script.js.
==========================================================
*/

const calcMaxAudio =
  document.getElementById("myAudio");

if (!calcMaxAudio) {

  console.error(
    "CalcMAX Music: #myAudio was not found."
  );

} else {

  // Loop forever.
  calcMaxAudio.loop = true;

  // Quiet concentration volume.
  calcMaxAudio.volume = 0.18;

}


/*
==========================================================
PLAY MUSIC
==========================================================
*/

function playCalcMaxMusic() {

  if (!calcMaxAudio) {
    return;
  }

  calcMaxAudio.play().catch(function (error) {

    console.error(
      "CalcMAX Music playback failed:",
      error
    );

  });

}


/*
==========================================================
STOP MUSIC
==========================================================
*/

function stopCalcMaxMusic() {

  if (!calcMaxAudio) {
    return;
  }

  calcMaxAudio.pause();

  calcMaxAudio.currentTime = 0;

}


/*
==========================================================
OPTIONAL VOLUME
==========================================================
*/

function setCalcMaxMusicVolume(volume) {

  if (!calcMaxAudio) {
    return;
  }

  const value = Number(volume);

  if (!Number.isFinite(value)) {
    return;
  }

  calcMaxAudio.volume =
    Math.max(
      0,
      Math.min(1, value)
    );

}


/*
==========================================================
PUBLIC CONTROL
==========================================================
*/

window.CalcMaxMusic = {

  play: playCalcMaxMusic,

  stop: stopCalcMaxMusic,

  setVolume: setCalcMaxMusicVolume

};
