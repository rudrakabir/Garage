import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const SHAPES = {
  CIRCLE: 'circle',
  LINE: 'line',
  TRIANGLE: 'triangle'
};

const VISUAL_MODES = {
  ROW: 'row',
  CIRCLE: 'circle'
};

const SUBDIVISIONS = {
  QUARTER: { value: 1, label: 'Quarter Notes', interval: '4n' },
  EIGHTH: { value: 2, label: 'Eighth Notes', interval: '8n' },
  TRIPLET: { value: 3, label: 'Triplets', interval: '12n' },
  SIXTEENTH: { value: 4, label: 'Sixteenth Notes', interval: '16n' }
};

const toRgba = (hexColor, alpha) => {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(0, 255, 0, ${alpha})`;
  }

  const fullHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const colorValue = Number.parseInt(fullHex, 16);
  const r = (colorValue >> 16) & 255;
  const g = (colorValue >> 8) & 255;
  const b = colorValue & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const randomHexColor = () => `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

const getSubdivisionConfig = (subdivisionValue) => (
  Object.values(SUBDIVISIONS).find(({ value }) => value === subdivisionValue) || SUBDIVISIONS.QUARTER
);

const VisualMetronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState({
    bpm: 120,
    beatsPerBar: 4,
    swing: 0,
    shape: SHAPES.CIRCLE,
    color: '#00ff00',
    subdivision: SUBDIVISIONS.QUARTER.value,
    visualMode: VISUAL_MODES.ROW,
    accentFirstBeat: true,
    mute: false,
    showTrails: true
  });

  const [activeStep, setActiveStep] = useState(0);
  const [measureCount, setMeasureCount] = useState(1);
  const [, setTapTimes] = useState([]);

  const synthsRef = useRef({ accent: null, regular: null });
  const eventIdRef = useRef(null);
  const activeStepRef = useRef(0);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Initialize synth
  useEffect(() => {
    synthsRef.current.accent = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
    }).toDestination();
    synthsRef.current.regular = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.035 }
    }).toDestination();

    return () => {
      if (eventIdRef.current !== null) {
        Tone.Transport.clear(eventIdRef.current);
        eventIdRef.current = null;
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
      synthsRef.current.accent?.dispose();
      synthsRef.current.regular?.dispose();
    };
  }, []);

  const getShapeClass = (shape) => {
    switch (shape) {
      case SHAPES.LINE:
        return 'h-2 w-16';
      case SHAPES.TRIANGLE:
        return 'w-8 h-8';
      case SHAPES.CIRCLE:
      default:
        return 'w-8 h-8 rounded-full';
    }
  };

  const getShapeStyle = (shape, isActive, isDownBeat) => ({
    backgroundColor: settings.color,
    opacity: isActive ? 1 : (settings.showTrails ? (isDownBeat ? 0.42 : 0.22) : 0.16),
    transform: `scale(${isActive ? 1.6 : (isDownBeat ? 1.1 : 1)})`,
    boxShadow: isActive ? `0 0 24px ${toRgba(settings.color, 0.85)}` : 'none',
    clipPath: shape === SHAPES.TRIANGLE ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined
  });

  const stopMetronome = () => {
    if (eventIdRef.current !== null) {
      try {
        Tone.Transport.clear(eventIdRef.current);
      } catch {
        // Ignore stale transport event IDs.
      }
      eventIdRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    activeStepRef.current = 0;
    setActiveStep(0);
    setMeasureCount(1);
  };

  const startMetronome = async () => {
    const currentSettings = settingsRef.current;
    const subdivisionConfig = getSubdivisionConfig(currentSettings.subdivision);

    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = currentSettings.bpm;
    Tone.Transport.swing = currentSettings.swing / 100;
    Tone.Transport.swingSubdivision = '8n';

    activeStepRef.current = 0;
    setActiveStep(0);
    setMeasureCount(1);

    eventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      const freshSettings = settingsRef.current;
      const totalSteps = freshSettings.beatsPerBar * freshSettings.subdivision;
      const currentStep = activeStepRef.current;
      const isBeatStep = currentStep % freshSettings.subdivision === 0;
      const isBarStart = currentStep === 0;

      if (!freshSettings.mute && isBeatStep) {
        if (isBarStart && freshSettings.accentFirstBeat) {
          synthsRef.current.accent?.triggerAttackRelease('C6', '32n', time, 0.95);
        } else {
          synthsRef.current.regular?.triggerAttackRelease('A5', '32n', time, 0.7);
        }
      }

      setActiveStep(currentStep);
      const nextStep = (currentStep + 1) % totalSteps;
      activeStepRef.current = nextStep;
      if (nextStep === 0) {
        setMeasureCount((prev) => prev + 1);
      }
    }, subdivisionConfig.interval);

    Tone.Transport.start();
  };

  const togglePlay = async () => {
    if (isPlaying) {
      stopMetronome();
      setIsPlaying(false);
      return;
    }
    await startMetronome();
    setIsPlaying(true);
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'bpm') {
      Tone.Transport.bpm.rampTo(value, 0.05);
    }
    if (key === 'swing') {
      Tone.Transport.swing = value / 100;
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    setTapTimes((prev) => {
      const next = [...prev, now].filter((timestamp) => now - timestamp < 2200).slice(-6);

      if (next.length >= 2) {
        const intervals = [];
        for (let i = 1; i < next.length; i += 1) {
          intervals.push(next[i] - next[i - 1]);
        }
        const averageInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / averageInterval);
        const clamped = Math.max(30, Math.min(300, calculatedBpm));
        updateSettings('bpm', clamped);
      }
      return next;
    });
  };

  const applyRandomColor = () => {
    updateSettings('color', randomHexColor());
  };

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    void startMetronome();
  }, [settings.subdivision]); // Reschedule when subdivision changes.

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    activeStepRef.current = 0;
    setActiveStep(0);
    setMeasureCount(1);
  }, [settings.beatsPerBar]); // Keep beat grid and counter aligned with new bar length.

  const totalSteps = settings.beatsPerBar * settings.subdivision;
  const activeBeat = Math.floor(activeStep / settings.subdivision) + 1;
  const activeSubStep = (activeStep % settings.subdivision) + 1;
  const pulseOpacity = isPlaying ? (activeStep % settings.subdivision === 0 ? 0.26 : 0.14) : 0.06;
  const centerGlowColor = toRgba(settings.color, pulseOpacity);

  const beatElements = Array.from({ length: totalSteps }, (_, i) => {
    const isDownBeat = i % settings.subdivision === 0;
    const isActive = activeStep === i;
    const beatNumber = Math.floor(i / settings.subdivision) + 1;

    if (settings.visualMode === VISUAL_MODES.CIRCLE) {
      const angle = (i / totalSteps) * Math.PI * 2 - Math.PI / 2;
      const radius = 40;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;

      return (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div
            className={`${getShapeClass(settings.shape)} transition-all duration-100 ease-out`}
            style={getShapeStyle(settings.shape, isActive, isDownBeat)}
          />
        </div>
      );
    }

    return (
      <div key={i} className="flex flex-col items-center gap-1">
        <div
          className={`${getShapeClass(settings.shape)} transition-all duration-100 ease-out`}
          style={getShapeStyle(settings.shape, isActive, isDownBeat)}
        />
        {isDownBeat && (
          <span className="text-[10px] text-gray-400">
            {beatNumber}
          </span>
        )}
      </div>
    );
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-black text-white">
      <div className="bg-gray-900 shadow-lg p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <button
              onClick={togglePlay}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>

            <div className="flex items-center space-x-2">
              <label className="text-sm">BPM:</label>
              <input
                type="number"
                value={settings.bpm}
                onChange={(e) => updateSettings('bpm', Number(e.target.value))}
                className="w-24 px-2 py-1 bg-gray-800 rounded text-white"
                min="1"
                max="300"
                step="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Beats/Bar:</label>
              <input
                type="number"
                value={settings.beatsPerBar}
                onChange={(e) => updateSettings('beatsPerBar', Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                className="w-20 px-2 py-1 bg-gray-800 rounded text-white"
                min="1"
                max="12"
                step="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Swing:</label>
              <input
                type="range"
                value={settings.swing}
                onChange={(e) => updateSettings('swing', Number(e.target.value))}
                className="w-28"
                min="0"
                max="60"
                step="1"
              />
              <span className="text-sm w-10 text-right">{settings.swing}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Shape:</label>
              <select
                value={settings.shape}
                onChange={(e) => updateSettings('shape', e.target.value)}
                className="px-2 py-1 bg-gray-800 rounded text-white"
              >
                <option value={SHAPES.CIRCLE}>Circle</option>
                <option value={SHAPES.LINE}>Line</option>
                <option value={SHAPES.TRIANGLE}>Triangle</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Color:</label>
              <input
                type="color"
                value={settings.color}
                onChange={(e) => updateSettings('color', e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Subdivision:</label>
              <select
                value={settings.subdivision}
                onChange={(e) => updateSettings('subdivision', Number(e.target.value))}
                className="px-2 py-1 bg-gray-800 rounded text-white"
              >
                {Object.values(SUBDIVISIONS).map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm">Layout:</label>
              <select
                value={settings.visualMode}
                onChange={(e) => updateSettings('visualMode', e.target.value)}
                className="px-2 py-1 bg-gray-800 rounded text-white"
              >
                <option value={VISUAL_MODES.ROW}>Row</option>
                <option value={VISUAL_MODES.CIRCLE}>Circle</option>
              </select>
            </div>

            <button
              onClick={handleTapTempo}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Tap Tempo
            </button>

            <button
              onClick={applyRandomColor}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Random Color
            </button>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.accentFirstBeat}
                onChange={(e) => updateSettings('accentFirstBeat', e.target.checked)}
                className="accent-green-500"
              />
              <span>Accent 1</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.showTrails}
                onChange={(e) => updateSettings('showTrails', e.target.checked)}
                className="accent-green-500"
              />
              <span>Trails</span>
            </label>

            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={settings.mute}
                onChange={(e) => updateSettings('mute', e.target.checked)}
                className="accent-green-500"
              />
              <span>Mute</span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-gray-300">
            <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
              Measure {measureCount}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
              Beat {activeBeat}/{settings.beatsPerBar}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
              Sub {activeSubStep}/{settings.subdivision}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700">
              Interval {getSubdivisionConfig(settings.subdivision).interval}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-6 py-8 transition-all duration-150"
        style={{ background: `radial-gradient(circle at 50% 50%, ${centerGlowColor} 0%, rgba(0, 0, 0, 0) 62%)` }}
      >
        {settings.visualMode === VISUAL_MODES.CIRCLE ? (
          <div className="relative w-[min(78vw,34rem)] aspect-square">
            {beatElements}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center select-none">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Beat</p>
              <p className="text-5xl font-semibold leading-none">{activeBeat}</p>
              <p className="text-xs mt-2 text-gray-400">Sub {activeSubStep}/{settings.subdivision}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 max-w-6xl">
            {beatElements}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualMetronome;
