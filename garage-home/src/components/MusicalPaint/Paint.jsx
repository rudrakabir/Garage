import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCw, Download } from 'lucide-react';

const MusicalPaint = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#4287f5');
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(true);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const lastPointRef = useRef(null);

  // Pentatonic scale frequencies
  const NOTES = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

  useEffect(() => {
    const setupCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
    };

    setupCanvas();
  }, [brushColor, brushSize]);

  const initAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = 0.1;
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setIsAudioInitialized(true);
      setShowAudioPrompt(false);
      console.log('Audio initialized successfully:', audioContextRef.current.state);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setShowAudioPrompt(true);
    }
  };

  const playNote = (y) => {
    if (!audioContextRef.current || !isAudioInitialized) return;
    
    const normalizedY = y / canvasRef.current.height;
    const noteIndex = Math.floor(normalizedY * NOTES.length);
    const frequency = NOTES[noteIndex];

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const noteGain = audioContextRef.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      noteGain.gain.value = isMuted ? 0 : 0.1;
      
      oscillator.connect(noteGain);
      noteGain.connect(gainNodeRef.current);
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        noteGain.disconnect();
      }, 100);
      
      setCurrentNote(noteIndex);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  };

  const startDrawing = async (e) => {
    if (!isAudioInitialized) {
      await initAudio();
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setIsDrawing(true);
    lastPointRef.current = { x, y };
    setPoints(prev => [...prev, { x, y }]);
    playNote(y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    lastPointRef.current = { x, y };
    setPoints(prev => [...prev, { x, y }]);
    playNote(y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const playback = async () => {
    if (!points.length) return;
    
    if (!isAudioInitialized) {
      await initAudio();
    }
    
    setIsPlaying(true);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= points.length) {
        setIsPlaying(false);
        clearInterval(interval);
        return;
      }
      
      playNote(points[index].y);
      index++;
    }, 100);
  };

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setPoints([]);
  };

  const saveImage = () => {
    const link = document.createElement('a');
    link.download = 'musical-painting.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Musical Paint</h2>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="range"
                min="5"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          
          {showAudioPrompt && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">
              Click anywhere on the canvas to enable audio
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            className="w-full border rounded bg-gray-50 cursor-crosshair"
          />
          
          <div className="flex items-center justify-between mt-3 py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <button
                onClick={async () => {
                  if (!isAudioInitialized) {
                    await initAudio();
                  }
                  if (!isPlaying) {
                    playback();
                  } else {
                    setIsPlaying(false);
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
                onClick={clear}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                title="Clear canvas"
              >
                <RotateCw size={16} />
              </button>

              <button
                onClick={saveImage}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-full"
                title="Save painting"
              >
                <Download size={16} />
              </button>
            </div>
            
            {currentNote !== null && (
              <div className="text-sm text-gray-600">
                Note: {currentNote + 1}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-600 mt-2">
        Draw on the canvas to create melodies • Higher = higher pitch • Play back your musical artwork
      </div>
    </div>
  );
};

export default MusicalPaint;