import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Pause, Play, Sparkles, Trash2, Wand2 } from 'lucide-react';

const STEPS = 16;
const MAX_NODES = 28;

const SCALE_MAP = {
  lydian: ['C3', 'D3', 'E3', 'G3', 'A3', 'B3', 'D4', 'E4', 'G4', 'A4'],
  dusk: ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'Eb4', 'G4', 'Bb4'],
  prism: ['C3', 'D3', 'F3', 'G3', 'A3', 'C4', 'D4', 'F4', 'A4'],
};

const MODE_PRESETS = {
  aurora: {
    label: 'Aurora Bloom',
    interval: '8n',
    noteLength: '8n',
    hueA: 188,
    hueB: 28,
  },
  tides: {
    label: 'Tidal Choir',
    interval: '4n',
    noteLength: '4n',
    hueA: 204,
    hueB: 332,
  },
  pulse: {
    label: 'Pulse Lantern',
    interval: '16n',
    noteLength: '16n',
    hueA: 176,
    hueB: 52,
  },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createNode = (x, y) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  x,
  y,
  energy: 0.35,
});

const normalizePointer = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  return { x, y };
};

const AuroraOrchestra = () => {
  const [mode, setMode] = useState('aurora');
  const [scale, setScale] = useState('lydian');
  const [bpm, setBpm] = useState(116);
  const [density, setDensity] = useState(0.72);
  const [air, setAir] = useState(0.46);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [transportStep, setTransportStep] = useState(0);
  const [nodes, setNodes] = useState(() => {
    const seeded = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      seeded.push(createNode(0.5 + Math.cos(angle) * 0.24, 0.5 + Math.sin(angle) * 0.24));
    }
    return seeded;
  });

  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const transportEventRef = useRef(null);
  const synthRef = useRef(null);
  const filterRef = useRef(null);
  const reverbRef = useRef(null);
  const delayRef = useRef(null);
  const isPaintingRef = useRef(false);
  const lastPaintRef = useRef(0);
  const modeRef = useRef(mode);
  const scaleRef = useRef(scale);
  const densityRef = useRef(density);
  const airRef = useRef(air);

  const modePreset = MODE_PRESETS[mode];
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    densityRef.current = density;
  }, [density]);

  useEffect(() => {
    airRef.current = air;
  }, [air]);

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
      const preset = MODE_PRESETS[modeRef.current];

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(
        0,
        `hsla(${preset.hueA}, 84%, 12%, ${0.94 + Math.sin(t * 0.1) * 0.02})`
      );
      gradient.addColorStop(
        0.55,
        `hsla(${preset.hueB}, 72%, 16%, ${0.9 + Math.sin(t * 0.07) * 0.03})`
      );
      gradient.addColorStop(1, 'hsla(212, 56%, 9%, 0.98)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const sweepX = (transportStep / STEPS) * width;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(236, 252, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();

      const mapped = nodes.map((node) => ({
        ...node,
        px: node.x * width,
        py: node.y * height,
      }));

      for (let i = 0; i < mapped.length; i += 1) {
        for (let j = i + 1; j < mapped.length; j += 1) {
          const dx = mapped[i].px - mapped[j].px;
          const dy = mapped[i].py - mapped[j].py;
          const dist = Math.hypot(dx, dy);
          if (dist > 160) {
            continue;
          }
          const alpha = (1 - dist / 160) * 0.28;
          ctx.strokeStyle = `rgba(186, 245, 255, ${alpha})`;
          ctx.lineWidth = 1 + (mapped[i].energy + mapped[j].energy) * 2;
          ctx.beginPath();
          ctx.moveTo(mapped[i].px, mapped[i].py);
          ctx.lineTo(mapped[j].px, mapped[j].py);
          ctx.stroke();
        }
      }

      mapped.forEach((node, index) => {
        const pulse = 1 + Math.sin(t * 1.8 + index * 0.7) * 0.12;
        const radius = 5 + node.energy * 20 * pulse + airRef.current * 8;

        const glow = ctx.createRadialGradient(
          node.px,
          node.py,
          0,
          node.px,
          node.py,
          radius * 2.6
        );
        glow.addColorStop(0, `rgba(249, 253, 255, ${0.85 + node.energy * 0.12})`);
        glow.addColorStop(0.38, `rgba(166, 242, 255, ${0.48 + node.energy * 0.2})`);
        glow.addColorStop(1, 'rgba(166, 242, 255, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 2.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 0.34, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [nodes, transportStep]);

  const initializeAudio = async () => {
    if (isAudioReady) {
      return;
    }

    await Tone.start();

    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 1200,
      Q: 1.2,
    });
    const delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.35,
      wet: 0.24,
    });
    const reverb = new Tone.JCReverb({
      roomSize: 0.84,
      wet: 0.3,
    });
    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 12,
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.2,
        release: 1.8,
      },
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
    Tone.Transport.bpm.rampTo(bpm, 0.08);
  }, [bpm]);

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

    Tone.Transport.bpm.value = bpm;
    Tone.Transport.position = 0;

    let step = 0;
    transportEventRef.current = Tone.Transport.scheduleRepeat((time) => {
      const activeScale = SCALE_MAP[scaleRef.current];
      const preset = MODE_PRESETS[modeRef.current];

      filterRef.current?.frequency.rampTo(700 + airRef.current * 1800, 0.06);
      delayRef.current?.wet.rampTo(0.1 + airRef.current * 0.45, 0.08);
      reverbRef.current?.wet.rampTo(0.15 + airRef.current * 0.42, 0.08);

      setTransportStep(step);

      setNodes((previous) =>
        previous.map((node) => {
          const nodeStep = Math.round(node.x * (STEPS - 1));
          const shouldHit =
            ((step + nodeStep) % STEPS === 0 || (step + nodeStep) % 7 === 0) &&
            Math.random() < densityRef.current;

          if (!shouldHit) {
            return { ...node, energy: node.energy * 0.84 };
          }

          const noteIndex = Math.round((1 - node.y) * (activeScale.length - 1));
          const note = activeScale[clamp(noteIndex, 0, activeScale.length - 1)];
          const velocity = clamp(
            0.2 + (1 - node.y) * 0.35 + node.energy * 0.2 + airRef.current * 0.25,
            0.18,
            0.95
          );

          synthRef.current?.triggerAttackRelease(
            note,
            preset.noteLength,
            time,
            velocity
          );

          return { ...node, energy: 1 };
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
  }, [isPlaying, isAudioReady, bpm, modePreset.interval]);

  const addNodeFromEvent = (event, force = false) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const now = performance.now();
    if (!force && now - lastPaintRef.current < 48) {
      return;
    }
    lastPaintRef.current = now;

    const { x, y } = normalizePointer(event, canvas);
    setNodes((previous) => {
      const next = [...previous, createNode(x, y)];
      if (next.length > MAX_NODES) {
        return next.slice(next.length - MAX_NODES);
      }
      return next;
    });
  };

  const seedConstellation = () => {
    setNodes(() => {
      const seeded = [];
      const count = 11;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count;
        const radius = 0.2 + ((i % 3) * 0.08);
        seeded.push(
          createNode(
            0.5 + Math.cos(angle) * radius * (0.8 + Math.random() * 0.3),
            0.5 + Math.sin(angle) * radius * (0.8 + Math.random() * 0.3)
          )
        );
      }
      return seeded;
    });
  };

  const togglePlayback = async () => {
    if (!isAudioReady) {
      try {
        await initializeAudio();
      } catch (error) {
        console.error('Unable to initialize audio:', error);
        return;
      }
    }
    setIsPlaying((value) => !value);
  };

  return (
    <div className="aurora-orchestra">
      <div className="aurora-shell">
        <div className="aurora-header">
          <p className="aurora-kicker">Visionary Audio Installation</p>
          <h1 className="aurora-title">Aurora Orchestra</h1>
          <p className="aurora-subtitle">
            Paint a constellation. Each star becomes a voice in a moving choir of light.
          </p>
        </div>

        <div className="aurora-stage">
          <canvas
            ref={canvasRef}
            className="aurora-canvas"
            onPointerDown={(event) => {
              isPaintingRef.current = true;
              addNodeFromEvent(event, true);
            }}
            onPointerMove={(event) => {
              if (isPaintingRef.current) {
                addNodeFromEvent(event);
              }
            }}
            onPointerUp={() => {
              isPaintingRef.current = false;
            }}
            onPointerLeave={() => {
              isPaintingRef.current = false;
            }}
          />

          <div className="aurora-overlay">
            <div className="aurora-badge">
              <Sparkles size={14} />
              <span>{modePreset.label}</span>
            </div>
            <div className="aurora-badge">
              <span>{nodes.length} stars</span>
            </div>
          </div>
        </div>

        <div className="aurora-controls">
          <div className="aurora-actions">
            <button
              onClick={togglePlayback}
              className="aurora-button aurora-button-primary"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause Orbit' : 'Start Orbit'}
            </button>
            <button
              onClick={seedConstellation}
              className="aurora-button"
            >
              <Wand2 size={16} />
              Seed Sky
            </button>
            <button
              onClick={() => setNodes([])}
              className="aurora-button"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>

          <div className="aurora-grid">
            <label>
              Mode
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
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
              Tempo {bpm}
              <input
                type="range"
                min="72"
                max="168"
                step="1"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </label>

            <label>
              Density {Math.round(density * 100)}%
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.01"
                value={density}
                onChange={(event) => setDensity(Number(event.target.value))}
              />
            </label>

            <label>
              Atmosphere {Math.round(air * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={air}
                onChange={(event) => setAir(Number(event.target.value))}
              />
            </label>
          </div>
        </div>

        {!isAudioReady && (
          <p className="aurora-footnote">
            Press <strong>Start Orbit</strong> once to unlock audio. Then draw directly on the stage.
          </p>
        )}
      </div>
    </div>
  );
};

export default AuroraOrchestra;
