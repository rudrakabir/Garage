import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Thumbnails } from './Thumbnails';

const visualizations = [
  { title: "Audio Sine Waves", file: "audio-sine-waves.html", id: "audio-sine-waves", description: "Interactive audio visualization with microphone input" },
  { title: "Bouncing Lines", file: "bouncing-lines.html", id: "bouncing-lines" },
  { title: "DVD and Line", file: "dvd-and-line.html", id: "dvd-and-line" },
  { title: "Fullscreen Horizontal", file: "fullscreen-horizontal.html", id: "fullscreen-horizontal" },
  { title: "Fullscreen Line", file: "fullscreen-line.html", id: "fullscreen-line" },
  { title: "Fullscreen Lines", file: "fullscreen-lines.html", id: "fullscreen-lines" },
  { title: "Horizontal Line Up", file: "horizontal-line-up.html", id: "horizontal-line-up" },
  { title: "Multi Control Lines", file: "multi-control-lines.html", id: "multi-control-lines" },
  { title: "Slow Red Line", file: "slow-red-line.html", id: "slow-red-line" },
  { title: "Smoke Visualization", file: "smoke-visualization.html", id: "smoke-visualization" },
  { title: "Three Colored Lines", file: "three-colored-lines.html", id: "three-colored-lines" },
  { title: "Vertical Lines Control", file: "vertical-lines-control.html", id: "vertical-lines-control" }
];

const Visualizer = () => {
  const [selectedVis, setSelectedVis] = useState(null);

  const openVisualization = (file) => {
    setSelectedVis(file);
  };

  const closeVisualization = () => {
    setSelectedVis(null);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {selectedVis ? (
        <div className="fixed inset-0 z-50">
          <button 
            onClick={closeVisualization}
            className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75 transition-colors"
          >
            <X size={24} />
          </button>
          <iframe
            src={`/visualizations/${selectedVis}`}
            className="w-full h-full border-none"
            title="Visualization"
            allow="microphone"
          />
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-bold mb-8">Visual Projections</h1>
          
          <div className="mb-12 max-w-3xl">
            <p className="text-lg text-gray-300 mb-4">
              This collection features minimal HTML animations designed specifically for projector-based installations. 
              When projected through a smoke machine or haze, these simple line patterns create captivating three-dimensional 
              light sculptures in the air.
            </p>
            <p className="text-lg text-gray-300">
              For best results, use these visualizations in a dark room with a bright projector and a smoke/haze machine. 
              The contrast between the black background and bright lines creates sharp, defined beams that interact 
              beautifully with the smoke particles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visualizations.map((vis) => (
              <div
                key={vis.file}
                className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/10"
                onClick={() => openVisualization(vis.file)}
              >
                <div className="aspect-video relative bg-black">
                  {Thumbnails[vis.id]}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{vis.title}</h3>
                  {vis.description && (
                    <p className="text-gray-400 mt-2 text-sm">{vis.description}</p>
                  )}
                  {vis.id === 'audio-sine-waves' && (
                    <p className="text-yellow-400 mt-2 text-sm">Requires microphone access</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;