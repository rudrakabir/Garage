import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Code2, Music, Type, Music2, ArrowLeft, Music4, Speaker, Eye, Waves, Timer } from 'lucide-react';
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

// Navigation bar component for app pages
const NavBar = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-800 hover:text-blue-600"
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
    <div className="min-h-screen bg-gray-50 pt-16">
      <NavBar />
      {children}
    </div>
  );
};

// Card component for home page
const AppCard = ({ title, description, icon: Icon, link }) => (
  <Link to={link} className="block no-underline">
    <div className="p-6 rounded-lg border border-gray-200 h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" />
        <h2 className="text-xl font-bold m-0">{title}</h2>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  </Link>
);

// Home page component
const Home = () => {
  const apps = [
    {
      title: "Shanty Generator",
      description: "Generate sea shanties with musical patterns and rhythm",
      icon: Music,
      link: "/shanty"
    },
    {
      title: "Text Synth",
      description: "Convert text into musical melodies with customizable scales",
      icon: Type,
      link: "/text-synth"
    },
    {
      title: "Rhythmic Text Synth",
      description: "Create rhythmic patterns from text with natural speech patterns",
      icon: Type,
      link: "/rhythmic-text-synth"
    },
    {
      title: "Drum Pad",
      description: "Create beats with an interactive drum pad",
      icon: Music2,
      link: "/drumpad"
    },
    {
      title: "Musical Paint",
      description: "Draw melodies and create visual music on a canvas",
      icon: Music4,
      link: "/paint"
    },
    {
      title: "Drum Machine",
      description: "Drum machine with many loops",
      icon: Music4,
      link: "/machine"
    },
    {
      title: "Soundboard",
      description: "Drop in audio files and play them instantly",
      icon: Speaker,
      link: "/soundboard"
    },
    {
      title: "Visual Projections",
      description: "Collection of fullscreen visual effects and animations",
      icon: Eye,
      link: "/visualizer"
    },
    {
      title: "Visual Theremin",
      description: "Control sound and visuals with mouse movement - X controls pitch, Y controls volume",
      icon: Waves,
      link: "/theremin"
    },
    {
      title: "Visual Metronome",
      description: "Animated metronome with customizable visual patterns synced to tempo",
      icon: Timer,
      link: "/metronome"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="w-8 h-8" />
            <h1 className="text-4xl font-bold">The Garage</h1>
          </div>
          <p className="text-xl text-gray-600">A collection of experimental web apps</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app) => (
            <AppCard key={app.title} {...app} />
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
      </Routes>
    </BrowserRouter>
  );
};

export default App;