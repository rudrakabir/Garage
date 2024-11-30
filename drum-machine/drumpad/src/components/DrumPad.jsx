import React, { useState, useCallback, useEffect } from 'react';

// Move drums array outside component
const DRUMS = [
  { key: 'Q', label: 'Kick', color: 'bg-blue-500', sound: '/drumpad/drums/kick.mp3' },
  { key: 'W', label: 'Snare', color: 'bg-red-500', sound: '/drumpad/drums/snare.mp3' },
  { key: 'E', label: 'Hi-Hat', color: 'bg-green-500', sound: '/drumpad/drums/hihat.mp3' },
  { key: 'A', label: 'Tom 1', color: 'bg-yellow-500', sound: '/drumpad/drums/tom1.mp3' },
  { key: 'S', label: 'Tom 2', color: 'bg-purple-500', sound: '/drumpad/drums/tom2.mp3' },
  { key: 'D', label: 'Crash', color: 'bg-pink-500', sound: '/drumpad/drums/crash.mp3' },
  { key: 'Z', label: 'Clap', color: 'bg-orange-500', sound: '/drumpad/drums/clap.mp3' },
  { key: 'X', label: 'Rim', color: 'bg-teal-500', sound: '/drumpad/drums/rim.mp3' },
  { key: 'C', label: 'Ride', color: 'bg-indigo-500', sound: '/drumpad/drums/ride.mp3' }
];

const DrumPad = () => {
  const [audioElements, setAudioElements] = useState({});
  const [activePads, setActivePads] = useState({});
  const [lastPlayed, setLastPlayed] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingErrors, setLoadingErrors] = useState([]);

  useEffect(() => {
    const audioObj = {};
    const errors = [];
    let loadedCount = 0;

    DRUMS.forEach(({ key, sound, label }) => {
      const audio = new Audio(sound);
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        loadedCount++;
        if (loadedCount === DRUMS.length) {
          setIsLoading(false);
        }
      }, { once: true });

      audio.addEventListener('error', () => {
        errors.push(`Failed to load ${label} (${sound})`);
        setLoadingErrors(prev => [...prev, `Failed to load ${label} (${sound})`]);
      }, { once: true });

      audioObj[key] = audio;
    });

    setAudioElements(audioObj);

    return () => {
      Object.values(audioObj).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []); // Empty dependency array is fine now since DRUMS is constant and outside component

  const playSound = useCallback((key) => {
    if (audioElements[key]) {
      audioElements[key].currentTime = 0;
      audioElements[key].play().catch(error => {
        console.error(`Error playing sound for key ${key}:`, error);
      });
      
      setActivePads(prev => ({ ...prev, [key]: true }));
      setLastPlayed(DRUMS.find(d => d.key === key)?.label || '');
      
      setTimeout(() => {
        setActivePads(prev => ({ ...prev, [key]: false }));
      }, 100);
    }
  }, [audioElements]); // Only audioElements needed now

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (DRUMS.some(drum => drum.key === key)) {
        playSound(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound]); // Only playSound needed now

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg shadow-xl max-w-2xl mx-auto">
        <p className="text-center text-gray-600">Loading drum sounds...</p>
        {loadingErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-100 rounded-lg">
            <p className="text-red-600 font-semibold">Loading Errors:</p>
            <ul className="list-disc pl-5">
              {loadingErrors.map((error, index) => (
                <li key={index} className="text-red-500">{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-xl max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {DRUMS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => playSound(key)}
            className={`
              ${color} 
              ${activePads[key] ? 'opacity-70 scale-95' : 'opacity-100'}
              h-24 rounded-lg shadow-lg
              flex flex-col items-center justify-center
              text-white font-bold
              transition-all duration-100
              hover:opacity-90 hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
          >
            <span className="text-2xl mb-1">{key}</span>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>
      <div className="text-center mt-6">
        <p className="text-gray-600 mb-2">
          Press keys or click pads to play
        </p>
        {lastPlayed && (
          <p className="text-lg font-semibold text-blue-600">
            Last played: {lastPlayed}
          </p>
        )}
      </div>
    </div>
  );
};

export default DrumPad;