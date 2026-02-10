import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Pause, Play, RotateCcw, Snowflake, Sparkles, Trash2 } from 'lucide-react';

const MAX_PULSES = 42;
const STEPS = 16;
const DEFAULT_MODE = 'ambient';

const SCALE_MAP = {
  dorian: ['C3', 'D3', 'Eb3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'F4', 'A4'],
  pentatonic: ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'Eb4', 'G4', 'Bb4'],
  luminous: ['C3', 'D3', 'E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4'],
};

const MODE_PRESETS = {
  ambient: {
    label: 'Ambient Bloom',
    interval: '8n',
    defaults: {
      tempo: 92,
      complexity: 0.46,
      space: 0.74,
      chaos: 0.22,
      scale: 'luminous',
    },
    densityBias: -0.12,
    drift: 0.0012,
    durationStrong: '4n',
    durationWeak: '8n',
    filterBase: 740,
    palette: {
      hueA: 178,
      hueB: 24,
      hueC: 202,
      sweepAlpha: 0.12,
    },
    synth: {
      oscillator: 'triangle8',
      envelope: {
        attack: 0.08,
        decay: 0.5,
        sustain: 0.62,
        release: 2.7,
      },
    },
  },
  techno: {
    label: 'Techno Pulse',
    interval: '16n',
    defaults: {
      tempo: 136,
      complexity: 0.78,
      space: 0.24,
      chaos: 0.44,
      scale: 'dorian',
    },
    densityBias: 0.2,
    drift: 0.00045,
    durationStrong: '16n',
    durationWeak: '32n',
    filterBase: 1460,
    palette: {
      hueA: 194,
      hueB: 344,
      hueC: 182,
      sweepAlpha: 0.22,
    },
    synth: {
      oscillator: 'sawtooth',
      envelope: {
        attack: 0.004,
        decay: 0.08,
        sustain: 0.15,
        release: 0.2,
      },
    },
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createPulse = (x, y) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  x,
  y,
  phase: Math.random() * Math.PI * 2,
  age: 0,
  size: 0.2 + Math.random() * 0.8,
  energy: 0.32 + Math.random() * 0.2,
});

const seededPulses = (mode = DEFAULT_MODE) => {
  if (mode === 'techno') {
    const grid = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        grid.push(
          createPulse(
            0.12 + col * 0.15 + (Math.random() - 0.5) * 0.03,
            0.2 + row * 0.28 + (Math.random() - 0.5) * 0.04
          )
        );
      }
    }
    return grid;
  }

  const ring = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    const radius = 0.19 + (i % 4) * 0.05;
    ring.push(
      createPulse(
        0.5 + Math.cos(angle) * radius * (0.84 + Math.random() * 0.25),
        0.5 + Math.sin(angle) * radius * (0.84 + Math.random() * 0.25)
      )
    );
  }
  return ring;
};

const normalizePointer = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
};

const PulseGarden = () => {
  const defaultState = MODE_PRESETS[DEFAULT_MODE].defaults;

  const [mode, setMode] = useState(DEFAULT_MODE);
  const [pulses, setPulses] = useState(() => seededPulses(DEFAULT_MODE));
  const [tempo, setTempo] = useState(defaultState.tempo);
  const [scale, setScale] = useState(defaultState.scale);
  const [complexity, setComplexity] = useState(defaultState.complexity);
  const [space, setSpace] = useState(defaultState.space);
  const [chaos, setChaos] = useState(defaultState.chaos);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [transportStep, setTransportStep] = useState(0);

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const transportEventRef = useRef(null);
  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const delayRef = useRef(null);
  const reverbRef = useRef(null);
  const complexityRef = useRef(complexity);
  const chaosRef = useRef(chaos);
  const scaleRef = useRef(scale);
  const spaceRef = useRef(space);
  const modeRef = useRef(mode);
  const frozenRef = useRef(isFrozen);
  const isPaintingRef = useRef(false);
  const lastPaintRef = useRef(0);

  const modePreset = MODE_PRESETS[mode];

  useEffect(() => {
    complexityRef.current = complexity;
  }, [complexity]);

  useEffect(() => {
    chaosRef.current = chaos;
  }, [chaos]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    spaceRef.current = space;
  }, [space]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    frozenRef.current = isFrozen;
  }, [isFrozen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    const draw = (time) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const t = time * 0.001;
      const palette = MODE_PRESETS[modeRef.current].palette;

      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, `hsla(${palette.hueA + Math.sin(t * 0.1) * 12}, 72%, 9%, 0.74)`);
      bgGradient.addColorStop(0.5, `hsla(${palette.hueB + Math.sin(t * 0.08) * 16}, 80%, 11%, 0.62)`);
      bgGradient.addColorStop(1, `hsla(${palette.hueC}, 74%, 7%, 0.9)`);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const sweepX = (transportStep / STEPS) * width;
      ctx.strokeStyle = `rgba(236, 251, 255, ${palette.sweepAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      pulses.forEach((pulse, index) => {
        const px = pulse.x * width;
        const py = pulse.y * height;
        const orbit = 1 + Math.sin(t * 2.2 + pulse.phase + index * 0.35) * 0.16;
        const radius = (14 + pulse.size * 24 + pulse.energy * 22) * orbit;

        const glow = ctx.createRadialGradient(px, py, 0, px, py, radius * 2.8);
        glow.addColorStop(0, `rgba(255, 248, 232, ${0.9 + pulse.energy * 0.1})`);
        glow.addColorStop(0.3, `rgba(126, 246, 220, ${0.34 + pulse.energy * 0.3})`);
        glow.addColorStop(0.65, `rgba(255, 137, 86, ${0.16 + pulse.energy * 0.22})`);
        glow.addColorStop(1, 'rgba(255, 137, 86, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(221, 255, 249, ${0.24 + pulse.energy * 0.44})`;
        ctx.lineWidth = 1.4 + pulse.energy * 2.4;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(px, py, 2.2 + pulse.energy * 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [pulses, transportStep]);

  const initializeAudio = async () => {
    if (isAudioReady) {
      return;
    }

    await Tone.start();

    const preset = MODE_PRESETS[modeRef.current];
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: preset.filterBase,
      Q: 1.8,
    });
    const delay = new Tone.FeedbackDelay({
      delayTime: preset.interval === '8n' ? '4n' : '8n',
      feedback: 0.24,
      wet: 0.22,
    });
    const reverb = new Tone.Reverb({
      decay: preset.interval === '8n' ? 4.8 : 2.2,
      wet: 0.3,
      preDelay: 0.02,
    });
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 14,
      oscillator: { type: preset.synth.oscillator },
      envelope: preset.synth.envelope,
    });

    synth.chain(filter, delay, reverb, Tone.Destination);

    filterRef.current = filter;
    delayRef.current = delay;
    reverbRef.current = reverb;
    synthRef.current = synth;
    setIsAudioReady(true);
  };

  useEffect(() => {
    return () => {
      if (transportEventRef.current !== null) {
        Tone.Transport.clear(transportEventRef.current);
        transportEventRef.current = null;
      }
      Tone.Transport.stop();
      synthRef.current?.dispose();
      filterRef.current?.dispose();
      delayRef.current?.dispose();
      reverbRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.rampTo(tempo, 0.08);
  }, [tempo]);

  useEffect(() => {
    if (!isAudioReady || !synthRef.current) {
      return;
    }

    const preset = MODE_PRESETS[mode];
    synthRef.current.set({
      oscillator: { type: preset.synth.oscillator },
      envelope: preset.synth.envelope,
    });

    filterRef.current?.frequency.rampTo(preset.filterBase + spaceRef.current * 980, 0.12);
    delayRef.current?.set({ delayTime: preset.interval === '8n' ? '4n' : '8n' });
    reverbRef.current?.set({ decay: preset.interval === '8n' ? 4.8 : 2.2 });
  }, [mode, isAudioReady]);

  useEffect(() => {
    if (!isAudioReady) {
      return;
    }

    const isAmbient = modeRef.current === 'ambient';
    const delayTarget = (isAmbient ? 0.16 : 0.05) + space * (isAmbient ? 0.62 : 0.34);
    const reverbTarget = (isAmbient ? 0.24 : 0.1) + space * (isAmbient ? 0.66 : 0.26);

    delayRef.current?.wet.rampTo(delayTarget, 0.12);
    reverbRef.current?.wet.rampTo(reverbTarget, 0.12);
  }, [space, isAudioReady, mode]);

  useEffect(() => {
    if (!isPlaying || !isAudioReady || !synthRef.current) {
      if (transportEventRef.current !== null) {
        Tone.Transport.clear(transportEventRef.current);
        transportEventRef.current = null;
      }
      Tone.Transport.stop();
      setTransportStep(0);
      return;
    }

    if (transportEventRef.current !== null) {
      Tone.Transport.clear(transportEventRef.current);
      transportEventRef.current = null;
    }

    Tone.Transport.bpm.value = tempo;
    Tone.Transport.position = 0;

    let step = 0;
    transportEventRef.current = Tone.Transport.scheduleRepeat((time) => {
      const preset = MODE_PRESETS[modeRef.current];
      const scaleNotes = SCALE_MAP[scaleRef.current];
      const localChaos = chaosRef.current;
      const localSpace = spaceRef.current;
      const modeComplexity = clamp(complexityRef.current + preset.densityBias, 0.08, 1);

      filterRef.current?.frequency.rampTo(
        preset.filterBase + localSpace * (modeRef.current === 'ambient' ? 1400 : 2200) + localChaos * 280,
        0.08
      );
      delayRef.current?.feedback.rampTo(
        (modeRef.current === 'ambient' ? 0.18 : 0.08) + localSpace * (modeRef.current === 'ambient' ? 0.34 : 0.24),
        0.08
      );

      setTransportStep(step);

      setPulses((previous) =>
        previous.map((pulse, index) => {
          const lane = Math.round(pulse.x * 12);
          const nextPhase = frozenRef.current
            ? pulse.phase
            : pulse.phase + 0.14 + localChaos * 0.2;
          const driftAmount = preset.drift * (0.42 + localChaos * (modeRef.current === 'ambient' ? 0.8 : 0.35));
          const driftX = frozenRef.current
            ? pulse.x
            : clamp(
                pulse.x + Math.sin(nextPhase + step * 0.12) * driftAmount,
                0.04,
                0.96
              );
          const driftY = frozenRef.current
            ? pulse.y
            : clamp(
                pulse.y + Math.cos(nextPhase + step * 0.15) * driftAmount * 1.1,
                0.05,
                0.95
              );

          const cycleHit = (() => {
            if (modeRef.current === 'ambient') {
              const gate =
                (step + lane + index) % 6 === 0 ||
                (step + Math.round(pulse.age * 0.22) + lane) % 11 === 0;
              const chance = clamp(modeComplexity * 0.78 + (step % 8 === 0 ? 0.08 : 0), 0.05, 0.98);
              return gate && Math.random() < chance;
            }

            const gate =
              (step % 4 === 0 && pulse.y > 0.58) ||
              (step % 2 === 0 && pulse.x > 0.35 && pulse.x < 0.88) ||
              (step + lane + index) % 8 === 2;
            const chance = clamp(modeComplexity * 0.94 + (step % 4 === 0 ? 0.12 : 0), 0.08, 0.99);
            return gate && Math.random() < chance;
          })();

          if (!cycleHit) {
            return {
              ...pulse,
              phase: nextPhase,
              x: driftX,
              y: driftY,
              age: pulse.age + 1,
              energy: pulse.energy * 0.86,
            };
          }

          const rawIndex = Math.round((1 - pulse.y) * (scaleNotes.length - 1));
          const noteIndex = modeRef.current === 'ambient'
            ? rawIndex
            : clamp(Math.floor(rawIndex * 0.72), 0, scaleNotes.length - 1);
          const note = scaleNotes[clamp(noteIndex, 0, scaleNotes.length - 1)];
          const velocity = clamp(
            modeRef.current === 'ambient'
              ? 0.22 + pulse.size * 0.2 + localSpace * 0.2 + pulse.energy * 0.18 + localChaos * 0.1
              : 0.36 + pulse.size * 0.26 + localChaos * 0.24 + pulse.energy * 0.22,
            0.18,
            0.98
          );

          synthRef.current?.triggerAttackRelease(
            note,
            step % 4 === 0 ? preset.durationStrong : preset.durationWeak,
            time,
            velocity
          );

          return {
            ...pulse,
            phase: nextPhase,
            x: driftX,
            y: driftY,
            age: pulse.age + 1,
            energy: 1,
          };
        })
      );

      step = (step + 1) % STEPS;
    }, modePreset.interval);

    Tone.Transport.start('+0.02');

    return () => {
      if (transportEventRef.current !== null) {
        Tone.Transport.clear(transportEventRef.current);
        transportEventRef.current = null;
      }
      Tone.Transport.stop();
    };
  }, [isPlaying, isAudioReady, tempo, modePreset.interval]);

  const addPulseFromEvent = (event, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const now = performance.now();
    if (!force && now - lastPaintRef.current < 46) {
      return;
    }
    lastPaintRef.current = now;

    const { x, y } = normalizePointer(event, canvas);
    setPulses((previous) => {
      const next = [...previous, createPulse(x, y)];
      if (next.length > MAX_PULSES) {
        return next.slice(next.length - MAX_PULSES);
      }
      return next;
    });
  };

  const applyModePreset = (nextMode) => {
    const nextDefaults = MODE_PRESETS[nextMode].defaults;
    setMode(nextMode);
    setTempo(nextDefaults.tempo);
    setComplexity(nextDefaults.complexity);
    setSpace(nextDefaults.space);
    setChaos(nextDefaults.chaos);
    setScale(nextDefaults.scale);
    setPulses(() => seededPulses(nextMode));
    setTransportStep(0);
  };

  const togglePlayback = async () => {
    if (!isAudioReady) {
      try {
        await initializeAudio();
      } catch (error) {
        console.error('Unable to initialize Pulse Garden audio:', error);
        return;
      }
    }
    setIsPlaying((value) => !value);
  };

  return (
    <div className="pulse-garden">
      <div className="pulse-shell">
        <div className="pulse-header">
          <p className="pulse-kicker">Generative Audiovisual Instrument</p>
          <h1 className="pulse-title">Pulse Garden</h1>
          <p className="pulse-subtitle">
            Plant moving pulses that evolve into living rhythm, harmony, and light.
          </p>
        </div>

        <div className="pulse-stage">
          <canvas
            ref={canvasRef}
            className="pulse-canvas"
            onPointerDown={(event) => {
              isPaintingRef.current = true;
              addPulseFromEvent(event, true);
            }}
            onPointerMove={(event) => {
              if (isPaintingRef.current) {
                addPulseFromEvent(event);
              }
            }}
            onPointerUp={() => {
              isPaintingRef.current = false;
            }}
            onPointerLeave={() => {
              isPaintingRef.current = false;
            }}
          />

          <div className="pulse-overlay">
            <div className="pulse-badge">
              <Sparkles size={14} />
              <span>{pulses.length} pulses</span>
            </div>
            <div className="pulse-badge">
              <span>{MODE_PRESETS[mode].label}</span>
            </div>
          </div>
        </div>

        <div className="pulse-controls">
          <div className="pulse-actions">
            <button onClick={togglePlayback} className="pulse-button pulse-button-primary">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause Garden' : 'Start Garden'}
            </button>

            <button
              onClick={() => {
                setPulses(() => seededPulses(modeRef.current));
                setTransportStep(0);
              }}
              className="pulse-button"
            >
              <RotateCcw size={16} />
              Regenerate
            </button>

            <button onClick={() => setIsFrozen((value) => !value)} className="pulse-button">
              <Snowflake size={16} />
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </button>

            <button onClick={() => setPulses([])} className="pulse-button">
              <Trash2 size={16} />
              Clear
            </button>
          </div>

          <div className="pulse-grid">
            <label>
              Mode
              <select value={mode} onChange={(event) => applyModePreset(event.target.value)}>
                {Object.entries(MODE_PRESETS).map(([id, preset]) => (
                  <option key={id} value={id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Scale
              <select value={scale} onChange={(event) => setScale(event.target.value)}>
                {Object.keys(SCALE_MAP).map((scaleName) => (
                  <option key={scaleName} value={scaleName}>
                    {scaleName}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Tempo {tempo}
              <input
                type="range"
                min="72"
                max="172"
                step="1"
                value={tempo}
                onChange={(event) => setTempo(Number(event.target.value))}
              />
            </label>

            <label>
              Complexity {Math.round(complexity * 100)}%
              <input
                type="range"
                min="0.12"
                max="1"
                step="0.01"
                value={complexity}
                onChange={(event) => setComplexity(Number(event.target.value))}
              />
            </label>

            <label>
              Space {Math.round(space * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={space}
                onChange={(event) => setSpace(Number(event.target.value))}
              />
            </label>

            <label>
              Chaos {Math.round(chaos * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={chaos}
                onChange={(event) => setChaos(Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        {!isAudioReady && (
          <p className="pulse-footnote">
            Press <strong>Start Garden</strong> once to unlock browser audio.
          </p>
        )}
      </div>
    </div>
  );
};

export default PulseGarden;
