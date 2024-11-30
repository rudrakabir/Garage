import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Plus, X, Volume2, Settings } from 'lucide-react';

// Constants
const STEPS = 16;
const TRACKS = 8;
const CATEGORIES = {
  'Kicks': ['Kick_', 'Drill_Bass'],
  'Snares': ['Snare_'],
  'Claps': ['Clap_'],
  'Hats': ['Hat_'],
  'Percs': ['Perc_', 'Rim_', 'Tom_', 'Drill_'],
  'Effects': ['Fill_', 'Glitch_'],
  'Loops': ['Loop_']
};

const DrumMachine = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [availableSounds, setAvailableSounds] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [sequence, setSequence] = useState(
    Array(TRACKS).fill().map(() => Array(STEPS).fill(false))
  );

  const intervalRef = useRef(null);

  // Initialize tracks
  useEffect(() => {
    setTracks(Array(TRACKS).fill().map(() => ({
      sound: '',
      volume: 0.7,
      mute: false
    })));
  }, []);

  // Sound loading and categorization
  const loadAvailableSounds = useCallback(() => {
    const soundFiles = [
      'Clap_GranularStack.mp3', 'Clap_MS20.mp3', 'Clap_Stack 1.mp3',
      'Kick_Angry.mp3', 'Kick_Boring.mp3', 'Kick_Bouncy.mp3',
      'Snare_Modular 1.mp3', 'Snare_boing 2.mp3', 'Snare_Granular 1.mp3',
      'Hat_Closed.mp3', 'Hat_Crack.mp3', 'Hat_Dirt.mp3',
      // Add your complete sound list here
    ];

    const categorizedSounds = {};
    Object.entries(CATEGORIES).forEach(([category, prefixes]) => {
      categorizedSounds[category] = soundFiles.filter(sound => 
        prefixes.some(prefix => sound.startsWith(prefix))
      );
    });
    setAvailableSounds(categorizedSounds);
  }, []);

  useEffect(() => {
    loadAvailableSounds();
  }, [loadAvailableSounds]);

  // Sequencer logic
  const startSequencer = useCallback(() => {
    if (intervalRef.current) return;
    
    const interval = (60 / bpm) * 1000 / 4;
    
    intervalRef.current = setInterval(() => {
      setCurrentStep(step => (step + 1) % STEPS);
    }, interval);
  }, [bpm]);

  const stopSequencer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startSequencer();
    } else {
      stopSequencer();
      setCurrentStep(0);
    }
    return () => stopSequencer();
  }, [isPlaying, startSequencer, stopSequencer]);

  // Sound triggering
  useEffect(() => {
    tracks.forEach((track, trackIndex) => {
      if (track.sound && sequence[trackIndex][currentStep] && !track.mute) {
        const audio = new Audio(`/audio/drums2/${track.sound}`);
        audio.volume = track.volume;
        audio.play().catch(error => console.error('Audio playback failed:', error));
      }
    });
  }, [currentStep, sequence, tracks]);

  // Track management functions
  const toggleStep = (trackIndex, stepIndex) => {
    const newSequence = [...sequence];
    newSequence[trackIndex] = [...newSequence[trackIndex]];
    newSequence[trackIndex][stepIndex] = !newSequence[trackIndex][stepIndex];
    setSequence(newSequence);
  };

  const updateTrackSound = (trackIndex, soundFile) => {
    const newTracks = [...tracks];
    newTracks[trackIndex] = { ...newTracks[trackIndex], sound: soundFile };
    setTracks(newTracks);
    setShowSoundPicker(false);
  };

  const updateTrackVolume = (trackIndex, volume) => {
    const newTracks = [...tracks];
    newTracks[trackIndex] = { ...newTracks[trackIndex], volume: volume };
    setTracks(newTracks);
  };

  const toggleTrackMute = (trackIndex) => {
    const newTracks = [...tracks];
    newTracks[trackIndex] = { ...newTracks[trackIndex], mute: !newTracks[trackIndex].mute };
    setTracks(newTracks);
  };

  return (
    <div className={`drum-machine p-6 rounded-2xl ${isPlaying ? 'playing' : ''}`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="control-button p-3 rounded-xl bg-blue-500 hover:bg-blue-600"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="bpm-input w-20 px-3 py-2 bg-studio-700 rounded-lg font-lcd text-center"
              min="60"
              max="200"
            />
            <span className="text-studio-300 font-lcd">BPM</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {Array(TRACKS).fill().map((_, trackIndex) => (
          <div key={trackIndex} className="flex items-center space-x-2 mb-2">
            <div className="w-40 flex items-center justify-between px-2 bg-studio-700 rounded-lg">
              <button 
                onClick={() => {
                  setSelectedTrack(trackIndex);
                  setShowSoundPicker(true);
                }}
                className="track-name text-sm truncate text-left flex-1 py-2"
              >
                {tracks[trackIndex].sound || 'Select Sound'}
              </button>
            </div>
            <div className="flex-1 grid grid-cols-16 gap-1">
              {sequence[trackIndex].map((isActive, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(trackIndex, stepIndex)}
                  className={`step-button w-full aspect-square rounded-lg ${
                    isActive ? 'active' : ''
                  } ${currentStep === stepIndex ? 'current' : ''}`}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleTrackMute(trackIndex)}
                className={`control-button p-1 rounded-lg ${
                  tracks[trackIndex].mute ? 'opacity-50' : ''
                }`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tracks[trackIndex].volume}
                onChange={(e) => updateTrackVolume(trackIndex, parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
          </div>
        ))}
      </div>

      {showSoundPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm">
          <div className="drum-machine w-96 max-h-[80vh] overflow-y-auto p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="track-name text-lg font-bold">Select Sound</h3>
              <button 
                onClick={() => setShowSoundPicker(false)}
                className="control-button p-2 hover:bg-studio-700 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            {Object.entries(availableSounds).map(([category, sounds]) => (
              <div key={category} className="mb-4">
                <h4 className="track-name font-bold mb-2">{category}</h4>
                <div className="space-y-1">
                  {sounds.map((sound) => (
                    <button
                      key={sound}
                      onClick={() => updateTrackSound(selectedTrack, sound)}
                      className="w-full text-left px-3 py-2 hover:bg-studio-700 rounded-lg transition-colors"
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