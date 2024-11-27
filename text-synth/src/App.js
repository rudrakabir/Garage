import React, { useState } from 'react';
import RhythmicTextSynth from './components/RhythmicTextSynth';
import TextSynth from './components/TextSynth';

function App() {
  const [mode, setMode] = useState('rhythmic'); // or 'simple'

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex justify-center space-x-4">
          <button
            onClick={() => setMode('rhythmic')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'rhythmic' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700'
            }`}
          >
            Rhythmic Synth
          </button>
          <button
            onClick={() => setMode('simple')}
            className={`px-4 py-2 rounded-lg ${
              mode === 'simple' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-700'
            }`}
          >
            Simple Synth
          </button>
        </div>

        {mode === 'rhythmic' ? <RhythmicTextSynth /> : <TextSynth />}
      </div>
    </div>
  );
}

export default App;