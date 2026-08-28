"use strict";

/*
==========================================================
CALCMAX MUSIC ENGINE
==========================================================

The BUTTON is controlled by script.js.

This file ONLY controls the HTML audio element:

<audio
  id="myAudio"
  src="Golden-Hour-chosic.com_.mp3"
  preload="auto"
></audio>
==========================================================
*/

const calcMaxAudio =
  document.getElementById("myAudio");

if(!calcMaxAudio){

  console.error(
    "CalcMAX Music: #myAudio was not found."
  );

}else{

  calcMaxAudio.loop = true;
  calcMaxAudio.volume = 0.18;

}


/*
==========================================================
PLAY
==========================================================
*/

function playCalcMaxMusic(){

  if(!calcMaxAudio){
    return;
  }

  calcMaxAudio.play().catch(error=>{

    console.error(
      "CalcMAX Music playback failed:",
      error
    );

  });

}


/*
==========================================================
STOP
==========================================================
*/

function stopCalcMaxMusic(){

  if(!calcMaxAudio){
    return;
  }

  calcMaxAudio.pause();

  calcMaxAudio.currentTime = 0;

}


/*
==========================================================
PUBLIC API
==========================================================
*/

window.CalcMaxMusic = {

  play: playCalcMaxMusic,

  stop: stopCalcMaxMusic

};
