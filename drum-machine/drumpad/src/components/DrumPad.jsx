import React, { useState, useCallback, useEffect } from 'react';

const DrumPad = () => {
  // Define drum sounds with their respective keys and audio files
  const drums = [
    { key: 'Q', label: 'Kick', color: 'bg-blue-500', sound: '/drums/kick.mp3' },
    { key: 'W', label: 'Snare', color: 'bg-red-500', sound: '/drums/snare.mp3' },
    { key: 'E', label: 'Hi-Hat', color: 'bg-green-500', sound: '/drums/hihat.mp3' },
    { key: 'A', label: 'Tom 1', color: 'bg-yellow-500', sound: '/drums/tom1.mp3' },
    { key: 'S', label: 'Tom 2', color: 'bg-purple-500', sound: '/drums/tom2.mp3' },
    { key: 'D', label: 'Crash', color: 'bg-pink-500', sound: '/drums/crash.mp3' },
    { key: 'Z', label: 'Clap', color: 'bg-orange-500', sound: '/drums/clap.mp3' },
    { key: 'X', label: 'Rim', color: 'bg-teal-500', sound: '/drums/rim.mp3' },
    { key: 'C', label: 'Ride', color: 'bg-indigo-500', sound: '/drums/ride.mp3' }
  ];

  // Create audio elements for each drum
  const [audioElements, setAudioElements] = useState({});
  const [activePads, setActivePads] = useState({});

  // Initialize audio elements
  useEffect(() => {
    const audioObj = {};
    drums.forEach(({ key, sound }) => {
      const audio = new Audio(sound);
      audio.preload = 'auto';
      audioObj[key] = audio;
    });
    setAudioElements(audioObj);
  }, []);

  // Play sound and show visual feedback
  const playSound = useCallback((key) => {
    if (audioElements[key]) {
      // Reset audio to start if it's already playing
      audioElements[key].currentTime = 0;
      audioElements[key].play();
      
      // Visual feedback
      setActivePads(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setActivePads(prev => ({ ...prev, [key]: false }));
      }, 100);
    }
  }, [audioElements]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (drums.some(drum => drum.key === key)) {
        playSound(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playSound]);

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-xl max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-4">
        {drums.map(({ key, label, color }) => (
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
      <p className="text-center mt-6 text-gray-600">
        Press keys or click pads to play
      </p>
    </div>
  );
};

export default DrumPad;