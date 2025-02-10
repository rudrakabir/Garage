# The Garage 🎼

A collection of experimental web applications focused on music and audio creation. Built with React and modern web audio technologies.

## 🔧 Adding a New Tool - Quick Guide

To add a new audio tool to the project:

1. Create a new component folder in `src/components/YourTool/`
2. In `App.jsx`, add your tool to the `apps` array:
```javascript
{
  title: "Your Tool Name",
  description: "Brief description of what it does",
  icon: Music4,  // Choose an icon from lucide-react
  link: "/your-tool-route"
}
```
3. Add the route in `App.jsx`:
```javascript
<Route path="/your-tool-route" element={
  <AppLayout>
    <YourTool />
  </AppLayout>
} />
```

That's it! Your tool will automatically appear on the home page with navigation.

## Features

### 🎵 Musical Applications

- **Shanty Generator**: Generate sea shanties with musical patterns and rhythm
- **Text Synth**: Convert text into musical melodies with customizable scales
- **Rhythmic Text Synth**: Create rhythmic patterns from text using natural speech patterns
- **Drum Pad**: Create beats with an interactive drum pad
- **Musical Paint**: Draw melodies and create visual music on a canvas
- **Drum Machine**: Create rhythms with a loop-based drum machine

## Technology Stack

- React 18
- Vite
- Tailwind CSS
- React Router DOM
- Tone.js (Audio synthesis)
- Tonal.js (Music theory utilities)
- Lucide React (Icons)

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
  ├── components/         # React components for each application
  │   ├── DrumPad/
  │   ├── TextSynth/
  │   ├── ShantyGenerator/
  │   ├── MusicalPaint/
  │   └── DrumMachine/
  ├── App.jsx            # Main application component and routing
  └── main.jsx          # Application entry point
```

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to add.

## License

[Add your license here]