import { useEffect, useRef, useCallback } from 'react';

export function useResonator() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  const windFilterRef = useRef<BiquadFilterNode | null>(null);
  const windGainRef = useRef<GainNode | null>(null);
  
  const chordGainRef = useRef<GainNode | null>(null);
  const shimmerGainRef = useRef<GainNode | null>(null);
  
  const sourcesRef = useRef<(OscillatorNode | AudioBufferSourceNode)[]>([]);
  
  const hapticTimerRef = useRef<number | null>(null);
  const lastHapticTimeRef = useRef<number>(0);
  const isResonatingRef = useRef<boolean>(false);
  const isTouchingRef = useRef<boolean>(false);

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master Gain for overall volume and fade in/out
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // --- 1. Magical Wind (Singing Resonance) ---
    // Creates a "whoosh" or "singing bowl" effect common in Genshin/FF magic
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.Q.value = 15; // Highly resonant, tonal wind
    windFilter.frequency.value = 400;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.02;

    noiseSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(masterGain);
    noiseSrc.start();
    
    windFilterRef.current = windFilter;
    windGainRef.current = windGain;

    // --- 2. Fantasy Crystal Chord (Dmaj9#11) ---
    // Lush, dreamy chord used in save rooms and magical auras
    const chordGain = ctx.createGain();
    chordGain.gain.value = 0;
    chordGain.connect(masterGain);
    chordGainRef.current = chordGain;

    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0;
    
    // Tremolo effect for the shimmer (high notes)
    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5; // 5Hz flutter
    lfo.connect(tremoloGain.gain);
    lfo.start();
    
    shimmerGain.connect(tremoloGain);
    tremoloGain.connect(masterGain);
    shimmerGainRef.current = shimmerGain;

    // D3, A3, E4, F#4, C#5, G#5
    const freqs = [146.83, 220.00, 329.63, 369.99, 554.37, 830.61];
    const types: OscillatorType[] = ['triangle', 'sine', 'sine', 'sine', 'sine', 'sine'];
    const volumes = [0.4, 0.3, 0.2, 0.15, 0.1, 0.08];

    const oscs: OscillatorNode[] = [];

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = types[index];
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = volumes[index];
      
      // Top two notes go to shimmer gain for tremolo effect
      if (index >= 4) {
        osc.connect(oscGain);
        oscGain.connect(shimmerGain);
      } else {
        osc.connect(oscGain);
        oscGain.connect(chordGain);
      }
      
      osc.start();
      oscs.push(osc);
    });

    sourcesRef.current = [noiseSrc, lfo, ...oscs];
  }, []);

  const updateResonance = useCallback((distance: number, speed: number, isTouching: boolean) => {
    if (!audioCtxRef.current || !masterGainRef.current || !windFilterRef.current || !windGainRef.current || !chordGainRef.current || !shimmerGainRef.current) return;
    
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (!isTouching) {
      if (isTouchingRef.current) {
        // Smooth, long fade out for premium feel
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
        masterGainRef.current.gain.linearRampToValueAtTime(0, now + 1.5);
        isTouchingRef.current = false;
        
        // Clear haptics
        if (hapticTimerRef.current) {
          window.clearInterval(hapticTimerRef.current);
          hapticTimerRef.current = null;
        }
        isResonatingRef.current = false;
      }
      return;
    }

    if (!isTouchingRef.current) {
      // Smooth fade in
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(1.0, now + 1.0);
      isTouchingRef.current = true;
    }

    const isResonating = distance <= 0.1;

    // --- Dynamic Audio Mapping ---
    
    // 1. Magical Wind: Sweeps up in frequency as you get closer or move faster
    const windFreq = 300 + Math.pow(1 - distance, 2) * 1000 + speed * 2000;
    windFilterRef.current.frequency.setTargetAtTime(windFreq, now, 0.2);
    
    // Wind gets louder with speed, but maintains a base level
    const windVol = 0.02 + Math.min(speed * 0.15, 0.15);
    windGainRef.current.gain.setTargetAtTime(windVol, now, 0.2);

    // 2. Crystal Chord: Fades in exponentially as you get closer
    const chordVol = Math.pow(1 - distance, 3) * 0.8;
    chordGainRef.current.gain.setTargetAtTime(chordVol, now, 0.3);

    // 3. Shimmer: Only activates when very close (Resonance aura)
    const shimmerVol = distance < 0.15 ? 0.6 : 0;
    shimmerGainRef.current.gain.setTargetAtTime(shimmerVol, now, 0.5);

    // --- Haptics ---
    if (isResonating) {
      if (!isResonatingRef.current) {
        isResonatingRef.current = true;
        if (hapticTimerRef.current) {
          window.clearInterval(hapticTimerRef.current);
        }
        // Gentle, premium heartbeat
        if (navigator.vibrate) {
          navigator.vibrate([20, 60, 20]);
          hapticTimerRef.current = window.setInterval(() => {
            if (isResonatingRef.current) {
              navigator.vibrate([20, 60, 20]);
            }
          }, 1500); // Slower, calmer heartbeat
        }
      }
    } else {
      if (isResonatingRef.current) {
        isResonatingRef.current = false;
        if (hapticTimerRef.current) {
          window.clearInterval(hapticTimerRef.current);
          hapticTimerRef.current = null;
        }
      }

      // Very subtle haptics when moving (like tracing glass)
      const timeSinceLastHaptic = performance.now() - lastHapticTimeRef.current;
      const normalizedSpeed = Math.min(Math.max(speed, 0), 1);
      const throttleTime = 800 - (normalizedSpeed * 500); 
      
      if (timeSinceLastHaptic > throttleTime && speed > 0.05) {
        if (navigator.vibrate) {
          navigator.vibrate(4); // Just a tiny tick
        }
        lastHapticTimeRef.current = performance.now();
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    if (hapticTimerRef.current) {
      window.clearInterval(hapticTimerRef.current);
    }
    if (audioCtxRef.current?.state !== 'closed') {
      sourcesRef.current.forEach(src => {
        try { src.stop(); } catch (e) {}
      });
      audioCtxRef.current?.close();
    }
  }, []);

  return { initAudio, updateResonance, cleanup };
}
