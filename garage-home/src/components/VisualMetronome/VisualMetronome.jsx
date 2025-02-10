import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

const VisualMetronome = () => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [shape, setShape] = useState('circle');
  const [color, setColor] = useState('#00ff00');
  const [subdivision, setSubdivision] = useState(1);
  
  const animationRef = useRef(null);
  const lastDrawTimeRef = useRef(0);
  
  // Create a click sound for the metronome
  const clickRef = useRef(null);
  
  useEffect(() => {
    // Create a simple click sound
    clickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.1
      }
    }).toDestination();
    
    return () => {
      if (clickRef.current) {
        clickRef.current.dispose();
      }
    };
  }, []);

  const drawBeat = (progress) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Clear the entire canvas
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate size based on viewport size
    const maxSize = Math.min(width, height) * 0.6;
    
    // Set color with opacity based on progress
    const alpha = Math.max(0, 1 - progress);
    ctx.strokeStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
    ctx.lineWidth = 8; // Thicker lines
    
    const size = maxSize * (0.2 + progress * 0.8); // Start at 20% size and expand to 100%

    console.log('Drawing:', { progress, size, color: ctx.strokeStyle }); // Debug log

    ctx.beginPath();
    switch (shape) {
      case 'circle':
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
        break;
        
      case 'line':
        const lineWidth = size;
        ctx.moveTo(centerX - lineWidth / 2, centerY);
        ctx.lineTo(centerX + lineWidth / 2, centerY);
        break;
        
      case 'triangle':
        const triangleSize = size / 2;
        ctx.moveTo(centerX, centerY - triangleSize);
        ctx.lineTo(centerX - triangleSize, centerY + triangleSize);
        ctx.lineTo(centerX + triangleSize, centerY + triangleSize);
        ctx.closePath();
        break;
    }
    ctx.stroke();
  };

  const animate = (timestamp) => {
    if (!isPlaying) return;
    
    const beatDuration = 60000 / (bpm * subdivision);
    const elapsed = timestamp - lastDrawTimeRef.current;
    const progress = (elapsed % beatDuration) / beatDuration;
    
    drawBeat(progress);
    console.log('Animation frame:', { timestamp, elapsed, progress }); // Debug log
    animationRef.current = requestAnimationFrame(animate);
  };

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      Tone.Transport.bpm.value = bpm;
      
      const interval = subdivision === 1 ? '4n' : 
                      subdivision === 2 ? '8n' :
                      subdivision === 3 ? '12n' : '16n';
      
      // Set up the recurring click and visual trigger
      Tone.Transport.scheduleRepeat((time) => {
        clickRef.current.triggerAttackRelease('C2', '16n', time);
        lastDrawTimeRef.current = performance.now();
        console.log('Beat triggered at:', time); // Debug log
      }, interval);
      
      Tone.Transport.start();
      lastDrawTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      cancelAnimationFrame(animationRef.current);
      
      // Clear the canvas
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      // Make canvas truly fullscreen
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 150; // Leave space for controls
      
      // Clear to black on resize
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      console.log('Canvas resized:', { width: canvas.width, height: canvas.height }); // Debug log
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Fixed controls at the top */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900 shadow-lg z-10">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <button
              onClick={togglePlay}
              className={`px-8 py-4 rounded-lg text-lg font-medium transition-colors ${
                isPlaying 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">BPM:</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 px-2 py-1 bg-gray-800 rounded text-white"
                min="1"
                step="1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Shape:</label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value)}
                className="px-2 py-1 bg-gray-800 rounded text-white"
              >
                <option value="circle">Circle</option>
                <option value="line">Line</option>
                <option value="triangle">Triangle</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Color:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Subdivision:</label>
              <select
                value={subdivision}
                onChange={(e) => setSubdivision(Number(e.target.value))}
                className="px-2 py-1 bg-gray-800 rounded text-white"
              >
                <option value="1">Quarter Notes</option>
                <option value="2">Eighth Notes</option>
                <option value="3">Triplets</option>
                <option value="4">Sixteenth Notes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          background: 'black',
          marginTop: '70px' // Space for the controls
        }}
      />
    </div>
  );
};

export default VisualMetronome;