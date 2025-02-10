// Get the file name without extension
export const getDisplayName = (filename) => {
  return filename.replace(/\.[^/.]+$/, "");
};

// Check if file is an audio file
export const isAudioFile = (filename) => {
  const audioExtensions = ['.mp3', '.wav', '.m4a'];
  return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

// Sort files alphabetically
export const sortFiles = (files) => {
  return [...files].sort((a, b) => a.localeCompare(b));
};
