/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Grid columns for the sequencer
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        '32': 'repeat(32, minmax(0, 1fr))',  // For expanded patterns
      },
      // Custom spacing for music-related components
      spacing: {
        '1/8': '12.5%',  // For 8th notes
        '1/16': '6.25%', // For 16th notes
      },
      // Animation durations useful for tempo-synced animations
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Colors suited for audio applications
      colors: {
        'studio': {
          900: '#0A0A0A',
          800: '#1A1A1A',
          700: '#2D2D2D',
          600: '#3D3D3D',
          500: '#4D4D4D',
          400: '#666666',
          300: '#808080',
          200: '#999999',
          100: '#B3B3B3',
          50: '#D9D9D9',
        },
        'meter': {
          red: '#FF4444',
          yellow: '#FFDD44',
          green: '#44FF44',
        }
      },
      // Custom height/width values for audio components
      height: {
        'fader': '120px',
        'meter': '80px',
      },
      width: {
        'fader': '24px',
        'meter': '12px',
      },
      // Box shadows for 3D effect on controls
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.25)',
        'led': '0 0 5px rgba(59, 130, 246, 0.5)',
      },
      // Border radius for rounded controls
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      // Font family for displaying numbers (good for BPM, time displays)
      fontFamily: {
        'lcd': ['Space Mono', 'monospace'],
        'led': ['Digital-7', 'monospace'],
      },
    },
  },
  plugins: [],
}