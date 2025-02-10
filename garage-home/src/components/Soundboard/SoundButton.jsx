import React, { useState } from 'react';
import { Play, Square } from 'lucide-react';

const SoundButton = ({ name, soundUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);

  React.useEffect(() => {
    const newAudio = new Audio(soundUrl);
    newAudio.addEventListener('loadeddata', () => {
      console.log('Audio loaded:', soundUrl);
    });
    newAudio.addEventListener('error', (e) => {
      console.error('Error loading audio:', soundUrl, e);
    });
    setAudio(newAudio);
    return () => {
      newAudio.pause();
      newAudio.src = '';
    };
  }, [soundUrl]);

  const handlePlay = () => {
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(error => console.error('Error playing sound:', error));
    }
  };

  // When the sound ends, reset the button state
  audio.onended = () => setIsPlaying(false);

  return (
    <button
      onClick={handlePlay}
      className="flex items-center justify-center gap-2 p-4 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors relative group"
    >
      {isPlaying ? (
        <Square size={20} className="text-red-400" />
      ) : (
        <Play size={20} />
      )}
      <span className="text-sm truncate">{name}</span>
    </button>
  );
};

export default SoundButton;