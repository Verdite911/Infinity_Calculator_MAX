/* ==========================================================
   CalcMAX Relaxing Concentration Music
   Web Audio API — no external audio files required.
   ========================================================== */

(() => {
  "use strict";

  if (window.CalcMaxFocusMusic) return;

  let audioContext = null;
  let master = null;
  let running = false;
  let timer = null;
  let chordIndex = 0;

  // Gentle concentration-friendly chord progression
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 392.00]  // G6
  ];

  function setupAudio() {
    if (audioContext) return;

    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    master = audioContext.createGain();
    master.gain.value = 0.055;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1600;
    filter.Q.value = 0.35;

    master.connect(filter);
    filter.connect(audioContext.destination);
  }

  function playTone(
    frequency,
    startTime,
    duration,
    volume,
    type = "sine"
  ) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, startTime);

    gain.gain.exponentialRampToValueAtTime(
      volume,
      startTime + 0.8
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(master);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.1);
  }

  function playChord() {
    if (!audioContext || !running) return;

    const now = audioContext.currentTime;
    const chord = chords[chordIndex % chords.length];

    chordIndex++;

    // Main soft chord
    chord.forEach((frequency, index) => {
      playTone(
        frequency,
        now + index * 0.11,
        5.8,
        0.035,
        "sine"
      );
    });

    // Very quiet high harmonic
    playTone(
      chord[2] * 2,
      now + 1.2,
      3.2,
      0.008,
      "triangle"
    );

    timer = setTimeout(playChord, 4200);
  }

  async function start() {
    setupAudio();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    running = true;
    playChord();
    updateButton();
  }

  async function stop() {
    running = false;

    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    updateButton();
  }

  async function toggle() {
    if (running) {
      await stop();
    } else {
      await start();
    }
  }

  function updateButton() {
    const button = document.getElementById("musicToggle");

    if (!button) return;

    button.textContent = running
      ? "♫ Focus Music: ON"
      : "♫ Focus Music: OFF";

    button.classList.toggle("active", running);
  }

  // Public API
  window.CalcMaxFocusMusic = {
    start,
    stop,
    toggle,
    isPlaying: () => running
  };

  // Automatically connect the button if it exists.
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("musicToggle");

    if (button) {
      button.addEventListener("click", toggle);
      updateButton();
    }
  });

})();
