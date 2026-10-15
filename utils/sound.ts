let audioCtx: AudioContext | null = null;

export function playSpatialStepSound(
  direction: "up" | "down",
  levelIndex: number
) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const subOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Mechanical elevator / stair movement tone + shutter lock click
    const baseFreq = 95 + levelIndex * 20;
    const targetFreq = direction === "up" ? baseFreq * 1.4 : baseFreq * 0.75;

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.45);

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(52, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.5);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.5);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.52);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.55);
    subOsc.stop(now + 0.55);
  } catch {
    // Ignore audio errors if blocked by autoplay policy
  }
}
