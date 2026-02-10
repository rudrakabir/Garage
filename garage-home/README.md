# The Garage

The Garage is a React + Vite project containing interactive music and visual web tools.

## Available Tools

- `Shanty Generator` (`/shanty`) - Generate sea shanties with rhythm and melody patterns.
- `Text Synth` (`/text-synth`) - Convert text into musical notes with scale controls.
- `Rhythmic Text Synth` (`/rhythmic-text-synth`) - Turn text into rhythmic patterns.
- `Drum Pad` (`/drumpad`) - Play one-shot drum samples from pads.
- `Musical Paint` (`/paint`) - Draw on a canvas to generate musical output.
- `Drum Machine` (`/machine`) - Build loop-based beats.
- `Soundboard` (`/soundboard`) - Load and trigger your own audio clips.
- `Visual Projections` (`/visualizer`) - Fullscreen visual experiments.
- `Visual Theremin` (`/theremin`) - Mouse-driven pitch and volume control.
- `Visual Metronome` (`/metronome`) - Animated metronome with tempo-based visuals.
- `Aurora Orchestra` (`/aurora-orchestra`) - Interactive audiovisual composition space.
- `Pulse Garden` (`/pulse-garden`) - Plant moving pulses that evolve into generative rhythm, harmony, and light.

## Tech Stack

- React 18
- Vite 5
- React Router DOM 6
- Tailwind CSS
- Tone.js
- Tonal.js
- Lucide React

## Getting Started

From the repository root:

```bash
cd garage-home
npm install
npm run dev
```

The dev server starts on the Vite default URL (usually `http://localhost:5173`).

## Scripts

Run these inside `garage-home/`:

- `npm run dev` - Start local development server.
- `npm run build` - Build production assets into `dist/`.
- `npm run preview` - Preview the production build locally.
- `npm run lint` - Run ESLint on `src/`.

## Deployment (Netlify)

Netlify is configured in the repo root `netlify.toml` with:

- Base directory: `garage-home`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

SPA redirects are enabled to route all paths to `index.html`.

## Add a New Tool

1. Create your component in `src/components/YourTool/`.
2. Import it in `src/App.jsx`.
3. Add a card object to the `apps` array in `Home`.
4. Add a `<Route>` entry in `src/App.jsx`, wrapped in `AppLayout`.
5. Add any tool-specific styles in `src/styles/components/` if needed.

## Project Structure

```text
garage-home/
  src/
    components/           # Individual tools
    styles/               # Shared and component styles
    App.jsx               # Home cards + routing
    main.jsx              # React entry point
  public/                 # Static audio and visualization assets
  netlify.toml (repo root)
```
