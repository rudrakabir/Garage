import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Save, Upload } from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

const TextSynth = () => {
  const [text, setText] = useState("Type a message and press play!");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [tempo, setTempo] = useState(200);
  const [key, setKey] = useState('major');
  const [currentNote, setCurrentNote] = useState(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isPlayingRef = useRef(false);

  // Music theory scales
  const scales = {
    major: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88],
    minor: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16],
    pentatonic: [261.63, 293.66, 329.63, 392.00, 440.00],
  };

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.connect(audioContextRef.current.destination);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // Audio visualization functions
  const drawVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);
    
    ctx.fillStyle = 'rgb(14, 165, 233)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(255, 255, 255)';
    ctx.beginPath();
    
    const sliceWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    if (currentNote) {
      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.fillText(currentNote, width / 2 - 20, height - 20);
    }
    
    animationFrameRef.current = requestAnimationFrame(drawVisualization);
  };

  const playNote = async (char) => {
    if (!audioContextRef.current) return;
    
    const charCode = char.toUpperCase().charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      const currentScale = scales[key];
      const noteIndex = (charCode - 65) % currentScale.length;
      const frequency = currentScale[noteIndex];
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.value = isMuted ? 0 : 0.15;
      
      oscillator.connect(gainNode);
      gainNode.connect(analyserRef.current);
      
      setCurrentNote(char);
      oscillator.start();
      await new Promise(resolve => setTimeout(resolve, 60000 / tempo));
      oscillator.stop();
      setCurrentNote(null);
    } else if (char === ' ' || char === '.' || char === ',') {
      await new Promise(resolve => setTimeout(resolve, 60000 / tempo));
    }
  };

  const playText = async () => {
    isPlayingRef.current = true;
    drawVisualization();
    
    for (let i = 0; i < text.length && isPlayingRef.current; i++) {
      await playNote(text[i]);
    }
    
    setIsPlaying(false);
    isPlayingRef.current = false;
    cancelAnimationFrame(animationFrameRef.current);
  };

  const saveMelody = () => {
    const melodyData = {
      text,
      tempo,
      key,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(melodyData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-melody.json';
    a.click();
  };

  const loadMelody = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const melodyData = JSON.parse(e.target.result);
          setText(melodyData.text);
          setTempo(melodyData.tempo);
          setKey(melodyData.key);
        } catch (error) {
          console.error('Error loading melody:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">Text Synthesizer</h2>
          
          <canvas
            ref={canvasRef}
            width="600"
            height="100"
            className="w-full rounded bg-blue-500"
          />
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-24 mt-3 p-2 text-sm border rounded
                     focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type or paste your text here..."
          />
          
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-600 text-xs">Tempo</label>
              <input
                type="range"
                min="50"
                max="400"
                value={tempo}
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-gray-600 text-xs">Key</label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-1 text-sm border rounded"
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="pentatonic">Pentatonic</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
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
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                title={isPlaying ? "Stop" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              
              <button
                onClick={saveMelody}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                title="Save melody"
              >
                <Save size={16} />
              </button>
              
              <label className="p-2 text-gray-600 hover:bg-gray-200 rounded-full cursor-pointer"
                     title="Load melody">
                <Upload size={16} />
                <input
                  type="file"
                  accept=".json"
                  onChange={loadMelody}
                  className="hidden"
                />
              </label>
            </div>
            
            <div className="text-xs text-gray-600">
              {tempo} BPM
            </div>
          </div>
        </div>
      </Card>
      
      <div className="text-xs text-gray-600 mt-2">
        Try different musical keys to change the mood • Watch the waveform as your text plays
      </div>
    </div>
  );
};

export default TextSynth;