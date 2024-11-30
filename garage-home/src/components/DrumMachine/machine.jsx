import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, RotateCcw } from 'lucide-react';

const STEPS = 16;
const INITIAL_BPM = 120;

// We'll start with 8 core sounds from your pack
const TRACKS = [
  { name: 'Kick', sound: './audio/drums2/Kick_FunHaus Normal.mp3' },
  { name: 'Snare', sound: './audio/drums2/Snare_Modular 1.mp3' },
  { name: 'Clap', sound: './audio/drums2/Clap_Stack 1.mp3' },
  { name: 'Hat Closed', sound: './audio/drums2/Hat_Closed.mp3' },
  { name: 'Hat Future', sound: './audio/drums2/Hat_Future.mp3' },
  { name: 'Tom', sound: './audio/drums2/Tom_Tight.mp3' },
  { name: 'Perc 1', sound: './audio/drums2/Perc_Metal Bar.mp3' },
  { name: 'Perc 2', sound: './audio/drums2/Perc_Cyborg.mp3' },
];

const DrumMachine = () => {
  const [pattern, setPattern] = useState(
    TRACKS.map(() => Array(STEPS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(INITIAL_BPM);
  
  const audioContext = useRef(null);
  const buffers = useRef({});
  const nextStepTime = useRef(0);
  const timerID = useRef(null);
  const playing = useRef(false);

  // Initialize Web Audio and load samples
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio context created:', audioContext.current.state);
        
        // Load all samples
        for (const track of TRACKS) {
          try {
            console.log('Loading sample:', track.sound);
            const response = await fetch(track.sound);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContext.current.decodeAudioData(arrayBuffer);
            buffers.current[track.sound] = audioBuffer;
            console.log('Sample loaded successfully:', track.sound);
          } catch (error) {
            console.error('Error loading sample:', track.sound, error);
          }
        }
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Schedule ahead time and interval duration (in seconds)
  const SCHEDULE_AHEAD_TIME = 0.1;
  const CHECK_INTERVAL = 50; // milliseconds
  
  // Schedule the next step
  const scheduleStep = useCallback(() => {
    const currentTime = audioContext.current.currentTime;
    const secondsPerBeat = 60.0 / bpm;
    const secondsPerStep = secondsPerBeat / 4; // 16th notes
    
    while (nextStepTime.current < currentTime + SCHEDULE_AHEAD_TIME) {
      pattern.forEach((track, trackIndex) => {
        if (track[currentStep]) {
          const source = audioContext.current.createBufferSource();
          source.buffer = buffers.current[TRACKS[trackIndex].sound];
          
          // Create a gain node for each sound
          const gainNode = audioContext.current.createGain();
          gainNode.connect(audioContext.current.destination);
          source.connect(gainNode);
          
          // Prevent clicks by applying a tiny fade
          gainNode.gain.setValueAtTime(0, nextStepTime.current);
          gainNode.gain.linearRampToValueAtTime(1, nextStepTime.current + 0.005);
          gainNode.gain.linearRampToValueAtTime(0, nextStepTime.current + secondsPerStep);
          
          source.start(nextStepTime.current);
          source.stop(nextStepTime.current + secondsPerStep);
        }
      });
      
      nextStepTime.current += secondsPerStep;
      setCurrentStep((curr) => (curr + 1) % STEPS);
    }
  }, [pattern, currentStep, bpm]);

  // Timer loop
  const scheduler = useCallback(() => {
    scheduleStep();
    timerID.current = setTimeout(scheduler, CHECK_INTERVAL);
  }, [scheduleStep]);
  
  // Play/Stop controls
  const togglePlay = () => {
    if (isPlaying) {
      clearTimeout(timerID.current);
      setIsPlaying(false);
      playing.current = false;
    } else {
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      setIsPlaying(true);
      playing.current = true;
      nextStepTime.current = audioContext.current.currentTime;
      scheduler();
    }
    
  };

  // Reset pattern
  const clearPattern = () => {
    setPattern(TRACKS.map(() => Array(STEPS).fill(false)));
  };

  // Toggle step in pattern
  const toggleStep = (trackIndex, stepIndex) => {
    const newPattern = [...pattern];
    newPattern[trackIndex] = [...newPattern[trackIndex]];
    newPattern[trackIndex][stepIndex] = !newPattern[trackIndex][stepIndex];
    setPattern(newPattern);
  };

  return (
    <div className="drum-machine p-6 rounded-lg shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={togglePlay}
          className="control-button p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isPlaying ? <Square size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={clearPattern}
          className="control-button p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white"
        >
          <RotateCcw size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-white">BPM:</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="bpm-input w-20 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700"
            min="60"
            max="200"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {pattern.map((track, trackIndex) => (
          <div key={trackIndex} className="flex items-center gap-4">
            <div className="track-name w-24 text-white font-medium">{TRACKS[trackIndex].name}</div>
            <div className="grid grid-cols-16 gap-2 flex-1">
              {track.map((isActive, stepIndex) => (
                <button
                  key={stepIndex}
                  onClick={() => toggleStep(trackIndex, stepIndex)}
                  className={`
                    step-button w-full aspect-square rounded
                    ${isActive ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}
                    ${currentStep === stepIndex ? 'border-2 border-white' : ''}
                    transition-colors duration-100
                  `}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DrumMachine;