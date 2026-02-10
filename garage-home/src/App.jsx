import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Code2, Music, Type, Music2, ArrowLeft, Music4, Speaker, Eye, Waves, Timer, Sparkles, Users, ArrowUpRight, Wrench } from 'lucide-react';
import DrumPad from './components/DrumPad/DrumPad';
import TextSynth from './components/TextSynth/TextSynth';
import RhythmicTextSynth from './components/TextSynth/RhythmicTextSynth';
import ShantyGenerator from './components/ShantyGenerator/ShantyGenerator';
import MusicalPaint from './components/MusicalPaint/Paint';
import DrumMachine from './components/DrumMachine/machine.jsx';
import Soundboard from './components/Soundboard';
import Visualizer from './components/Visualizer/Visualizer';
import Theremin from './components/Theremin/Theremin';
import VisualMetronome from './components/VisualMetronome/VisualMetronome';
import AuroraOrchestra from './components/AuroraOrchestra/AuroraOrchestra';
import Soundscapes from './components/Soundscapes/Soundscapes';
import PulseGarden from './components/PulseGarden/PulseGarden';

// Navigation bar component for app pages
const NavBar = () => {
  const navigate = useNavigate();
  return (
    <div className="garage-nav fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="garage-nav-button"
        >
          <ArrowLeft size={20} />
          <span>Back to Garage</span>
        </button>
      </div>
    </div>
  );
};

// Layout wrapper for app pages
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen app-shell pt-16">
      <NavBar />
      {children}
    </div>
  );
};

// Card component for home page
const AppCard = ({ title, description, icon: Icon, link, category, accent, index }) => (
  <Link to={link} className="group block no-underline h-full">
    <article
      className="garage-card p-6 sm:p-7 rounded-3xl h-full relative overflow-hidden"
      style={{ '--card-accent': accent }}
    >
      <div className="garage-card-glow" />
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="garage-icon-wrap">
          <Icon className="w-5 h-5" />
        </div>
        <span className="garage-card-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="relative z-10">
        <p className="garage-card-category">{category}</p>
        <h2 className="text-2xl font-semibold tracking-tight m-0 mb-3">{title}</h2>
      </div>
      <p className="garage-card-copy relative z-10">{description}</p>
      <div className="garage-card-footer relative z-10">
        <span className="garage-route-pill">{link}</span>
        <span className="garage-launch">
          Launch
          <ArrowUpRight className="w-4 h-4" />
        </span>
      </div>
    </article>
  </Link>
);

// Home page component
const Home = () => {
  const apps = [
    {
      title: "Shanty Generator",
      description: "Generate sea shanties with musical patterns and rhythm",
      icon: Music,
      link: "/shanty",
      category: "Generator",
      accent: "#f97316"
    },
    {
      title: "Text Synth",
      description: "Convert text into musical melodies with customizable scales",
      icon: Type,
      link: "/text-synth",
      category: "Text to Music",
      accent: "#0ea5e9"
    },
    {
      title: "Rhythmic Text Synth",
      description: "Create rhythmic patterns from text with natural speech patterns",
      icon: Type,
      link: "/rhythmic-text-synth",
      category: "Text to Rhythm",
      accent: "#14b8a6"
    },
    {
      title: "Drum Pad",
      description: "Create beats with an interactive drum pad",
      icon: Music2,
      link: "/drumpad",
      category: "Performance",
      accent: "#84cc16"
    },
    {
      title: "Musical Paint",
      description: "Draw melodies and create visual music on a canvas",
      icon: Music4,
      link: "/paint",
      category: "Canvas",
      accent: "#eab308"
    },
    {
      title: "Drum Machine",
      description: "Drum machine with many loops",
      icon: Music4,
      link: "/machine",
      category: "Sequencer",
      accent: "#f59e0b"
    },
    {
      title: "Soundboard",
      description: "Drop in audio files and play them instantly",
      icon: Speaker,
      link: "/soundboard",
      category: "Sampler",
      accent: "#ef4444"
    },
    {
      title: "Visual Projections",
      description: "Collection of fullscreen visual effects and animations",
      icon: Eye,
      link: "/visualizer",
      category: "Visuals",
      accent: "#06b6d4"
    },
    {
      title: "Visual Theremin",
      description: "Control sound and visuals with mouse movement - X controls pitch, Y controls volume",
      icon: Waves,
      link: "/theremin",
      category: "Motion",
      accent: "#22c55e"
    },
    {
      title: "Visual Metronome",
      description: "Animated metronome with customizable visual patterns synced to tempo",
      icon: Timer,
      link: "/metronome",
      category: "Timing",
      accent: "#8b5cf6"
    },
    {
      title: "Aurora Orchestra",
      description: "Draw constellations that bloom into a moving choir of light and harmony",
      icon: Sparkles,
      link: "/aurora-orchestra",
      category: "Ambient",
      accent: "#f43f5e"
    },
    {
      title: "Soundscapes",
      description: "Camera-driven generative ambience that shifts from togetherness to tension",
      icon: Users,
      link: "/soundscapes",
      category: "Camera",
      accent: "#6366f1"
    },
    {
      title: "Pulse Garden",
      description: "Plant living pulses that grow into generative rhythm, harmony, and visuals",
      icon: Sparkles,
      link: "/pulse-garden",
      category: "Generative",
      accent: "#10b981"
    }
  ];

  return (
    <div className="garage-home min-h-screen">
      <div className="garage-bg-orb garage-bg-orb-a" />
      <div className="garage-bg-orb garage-bg-orb-b" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="garage-hero mb-8 sm:mb-12">
          <div className="garage-kicker">
            <Wrench className="w-4 h-4" />
            Builder Mode
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Code2 className="w-8 h-8 text-slate-900" />
            <h1 className="garage-display m-0">The Garage</h1>
          </div>
          <p className="garage-subtitle">
            A builder-first playground for sonic tools, interactive visuals, and quick creative prototypes.
          </p>
          <div className="garage-meta-row">
            <span className="garage-chip">{apps.length} live tools</span>
            <span className="garage-chip">React + Tone.js</span>
            <span className="garage-chip">Fast route-based launcher</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
          {apps.map((app, index) => (
            <AppCard key={app.title} index={index} {...app} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App component with routing
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drumpad" element={
          <AppLayout>
            <DrumPad />
          </AppLayout>
        } />
        <Route path="/text-synth" element={
          <AppLayout>
            <TextSynth />
          </AppLayout>
        } />
        <Route path="/rhythmic-text-synth" element={
          <AppLayout>
            <RhythmicTextSynth />
          </AppLayout>
        } />
        <Route path="/machine" element={
          <AppLayout>
            <DrumMachine />
          </AppLayout>
        } />
        <Route path="/shanty" element={
          <AppLayout>
            <ShantyGenerator />
          </AppLayout>
        } />
        <Route path="/paint" element={
          <AppLayout>
            <MusicalPaint />
          </AppLayout>
        } />
        <Route path="/soundboard" element={
          <AppLayout>
            <Soundboard />
          </AppLayout>
        } />
        <Route path="/visualizer" element={
          <AppLayout>
            <Visualizer />
          </AppLayout>
        } />
        <Route path="/theremin" element={
          <AppLayout>
            <Theremin />
          </AppLayout>
        } />
        <Route path="/metronome" element={
          <AppLayout>
            <VisualMetronome />
          </AppLayout>
        } />
        <Route path="/aurora-orchestra" element={
          <AppLayout>
            <AuroraOrchestra />
          </AppLayout>
        } />
        <Route path="/soundscapes" element={
          <AppLayout>
            <Soundscapes />
          </AppLayout>
        } />
        <Route path="/pulse-garden" element={
          <AppLayout>
            <PulseGarden />
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
