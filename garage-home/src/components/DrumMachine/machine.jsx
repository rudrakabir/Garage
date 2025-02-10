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
      'Hat_Closed.mp3', 'Hat_Crack.mp3', 'Hat_Dirt.mp3'
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
    
    const interval = (60 / bpm) * 1000 / 4; // Convert BPM to milliseconds per 16th note
    
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
    // Play sound preview
    const audio = new Audio(`/audio/drums2/${soundFile}`);
    audio.volume = tracks[trackIndex].volume;
    audio.play().catch(error => console.error('Audio preview failed:', error));
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
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="p-6 bg-white shadow-lg rounded-xl border border-gray-200">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-20 px-3 py-2 bg-gray-100 rounded-lg text-center text-gray-900 border border-gray-300"
                min="60"
                max="200"
              />
              <span className="text-gray-600">BPM</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {Array(TRACKS).fill().map((_, trackIndex) => (
            <div key={trackIndex} className="flex items-center space-x-2 mb-2">
              <div className="w-40 flex items-center justify-between px-2 bg-gray-100 rounded-lg border border-gray-200">
                <button 
                  onClick={() => {
                    setSelectedTrack(trackIndex);
                    setShowSoundPicker(true);
                  }}
                  className="text-sm truncate text-left flex-1 py-2 text-gray-900 hover:text-blue-600 transition-colors"
                >
                  {tracks[trackIndex].sound || 'Select Sound'}
                </button>
              </div>
              <div className="flex-1 grid grid-cols-8 lg:grid-cols-16 gap-1">
                {sequence[trackIndex].map((isActive, stepIndex) => (
                  <button
                    key={stepIndex}
                    onClick={() => toggleStep(trackIndex, stepIndex)}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      isActive ? 'bg-blue-500' : 'bg-gray-200'
                    } ${currentStep === stepIndex ? 'ring-2 ring-blue-500' : ''} 
                    hover:bg-blue-400`}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleTrackMute(trackIndex)}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    tracks[trackIndex].mute ? 'opacity-50' : ''
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-gray-700" />
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
      </div>

      {showSoundPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center backdrop-blur-sm z-50">
          <div className="bg-white w-96 max-h-[80vh] overflow-y-auto p-6 rounded-xl shadow-xl">
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
              <div key={category} className="mb-4">
                <h4 className="font-bold mb-2 text-gray-900">{category}</h4>
                <div className="space-y-1">
                  {sounds.map((sound) => (
                    <button
                      key={sound}
                      onClick={() => updateTrackSound(selectedTrack, sound)}
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