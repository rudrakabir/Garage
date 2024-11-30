import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const RhythmicTextSynth = () => {
  // State declarations remain the same...

  return (
    <div className="synth-container">
      <div className="synth-panel">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Rhythmic Text Synthesizer</h2>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Type or paste your text here..."
        />
        
        <div className="mt-6 space-y-4">
          <div className="rhythmic-controls">
            <label className="text-sm text-gray-600">Tempo</label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="tempo-slider"
            />
            <span className="text-sm text-gray-600">{tempo} BPM</span>
          </div>
        </div>
        
        <div className="control-panel">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (!isPlaying) {
                  setIsPlaying(true);
                  playText();
                } else {
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                }
              }}
              className="control-button play-button"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="control-button utility-button"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="rhythm-info">
        <p>🎵 Each word's rhythm matches its syllables</p>
        <p>❗ Questions rise in pitch</p>
        <p>✨ Natural speech patterns create the rhythm</p>
        <p>Try typing: "How are you today?" vs "I am fine!"</p>
      </div>
    </div>
  );
};

export default RhythmicTextSynth;