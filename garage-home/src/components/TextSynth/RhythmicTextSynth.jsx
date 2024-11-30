import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX  } from 'lucide-react';

const RhythmicTextSynth = () => {
  const [text, setText] = useState("The quick brown fox jumps over the lazy dog!");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [tempo, setTempo] = useState(120);
  const audioContextRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Simple syllable counting (can be made more sophisticated)
  const countSyllables = (word) => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    return word.match(/[aeiouy]{1,2}/g)?.length || 1;
  };

  // Base note durations in seconds
  const getNoteParameters = (word, isLastInSentence = false) => {
    const syllables = countSyllables(word);
    const baseDuration = Math.max(0.1, 60 / tempo); // Ensure minimum duration
    
    switch(syllables) {
      case 1:
        return {
          duration: baseDuration,
          pattern: [{time: 0, length: baseDuration, accent: 1}]
        };
      case 2:
        return {
          duration: baseDuration,
          pattern: [
            {time: 0, length: Math.max(0.1, baseDuration * 0.6), accent: 1.2},
            {time: Math.max(0, baseDuration * 0.6), length: Math.max(0.1, baseDuration * 0.4), accent: 0.8}
          ]
        };
      case 3:
        return {
          duration: baseDuration,
          pattern: [
            {time: 0, length: Math.max(0.1, baseDuration * 0.4), accent: 1.2},
            {time: Math.max(0, baseDuration * 0.4), length: Math.max(0.1, baseDuration * 0.3), accent: 0.8},
            {time: Math.max(0, baseDuration * 0.7), length: Math.max(0.1, baseDuration * 0.3), accent: 0.9}
          ]
        };
      default:
        const subDuration = Math.max(0.1, baseDuration / syllables);
        return {
          duration: baseDuration,
          pattern: Array.from({length: syllables}, (_, i) => ({
            time: i * subDuration,
            length: subDuration,
            accent: i === 0 ? 1.2 : 0.9
          }))
        };
    }
};

  // Musical scales with more varied notes
  const scales = {
    main: [
      261.63, // C4
      293.66, // D4
      329.63, // E4
      349.23, // F4
      392.00, // G4
      440.00, // A4
      493.88  // B4
    ],
    question: [
      392.00, // G4
      440.00, // A4
      493.88, // B4
      523.25, // C5
      587.33  // D5
    ]
  };

  const playWord = async (word, isQuestion = false, isLastWord = false) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const params = getNoteParameters(word, isLastWord);
    const scale = isQuestion ? scales.question : scales.main;
    
    // Generate a base frequency from the first letter
    const baseIndex = Math.max(0, (word.charCodeAt(0) - 97)) % scale.length;
    
    // Play each syllable
    for (const part of params.pattern) {
      if (!isPlayingRef.current) break;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      const frequency = scale[(baseIndex + Math.floor(part.time)) % scale.length];
      oscillator.frequency.value = isQuestion ? 
        frequency * (1 + (part.time/params.duration || 0) * 0.2) : // Added fallback for division
        frequency;
      
      oscillator.type = 'sine';
      
      // Make sure we have valid timing values
      const currentTime = audioContextRef.current.currentTime;
      const attackTime = Math.max(0.02, currentTime + 0.02); // Ensure positive time
      const releaseTime = Math.max(attackTime + 0.01, currentTime + part.length); // Ensure valid duration

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(
        Math.min(0.2 * (part.accent || 1) * (isMuted ? 0 : 1), 1), // Clamp maximum gain
        attackTime
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        releaseTime
      );
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.start(currentTime);
      oscillator.stop(releaseTime);
      
      await new Promise(resolve => setTimeout(resolve, Math.max(1, part.length * 1000)));
    }

    // Add a small pause between words
    await new Promise(resolve => setTimeout(resolve, 50));
};

  const playText = async () => {
    isPlayingRef.current = true;
    
    const sentences = text.toLowerCase().split(/([.!?]+)/g);
    
    for (let i = 0; i < sentences.length && isPlayingRef.current; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      const isQuestion = sentence.includes('?');
      const words = sentence.split(/\s+/);
      
      for (let j = 0; j < words.length && isPlayingRef.current; j++) {
        const word = words[j].replace(/[^a-z]/g, '');
        if (!word) continue;
        
        await playWord(
          word,
          isQuestion,
          j === words.length - 1
        );
      }
      
      // Pause between sentences
      if (isPlayingRef.current) {
        await new Promise(resolve => 
          setTimeout(resolve, (60 / tempo) * 1000)
        );
      }
    }
    
    setIsPlaying(false);
    isPlayingRef.current = false;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Rhythmic Text Synthesizer</h2>
        
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Type or paste your text here..."
        />
        
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">Tempo</label>
            <input
              type="range"
              min="60"
              max="200"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="flex-grow"
            />
            <span className="text-sm text-gray-600">{tempo} BPM</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
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
              className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-1">
        <p>🎵 Each word's rhythm matches its syllables</p>
        <p>❗ Questions rise in pitch</p>
        <p>✨ Natural speech patterns create the rhythm</p>
        <p>Try typing: "How are you today?" vs "I am fine!"</p>
      </div>
    </div>
  );
};

export default RhythmicTextSynth;