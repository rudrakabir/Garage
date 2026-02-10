import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const SHAPES = {
  CIRCLE: 'circle',
  LINE: 'line',
  TRIANGLE: 'triangle'
};

const SUBDIVISIONS = {
  QUARTER: { value: 1, label: 'Quarter Notes', interval: '4n' },
  EIGHTH: { value: 2, label: 'Eighth Notes', interval: '8n' },
  TRIPLET: { value: 3, label: 'Triplets', interval: '12n' },
  SIXTEENTH: { value: 4, label: 'Sixteenth Notes', interval: '16n' }
};

const VisualMetronome = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState({
    bpm: 120,
    shape: SHAPES.CIRCLE,
    color: '#00ff00',
    subdivision: SUBDIVISIONS.QUARTER.value
  });

  const [activeBeat, setActiveBeat] = useState(0);
  const synth = useRef(null);
  const eventIdRef = useRef(null);

  // Initialize synth
  useEffect(() => {
    synth.current = new Tone.MembraneSynth().toDestination();
    return () => {
      if (synth.current) {
        synth.current.dispose();
      }
    };
  }, []);

  const getShapeClass = (shape) => {
    switch (shape) {
      case SHAPES.LINE:
        return 'h-2 w-16';
      case SHAPES.TRIANGLE:
        return 'w-8 h-8 transform rotate-45';
      case SHAPES.CIRCLE:
      default:
        return 'w-8 h-8 rounded-full';
    }
  };

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      
      Tone.Transport.bpm.value = settings.bpm;
      let beat = 0;

      // Clear any existing events
      if (eventIdRef.current) {
        Tone.Transport.clear(eventIdRef.current);
      }

      // Schedule new events
      eventIdRef.current = Tone.Transport.scheduleRepeat((time) => {
        console.log('Beat:', beat); // Debug log
        synth.current.triggerAttackRelease('C2', '16n', time);
        setActiveBeat(beat);
        beat = (beat + 1) % settings.subdivision;
      }, `${4 / settings.subdivision}n`);

      Tone.Transport.start();
    } else {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setActiveBeat(0);
    }
    setIsPlaying(!isPlaying);
  };

  const updateSettings = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'bpm') {
      Tone.Transport.bpm.value = value;
    }
  };

  const beatElements = Array.from({ length: settings.subdivision }, (_, i) => (
    <div
      key={i}
      className={`${getShapeClass(settings.shape)} transform transition-transform duration-100 ease-out
        ${activeBeat === i ? 'animate-ping-once' : ''}`}
      style={{
        backgroundColor: settings.color,
        opacity: activeBeat === i ? 1 : 0.3,
        transform: activeBeat === i ? 'scale(1.5)' : 'scale(1)',
      }}
    />
  ));

  return (
    <div className="flex flex-col h-screen bg-black text-white">
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
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-8">
        {beatElements}
      </div>

      <style jsx>{`
        @keyframes ping-once {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .animate-ping-once {
          animation: ping-once 60ms ease-out;
        }
      `}</style>
    </div>
  );
};

export default VisualMetronome;