import React, { useState, useRef } from 'react';
import { Play, Pause, RotateCw, Volume2, VolumeX } from 'lucide-react';

const NOTES = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'G3': 196.00, 'A3': 220.00,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00
};

const SHANTY_SCALE = ['C3', 'E3', 'G3', 'A3', 'C4', 'D4', 'E4', 'G4'];

// Styled Card components using new CSS patterns
const Card = ({ children, className = '' }) => (
  <div className={`shanty-card bg-white rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="p-4 border-b border-gray-200">{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-gray-800 ${className}`}>{children}</h2>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
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

  // Audio initialization and playback logic remains the same
  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 0.5;
        gainNodeRef.current.connect(audioContextRef.current.destination);
        setIsInitialized(true);
        generateNewPattern();
        setErrorMessage('');
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (error) {
      setErrorMessage(`Audio initialization failed: ${error.message}`);
    }
  };

  const generateNewPattern = () => {
    const newPattern = Array.from({ length: 8 }, () => 
      SHANTY_SCALE[Math.floor(Math.random() * SHANTY_SCALE.length)]
    );
    setPattern(newPattern);
  };

  const playNote = async (noteName) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    
    try {
      const freq = NOTES[noteName];
      if (!Number.isFinite(freq)) return;

      const oscillator = audioContextRef.current.createOscillator();
      const noteGain = audioContextRef.current.createGain();
      const oscillator2 = audioContextRef.current.createOscillator();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, audioContextRef.current.currentTime);
      
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(freq * 1.01, audioContextRef.current.currentTime);
      
      const now = audioContextRef.current.currentTime;
      
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      noteGain.gain.linearRampToValueAtTime(0.2, now + 0.1);
      noteGain.gain.linearRampToValueAtTime(0, now + 0.4);
      
      oscillator.connect(noteGain);
      oscillator2.connect(noteGain);
      noteGain.connect(gainNodeRef.current);
      
      oscillator.start(now);
      oscillator2.start(now);
      oscillator.stop(now + 0.5);
      oscillator2.stop(now + 0.5);
      
      oscillator.onended = () => {
        oscillator.disconnect();
        oscillator2.disconnect();
        noteGain.disconnect();
      };
    } catch (error) {
      setErrorMessage(`Error playing note: ${error.message}`);
    }
  };

  const togglePlay = async () => {
    try {
      if (!isInitialized) {
        await initAudio();
      }
      
      if (isPlaying) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPlaying(false);
        setCurrentNote(null);
      } else {
        let noteIndex = 0;
        
        const playNextNote = () => {
          const note = pattern[noteIndex];
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
      setErrorMessage(`Playback error: ${error.message}`);
    }
  };

  const toggleMute = () => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0.5 : 0;
      setIsMuted(!isMuted);
    }
  };

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
    <div className="shanty-container">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Digital Sea Shanty Generator
            <div className="shanty-controls">
              <button 
                onClick={generateNewPattern}
                className="control-btn p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Generate new pattern"
              >
                <RotateCw className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={toggleMute}
                className="control-btn p-2 rounded-full hover:bg-gray-100 transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? 
                  <VolumeX className="w-5 h-5 text-gray-600" /> : 
                  <Volume2 className="w-5 h-5 text-gray-600" />
                }
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            {errorMessage && (
              <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded-md w-full">
                {errorMessage}
              </div>
            )}
            
            <button
              onClick={togglePlay}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                       transition-colors flex items-center space-x-2 shadow-md"
            >
              {isPlaying ? 
                <Pause className="w-5 h-5" /> : 
                <Play className="w-5 h-5" />
              }
              <span className="font-medium">{isPlaying ? 'Stop' : 'Play'} Shanty</span>
            </button>
            
            <div className="grid grid-cols-4 gap-3 w-full">
              {pattern.map((note, i) => (
                <div
                  key={i}
                  className={`p-3 text-center rounded-md transition-colors duration-200
                            ${note === currentNote
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700'}`}
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShantyGenerator;