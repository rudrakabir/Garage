import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const Theremin = () => {
  const [synth, setSynth] = useState(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Tone.js and synth
  const initializeAudio = async () => {
    try {
      // Start Tone.js context
      await Tone.start();
      console.log('Tone.js started');

      // Create and connect synth
      const newSynth = new Tone.Synth({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.1,
          decay: 0.2,
          sustain: 1,
          release: 1
        }
      }).toDestination();

      console.log('Synth created');
      setSynth(newSynth);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  };

  // Handle mouse movement
  const handleMouseMove = (e) => {
    if (!isPlaying || !synth) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map X position to frequency (logarithmic scale for more musical control)
    const minFreq = 100;
    const maxFreq = 1000;
    const freq = minFreq * Math.pow(maxFreq/minFreq, x/rect.width);
    synth.frequency.value = freq;

    // Map Y position to volume
    const volume = -((y / rect.height) * 30);
    synth.volume.value = volume;

    // Draw visual feedback
    drawVisuals(x, y, rect.width, rect.height);
  };

  // Draw visual feedback
  const drawVisuals = (x, y, width, height) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw frequency lines
    const lineCount = 20;
    const lineSpacing = width / lineCount;
    ctx.strokeStyle = `hsl(${(x/width) * 360}, 100%, 50%)`;
    ctx.lineWidth = 2;

    for (let i = 0; i < lineCount; i++) {
      const xPos = i * lineSpacing;
      const amplitude = Math.sin((Date.now() / 1000) + i) * 50;
      const yOffset = y + amplitude;

      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos + lineSpacing/2, height);
      ctx.stroke();
    }

    // Draw circular cursor
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  };

  // Start sound
  const handleMouseEnter = async () => {
    if (!isInitialized) {
      await initializeAudio();
    }
    if (synth) {
      synth.triggerAttack();
      setIsPlaying(true);
      console.log('Sound started');
    }
  };

  // Stop sound
  const handleMouseLeave = () => {
    if (synth) {
      synth.triggerRelease();
      setIsPlaying(false);
      console.log('Sound stopped');
    }
  };

  // Set up canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    // Initial black background
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cleanup
    return () => {
      if (synth) {
        synth.dispose();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Visual Theremin</h1>
      <p className="text-gray-300 mb-8">
        Click anywhere to start, then move your mouse across the canvas to create sound and visuals. 
        X-axis controls pitch, Y-axis controls volume.
      </p>
      <div className="w-full flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={!isInitialized ? initializeAudio : undefined}
        />
      </div>
    </div>
  );
};

export default Theremin;