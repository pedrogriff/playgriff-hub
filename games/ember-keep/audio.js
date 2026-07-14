// ================================================================
// EMBER KEEP — Procedural Audio System
// ================================================================
// Uses Web Audio API to synthesize all sounds, no external files needed.

(function() {
  let audioCtx = null;
  let soundEnabled = true;

  function getCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { audioCtx = null; }
    }
    return audioCtx;
  }

  // Resume context on first user gesture (iOS/Chrome policy)
  document.addEventListener("click", () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume();
  }, { once: true });

  function playTone(opts) {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;

    const { freq = 440, type = "sine", duration = 0.15, volume = 0.25, delay = 0, pitchEnd = null } = opts;
    const now = ctx.currentTime + delay;

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (pitchEnd !== null) osc.frequency.exponentialRampToValueAtTime(pitchEnd, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(comp);
    comp.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  window.playSound = function(type) {
    switch(type) {
      case "button":
        playTone({ freq: 800, type: "sine", duration: 0.05, volume: 0.08 });
        break;
      case "hit":
        playTone({ freq: 200, type: "sawtooth", duration: 0.08, volume: 0.2 });
        playTone({ freq: 120, type: "square",   duration: 0.12, volume: 0.1, delay: 0.04 });
        break;
      case "critical":
        playTone({ freq: 320, type: "sawtooth", duration: 0.1,  volume: 0.3 });
        playTone({ freq: 500, type: "sine",     duration: 0.1,  volume: 0.2, delay: 0.05 });
        playTone({ freq: 650, type: "sine",     duration: 0.08, volume: 0.15, delay: 0.1 });
        break;
      case "enemy_hit":
        playTone({ freq: 150, type: "sawtooth", duration: 0.1, volume: 0.15 });
        break;
      case "victory":
        [0, 0.12, 0.24, 0.36].forEach((d, i) =>
          playTone({ freq: [523, 659, 784, 1047][i], type: "sine", duration: 0.2, volume: 0.25, delay: d })
        );
        break;
      case "defeat":
        [0, 0.18, 0.36].forEach((d, i) =>
          playTone({ freq: [350, 280, 200][i], type: "sine", duration: 0.3, volume: 0.2, delay: d })
        );
        break;
      case "level_up":
        [0, 0.1, 0.2, 0.3, 0.4].forEach((d, i) =>
          playTone({ freq: [523, 659, 784, 880, 1047][i], type: "sine", duration: 0.25, volume: 0.22, delay: d })
        );
        break;
      case "purchase":
        playTone({ freq: 880,  type: "sine", duration: 0.1, volume: 0.18 });
        playTone({ freq: 1047, type: "sine", duration: 0.12, volume: 0.15, delay: 0.08 });
        break;
      case "skill":
        playTone({ freq: 700, type: "triangle", duration: 0.08, volume: 0.2 });
        playTone({ freq: 900, type: "sine",     duration: 0.15, volume: 0.18, delay: 0.06 });
        break;
      case "loot":
        [0, 0.08, 0.16].forEach((d, i) =>
          playTone({ freq: [880, 1047, 1319][i], type: "sine", duration: 0.18, volume: 0.2, delay: d })
        );
        break;
    }
  };

  window.setSoundEnabled = function(enabled) {
    soundEnabled = !!enabled;
  };

})();
