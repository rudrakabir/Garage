import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCw, Volume2, VolumeX } from 'lucide-react';

const NOTES = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'G3': 196.00, 'A3': 220.00,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00
};

const SHANTY_SCALE = ['C3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4'];


// Rest of the code stays exactly the same...


const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-lg ${className}`}>{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="p-4 border-b">{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold ${className}`}>{children}</h2>
);

const CardContent = ({ children }) => (
  <div className="p-4">{children}</div>
);

const ShantyGenerator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [pattern, setPattern] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const intervalRef = useRef(null);

  const initAudio = async () => {
    try {
      console.log("Initializing audio...");
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext state:", audioContextRef.current.state);
        
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 0.5;
        gainNodeRef.current.connect(audioContextRef.current.destination);
        
        setIsInitialized(true);
        generateNewPattern();
        setErrorMessage('');
        console.log("Audio initialization successful!");
      }
      
      if (audioContextRef.current.state === 'suspended') {
        console.log("Resuming audio context...");
        await audioContextRef.current.resume();
        console.log("Audio context resumed!");
      }
    } catch (error) {
      console.error('Audio initialization error:', error);
      setErrorMessage(`Audio initialization failed: ${error.message}`);
    }
  };

  const generateNewPattern = () => {
    const newPattern = Array.from({ length: 8 }, () => {
      return SHANTY_SCALE[Math.floor(Math.random() * SHANTY_SCALE.length)];
    });
    setPattern(newPattern);
    console.log("New pattern generated:", newPattern);
  };

  const playNote = async (noteName) => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      console.error("Audio context or gain node not initialized");
      return;
    }
    
    try {
      const freq = NOTES[noteName];
      console.log(`Playing note: ${noteName}, frequency: ${freq}`);
      
      if (!Number.isFinite(freq)) {
        console.error("Invalid frequency for note:", noteName);
        return;
      }

      const oscillator = audioContextRef.current.createOscillator();
      const noteGain = audioContextRef.current.createGain();
      
      // Create a richer sound with two oscillators
      const oscillator2 = audioContextRef.current.createOscillator();
      
      // Main tone settings
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
      
      // Secondary tone for richness (slight detuning)
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(freq * 1.01, audioContextRef.current.currentTime);
      
      const now = audioContextRef.current.currentTime;
      
      // Smoother envelope
      noteGain.gain.setValueAtTime(0, now);
      // Attack
      noteGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      // Decay
      noteGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      // Release (using linearRamp instead of exponential)
      noteGain.gain.linearRampToValueAtTime(0, now + 0.4);
      
      // Connect everything
      oscillator.connect(noteGain);
      oscillator2.connect(noteGain);
      noteGain.connect(gainNodeRef.current);
      
      console.log("Starting oscillators...");
      oscillator.start(now);
      oscillator2.start(now);
      oscillator.stop(now + 0.5);
      oscillator2.stop(now + 0.5);
      
      oscillator.onended = () => {
        console.log(`Note ${noteName} ended`);
        oscillator.disconnect();
        oscillator2.disconnect();
        noteGain.disconnect();
      };
    } catch (error) {
      console.error('Error playing note:', error);
      setErrorMessage(`Error playing note: ${error.message}`);
    }
  };

  const togglePlay = async () => {
    try {
      console.log("Toggle play clicked, current state:", isPlaying);
      
      if (!isInitialized) {
        console.log("Initializing audio for first play...");
        await initAudio();
      }
      
      if (isPlaying) {
        console.log("Stopping playback...");
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        setCurrentNote(null);
      } else {
        console.log("Starting playback...");
        let noteIndex = 0;
        
        const playNextNote = () => {
          const note = pattern[noteIndex];
          console.log(`Playing note index ${noteIndex}:`, note);
          setCurrentNote(note);
          if (!isMuted) {
            playNote(note);
          }
          noteIndex = (noteIndex + 1) % pattern.length;
        };
        
        playNextNote();
        intervalRef.current = setInterval(playNextNote, 500);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error in togglePlay:", error);
      setErrorMessage(`Playback error: ${error.message}`);
    }
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0.5 : 0;
      setIsMuted(!isMuted);
      console.log("Mute toggled:", !isMuted);
    }
  };

  // Component cleanup
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Digital Sea Shanty Generator
          <div className="flex gap-2">
            <button 
              onClick={generateNewPattern}
              className="p-2 rounded-full hover:bg-gray-100"
              title="Generate new pattern"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-gray-100"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {errorMessage && (
            <div className="text-red-500 text-sm mb-2">
              {errorMessage}
            </div>
          )}
          
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Stop' : 'Play'} Shanty</span>
          </button>
          
          <div className="grid grid-cols-4 gap-2 w-full">
            {pattern.map((note, i) => (
              <div
                key={i}
                className={`p-2 text-center rounded transition-colors duration-200 ${
                  note === currentNote
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShantyGenerator;