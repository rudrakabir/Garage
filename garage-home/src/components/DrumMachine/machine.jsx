import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Save,
  Upload,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { createDrumMachineEngine } from '../../audio/drumMachineEngine';

const STEPS = 16;
const TRACKS = 8;
const SLOT_IDS = ['A', 'B', 'C', 'D'];
const STORAGE_KEY = 'drum-machine-v2-pattern';

const SOUND_FILES = [
  'Kick_Angry.mp3',
  'Kick_Bouncy.mp3',
  'Kick_Hard.mp3',
  'Kick_Soft 1.mp3',
  'Kick_Soft 3.mp3',
  'Snare_Modular 1.mp3',
  'Snare_Modular 8.mp3',
  'Snare_Granular 1.mp3',
  'Snare_Granular 7.mp3',
  'Clap_Stack 1.mp3',
  'Clap_Stack 7.mp3',
  'Hat_Closed.mp3',
  'Hat_Dirt.mp3',
  'Perc_Metal Bar.mp3',
  'Rim_Modular.mp3',
  'Tom_Tight.mp3',
  'Drill_RimShot.mp3',
  'Fill_Simple 1.mp3',
  'Glitch_Moment 1.mp3',
  'Loop_150bpm_BubbleHatsWide.mp3',
  'Loop_150bpm_Shimmery.mp3',
  'Loop_150bpm_Snappy.mp3',
];

const CATEGORIES = {
  Kicks: ['Kick_'],
  Snares: ['Snare_'],
  Claps: ['Clap_'],
  Hats: ['Hat_'],
  Percs: ['Perc_', 'Rim_', 'Tom_', 'Drill_'],
  Effects: ['Fill_', 'Glitch_'],
  Loops: ['Loop_'],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createDefaultTracks = () =>
  Array.from({ length: TRACKS }, () => ({
    sound: '',
    volume: 0.7,
    mute: false,
    probability: 1,
  }));

const createDefaultSequence = () =>
  Array.from({ length: TRACKS }, () => Array(STEPS).fill(false));

const createDefaultPattern = () => ({
  tracks: createDefaultTracks(),
  sequence: createDefaultSequence(),
});

const createDefaultSlots = () =>
  Object.fromEntries(SLOT_IDS.map((slotId) => [slotId, createDefaultPattern()]));

const createDefaultState = () => ({
  bpm: 120,
  swing: 0,
  humanize: 0,
  slots: createDefaultSlots(),
  activeSlot: SLOT_IDS[0],
  songMode: false,
  songLoop: true,
  songChain: ['A', 'B'],
});

const normalizeTrack = (track = {}) => ({
  sound: typeof track.sound === 'string' ? track.sound : '',
  volume: clamp(Number(track.volume ?? 0.7), 0, 1),
  mute: Boolean(track.mute),
  probability: clamp(Number(track.probability ?? 1), 0, 1),
});

const normalizeSequence = (sequence = []) =>
  Array.from({ length: TRACKS }, (_, trackIndex) =>
    Array.from(
      { length: STEPS },
      (_, stepIndex) => Boolean(sequence?.[trackIndex]?.[stepIndex])
    )
  );

const normalizePattern = (pattern = {}) => ({
  tracks: Array.from({ length: TRACKS }, (_, index) =>
    normalizeTrack(pattern?.tracks?.[index])
  ),
  sequence: normalizeSequence(pattern.sequence),
});

const parseSongChain = (rawChain) => {
  const chain =
    Array.isArray(rawChain) ? rawChain : String(rawChain ?? '').split(/[,\s]+/);

  const normalized = chain
    .map((value) => String(value).trim().toUpperCase())
    .filter((slotId) => SLOT_IDS.includes(slotId));

  return normalized.length ? normalized : ['A'];
};

const readSavedState = () => {
  const defaults = createDefaultState();
  if (typeof window === 'undefined') {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw);
    return {
      bpm: clamp(Number(parsed.bpm ?? defaults.bpm), 40, 240),
      swing: clamp(Number(parsed.swing ?? defaults.swing), 0, 1),
      humanize: clamp(Number(parsed.humanize ?? defaults.humanize), 0, 1),
      slots: Object.fromEntries(
        SLOT_IDS.map((slotId) => [slotId, normalizePattern(parsed?.slots?.[slotId])])
      ),
      activeSlot: SLOT_IDS.includes(parsed.activeSlot)
        ? parsed.activeSlot
        : defaults.activeSlot,
      songMode: Boolean(parsed.songMode),
      songLoop: parsed.songLoop !== false,
      songChain: parseSongChain(parsed.songChain),
    };
  } catch (error) {
    console.error('Failed to read saved drum pattern:', error);
    return defaults;
  }
};

const buildAvailableSounds = () =>
  Object.fromEntries(
    Object.entries(CATEGORIES).map(([category, prefixes]) => [
      category,
      SOUND_FILES.filter((file) =>
        prefixes.some((prefix) => file.startsWith(prefix))
      ),
    ])
  );

const DrumMachine = () => {
  const initialStateRef = useRef(readSavedState());
  const initialState = initialStateRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [bpm, setBpm] = useState(initialState.bpm);
  const [swing, setSwing] = useState(initialState.swing);
  const [humanize, setHumanize] = useState(initialState.humanize);
  const [slots, setSlots] = useState(initialState.slots);
  const [activeSlot, setActiveSlot] = useState(initialState.activeSlot);
  const [songMode, setSongMode] = useState(initialState.songMode);
  const [songLoop, setSongLoop] = useState(initialState.songLoop);
  const [songChain, setSongChain] = useState(initialState.songChain);
  const [songChainInput, setSongChainInput] = useState(
    initialState.songChain.join(', ')
  );
  const [songIndex, setSongIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const engineRef = useRef(null);
  const isPlayingRef = useRef(false);
  const songModeRef = useRef(songMode);
  const songLoopRef = useRef(songLoop);
  const songChainRef = useRef(songChain);
  const songIndexRef = useRef(songIndex);
  const barCountRef = useRef(0);
  const availableSounds = useMemo(() => buildAvailableSounds(), []);
  const activePattern = slots[activeSlot] ?? createDefaultPattern();
  const tracks = activePattern.tracks;
  const sequence = activePattern.sequence;

  useEffect(() => {
    const engine = createDrumMachineEngine({
      stepCount: STEPS,
      onStep: (step) => {
        setCurrentStep(step);

        if (!isPlayingRef.current || !songModeRef.current || step !== 0) {
          return;
        }

        if (barCountRef.current === 0) {
          barCountRef.current = 1;
          return;
        }

        const chain = songChainRef.current;
        if (!chain.length) {
          return;
        }

        let nextIndex = songIndexRef.current + 1;
        if (nextIndex >= chain.length) {
          if (!songLoopRef.current) {
            engine.stop({ resetStep: false });
            isPlayingRef.current = false;
            setIsPlaying(false);
            setCurrentStep(0);
            barCountRef.current = 0;
            return;
          }
          nextIndex = 0;
        }

        songIndexRef.current = nextIndex;
        setSongIndex(nextIndex);
        setActiveSlot(chain[nextIndex]);
        barCountRef.current += 1;
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setPattern({ sequence, tracks });
  }, [sequence, tracks]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    songModeRef.current = songMode;
  }, [songMode]);

  useEffect(() => {
    songLoopRef.current = songLoop;
  }, [songLoop]);

  useEffect(() => {
    songChainRef.current = songChain;
  }, [songChain]);

  useEffect(() => {
    songIndexRef.current = songIndex;
  }, [songIndex]);

  useEffect(() => {
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engineRef.current?.setSwing(swing);
  }, [swing]);

  useEffect(() => {
    engineRef.current?.setHumanize(humanize);
  }, [humanize]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bpm,
        swing,
        humanize,
        slots,
        activeSlot,
        songMode,
        songLoop,
        songChain,
      })
    );
  }, [bpm, swing, humanize, slots, activeSlot, songMode, songLoop, songChain]);

  const togglePlay = async () => {
    const engine = engineRef.current;
    if (!engine || isLoadingAudio) {
      return;
    }

    if (isPlaying) {
      engine.stop();
      setIsPlaying(false);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const currentChain = parseSongChain(songChain);
      const playbackSlot =
        songMode && currentChain.length
          ? currentChain[0]
          : SLOT_IDS.includes(activeSlot)
          ? activeSlot
          : SLOT_IDS[0];

      if (playbackSlot !== activeSlot) {
        setActiveSlot(playbackSlot);
      }

      const initialPattern = slots[playbackSlot] ?? createDefaultPattern();
      const soundsToPreload = songMode
        ? currentChain.flatMap(
            (slotId) => (slots[slotId] ?? createDefaultPattern()).tracks.map((track) => track.sound)
          )
        : initialPattern.tracks.map((track) => track.sound);

      setSongIndex(0);
      songIndexRef.current = 0;
      barCountRef.current = 0;

      engine.setPattern(initialPattern);
      await engine.start(soundsToPreload);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start sequencer:', error);
      setIsPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const stopPlayback = () => {
    engineRef.current?.stop();
    setIsPlaying(false);
    setCurrentStep(0);
    setSongIndex(0);
    songIndexRef.current = 0;
    barCountRef.current = 0;
  };

  const updateActivePattern = (updateFn) => {
    setSlots((prevSlots) => {
      const currentPattern = prevSlots[activeSlot] ?? createDefaultPattern();
      return {
        ...prevSlots,
        [activeSlot]: updateFn(currentPattern),
      };
    });
  };

  const updateTrack = (trackIndex, patch) => {
    updateActivePattern((pattern) => {
      const nextTracks = [...pattern.tracks];
      nextTracks[trackIndex] = { ...nextTracks[trackIndex], ...patch };
      return { ...pattern, tracks: nextTracks };
    });
  };

  const toggleStep = (trackIndex, stepIndex) => {
    updateActivePattern((pattern) => {
      const nextSequence = [...pattern.sequence];
      nextSequence[trackIndex] = [...pattern.sequence[trackIndex]];
      nextSequence[trackIndex][stepIndex] = !nextSequence[trackIndex][stepIndex];
      return { ...pattern, sequence: nextSequence };
    });
  };

  const updateTrackSound = async (trackIndex, soundFile) => {
    if (trackIndex === null || trackIndex === undefined) {
      return;
    }

    const previewVolume = tracks[trackIndex]?.volume ?? 0.7;
    updateTrack(trackIndex, { sound: soundFile });
    setShowSoundPicker(false);

    try {
      await engineRef.current?.preview(soundFile, previewVolume);
    } catch (error) {
      console.error('Failed to preview sound:', error);
    }
  };

  const resetPattern = () => {
    stopPlayback();
    setSlots((prevSlots) => ({
      ...prevSlots,
      [activeSlot]: createDefaultPattern(),
    }));
  };

  const resetAllSlots = () => {
    stopPlayback();
    const defaults = createDefaultState();
    setBpm(defaults.bpm);
    setSwing(defaults.swing);
    setHumanize(defaults.humanize);
    setSlots(defaults.slots);
    setActiveSlot(defaults.activeSlot);
    setSongMode(defaults.songMode);
    setSongLoop(defaults.songLoop);
    setSongChain(defaults.songChain);
    setSongChainInput(defaults.songChain.join(', '));
  };

  const loadSavedPattern = () => {
    stopPlayback();
    const saved = readSavedState();
    setBpm(saved.bpm);
    setSwing(saved.swing);
    setHumanize(saved.humanize);
    setSlots(saved.slots);
    setActiveSlot(saved.activeSlot);
    setSongMode(saved.songMode);
    setSongLoop(saved.songLoop);
    setSongChain(saved.songChain);
    setSongChainInput(saved.songChain.join(', '));
  };

  const savePattern = () => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bpm,
        swing,
        humanize,
        slots,
        activeSlot,
        songMode,
        songLoop,
        songChain,
      })
    );
  };

  const applySongChain = () => {
    const parsed = parseSongChain(songChainInput);
    setSongChain(parsed);
    setSongChainInput(parsed.join(', '));
    setSongIndex(0);
    songIndexRef.current = 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>
            <div className="text-sm text-gray-600">
              {isLoadingAudio
                ? 'Loading audio...'
                : isPlaying
                ? 'Playing'
                : 'Stopped'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              BPM
              <input
                type="number"
                min="40"
                max="240"
                value={bpm}
                onChange={(event) =>
                  setBpm(clamp(Number(event.target.value), 40, 240))
                }
                className="w-20 px-2 py-1 bg-gray-100 rounded-lg text-center text-gray-900 border border-gray-300"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              Swing {Math.round(swing * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={swing}
                onChange={(event) => setSwing(Number(event.target.value))}
                className="w-28"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              Humanize {Math.round(humanize * 100)}%
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={humanize}
                onChange={(event) => setHumanize(Number(event.target.value))}
                className="w-28"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={savePattern}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={loadSavedPattern}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Load
            </button>
            <button
              onClick={resetPattern}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Slot
            </button>
            <button
              onClick={resetAllSlots}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset All
            </button>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-lg border border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-sm text-gray-700">Pattern Slot</span>
            {SLOT_IDS.map((slotId) => (
              <button
                key={slotId}
                onClick={() => {
                  if (!(isPlaying && songMode)) {
                    setActiveSlot(slotId);
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeSlot === slotId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300'
                } ${(isPlaying && songMode) ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {slotId}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={songMode}
                onChange={(event) => setSongMode(event.target.checked)}
              />
              Song Mode
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={songLoop}
                onChange={(event) => setSongLoop(event.target.checked)}
                disabled={!songMode}
              />
              Loop Song
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              Chain
              <input
                type="text"
                value={songChainInput}
                onChange={(event) => setSongChainInput(event.target.value)}
                className="w-40 px-2 py-1 rounded border border-gray-300 bg-white"
                placeholder="A, B, C"
              />
            </label>

            <button
              onClick={applySongChain}
              className="px-3 py-1.5 rounded-md text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
            >
              Apply Chain
            </button>

            <div className="text-xs text-gray-600">
              {songMode
                ? `Now: ${songChain[songIndex] ?? songChain[0] ?? 'A'}`
                : `Active: ${activeSlot}`}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {tracks.map((track, trackIndex) => (
            <div
              key={trackIndex}
              className="flex flex-col xl:flex-row gap-3 xl:items-center"
            >
              <div className="xl:w-56 px-2 py-2 bg-gray-100 rounded-lg border border-gray-200">
                <button
                  onClick={() => {
                    setSelectedTrack(trackIndex);
                    setShowSoundPicker(true);
                  }}
                  className="w-full text-sm truncate text-left text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {track.sound ? track.sound.replace('.mp3', '') : 'Select Sound'}
                </button>
              </div>

              <div
                className="flex-1 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${STEPS}, minmax(0, 1fr))` }}
              >
                {sequence[trackIndex].map((isActive, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(trackIndex, stepIndex)}
                    className={`w-full aspect-square rounded-md transition-all ${
                      isActive ? 'bg-blue-500' : 'bg-gray-200'
                    } ${currentStep === stepIndex ? 'ring-2 ring-blue-500' : ''} ${
                      isActive ? 'hover:bg-blue-400' : 'hover:bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="xl:w-64 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-2">
                <button
                  onClick={() => updateTrack(trackIndex, { mute: !track.mute })}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 transition-colors ${
                    track.mute ? 'bg-gray-200 text-gray-500' : 'bg-white text-gray-800'
                  }`}
                >
                  {track.mute ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {track.mute ? 'Muted' : 'On'}
                </button>

                <label className="flex items-center gap-2 text-xs text-gray-700">
                  Vol
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.volume}
                    onChange={(event) =>
                      updateTrack(trackIndex, {
                        volume: Number(event.target.value),
                      })
                    }
                    className="w-full"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-700">
                  Prob {Math.round(track.probability * 100)}%
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={track.probability}
                    onChange={(event) =>
                      updateTrack(trackIndex, {
                        probability: Number(event.target.value),
                      })
                    }
                    className="w-full"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showSoundPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Select Sound</h3>
              <button
                onClick={() => setShowSoundPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {Object.entries(availableSounds).map(([category, sounds]) => (
              <div key={category} className="mb-5">
                <h4 className="font-bold mb-2 text-gray-900">{category}</h4>
                <div className="space-y-1">
                  {sounds.map((sound) => (
                    <button
                      key={sound}
                      onClick={() => {
                        void updateTrackSound(selectedTrack, sound);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                    >
                      {sound.replace('.mp3', '')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DrumMachine;
