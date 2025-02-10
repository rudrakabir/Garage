import React from 'react';

export const Thumbnails = {
  'audio-sine-waves': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <path
        d="M0,45 Q80,25 160,45 T320,45"
        stroke="red"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M0,90 Q80,70 160,90 T320,90"
        stroke="#00ff00"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M0,135 Q80,115 160,135 T320,135"
        stroke="blue"
        strokeWidth="3"
        fill="none"
      />
      <rect
        x="110"
        y="70"
        width="100"
        height="40"
        rx="5"
        fill="white"
      />
      <text
        x="160"
        y="95"
        textAnchor="middle"
        fill="black"
        fontSize="12"
        fontFamily="Arial"
      >
        Start Audio
      </text>
    </svg>
  ),
  
  'bouncing-lines': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="30" width="320" height="4" fill="red" />
      <rect x="0" y="90" width="320" height="4" fill="#00ff00" />
      <rect x="0" y="150" width="320" height="4" fill="blue" />
    </svg>
  ),
  
  'dvd-and-line': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="90" width="320" height="2" fill="white" />
      <rect x="120" y="40" width="80" height="40" fill="#ff00ff" />
      <text x="135" y="65" fill="white" fontSize="16" fontFamily="Arial">DVD</text>
    </svg>
  ),
  
  'fullscreen-horizontal': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="90" width="320" height="2" fill="white" />
    </svg>
  ),
  
  'fullscreen-line': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="160" y="0" width="2" height="180" fill="white" />
    </svg>
  ),
  
  'fullscreen-lines': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="160" y="0" width="2" height="180" fill="white" />
      <rect x="0" y="90" width="320" height="2" fill="white" />
    </svg>
  ),
  
  'horizontal-line-up': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="120" width="320" height="2" fill="white" />
    </svg>
  ),
  
  'multi-control-lines': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      {[...Array(12)].map((_, i) => {
        const x = (i + 1) * (320 / 13);
        const color = i < 4 ? 'red' : i < 8 ? '#00ff00' : 'blue';
        return <rect key={i} x={x} y="0" width="3" height="180" fill={color} opacity="0.8" />;
      })}
      <rect x="10" y="140" width="300" height="30" fill="rgba(255,255,255,0.2)" rx="5" />
    </svg>
  ),
  
  'slow-red-line': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="90" width="320" height="6" fill="red" />
    </svg>
  ),
  
  'smoke-visualization': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      {[...Array(30)].map((_, i) => {
        const x = (i + 1) * (320 / 31);
        const colors = ['red', '#00ff00', 'blue', 'white'];
        return (
          <rect 
            key={i} 
            x={x} 
            y="0" 
            width="2" 
            height="180" 
            fill={colors[i % 4]} 
            opacity="0.8" 
            style={{ filter: 'blur(1px)' }}
          />
        );
      })}
      <rect x="10" y="140" width="300" height="30" fill="rgba(255,255,255,0.1)" rx="5" />
    </svg>
  ),
  
  'three-colored-lines': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      <rect x="0" y="45" width="320" height="6" fill="red" />
      <rect x="0" y="90" width="320" height="6" fill="#00ff00" />
      <rect x="0" y="135" width="320" height="6" fill="blue" />
    </svg>
  ),
  
  'vertical-lines-control': (
    <svg viewBox="0 0 320 180" className="w-full h-full">
      <rect width="320" height="180" fill="black" />
      {[...Array(12)].map((_, i) => {
        const x = (i + 1) * (320 / 13);
        const color = i < 4 ? 'red' : i < 8 ? '#00ff00' : 'blue';
        return <rect key={i} x={x} y="0" width="6" height="180" fill={color} />;
      })}
      <rect x="10" y="140" width="300" height="30" fill="rgba(255,255,255,0.2)" rx="5" />
    </svg>
  ),
};