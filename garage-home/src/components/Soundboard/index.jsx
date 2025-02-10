import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import SoundButton from './SoundButton';
import { getDisplayName, isAudioFile, sortFiles } from './utils';

const Soundboard = () => {
  const [sounds, setSounds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSounds = async () => {
      try {
        // List all files in the public/sounds directory
        console.log('Loading sounds...');
        const response = await window.fs.readdir('/Users/rudrakabir/Desktop/Garage/garage-home/public/sounds');
        console.log('Found files:', response);
        
        // Filter audio files and create sound objects
        const soundFiles = response
          .filter(file => isAudioFile(file))
          .map(file => ({
            name: getDisplayName(file),
            url: `/Users/rudrakabir/Desktop/Garage/garage-home/public/sounds/${file}`
          }));

        // Sort sounds alphabetically
        const sortedSounds = soundFiles.sort((a, b) => a.name.localeCompare(b.name));
        
        setSounds(sortedSounds);
      } catch (error) {
        console.error('Error loading sounds:', error);
        setSounds([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadSounds();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Soundboard</h1>
        <p className="text-zinc-400 mb-2">
          Drop MP3 or WAV files in the /public/sounds directory to add them to the soundboard.
        </p>
        <p className="text-xs text-zinc-500">
          Note: You'll need to restart the development server after adding new files.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sounds.map((sound) => (
          <SoundButton
            key={sound.name}
            name={sound.name}
            soundUrl={sound.url}
          />
        ))}
      </div>
    </div>
  );
};

export default Soundboard;