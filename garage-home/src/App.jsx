import React from 'react';
import { Code2, Music, Plus } from 'lucide-react';

const AppCard = ({ title, description, icon: Icon, link }) => (
  <a href={link} className="block no-underline">
    <div className="p-6 rounded-lg border border-gray-200 h-full transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5" />
        <h2 className="text-xl font-bold m-0">{title}</h2>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  </a>
);

const GarageHome = () => {
  const apps = [
    {
      title: "Shanty Generator",
      description: "Generate sea shanties with AI",
      icon: Music,
      link: "/shanty"
    },
    {
      name: 'Text Synth',
      description: 'Your text synth app description here',
      path: '/text-synth',
      icon: '📝'  // or whichever icon you prefer
    },
    {
      title: "Coming Soon",
      description: "More apps are in development",
      icon: Plus,
      link: "#"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard key={app.title} {...app} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GarageHome;