import * as Tone from 'tone';

const STEP_INTERVAL = '16n';
const MAX_HUMANIZE_SECONDS = 0.03;
const MIN_GAIN = 0.0001;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toDecibels = (gain) => {
  if (gain <= 0) {
    return -Infinity;
  }
  return Tone.gainToDb(Math.max(gain, MIN_GAIN));
};

const toSamplePath = (soundFile) =>
  `/audio/drums2/${encodeURIComponent(soundFile).replace(/%2F/g, '/')}`;

class DrumMachineEngine {
  constructor({ stepCount = 16, onStep } = {}) {
    this.stepCount = stepCount;
    this.onStep = onStep;
    this.sequence = [];
    this.tracks = [];
    this.currentStep = 0;
    this.bpm = 120;
    this.swing = 0;
    this.humanize = 0;
    this.eventId = null;
    this.players = new Tone.Players().toDestination();
    this.loadedSounds = new Set();
    this.loadingSounds = new Map();
  }

  setOnStep(onStep) {
    this.onStep = onStep;
  }

  setPattern({ sequence, tracks }) {
    this.sequence = sequence;
    this.tracks = tracks;
  }

  setBpm(value) {
    this.bpm = clamp(value, 40, 240);
    Tone.Transport.bpm.rampTo(this.bpm, 0.05);
  }

  setSwing(value) {
    this.swing = clamp(value, 0, 1);
    Tone.Transport.swing = this.swing;
    Tone.Transport.swingSubdivision = STEP_INTERVAL;
  }

  setHumanize(value) {
    this.humanize = clamp(value, 0, 1);
  }

  async start(trackSounds = []) {
    await this.ensureAudioStarted();
    await this.preloadSounds(trackSounds);

    this.clearEvent();
    this.currentStep = 0;
    Tone.Transport.position = 0;
    Tone.Transport.bpm.value = this.bpm;
    Tone.Transport.swing = this.swing;
    Tone.Transport.swingSubdivision = STEP_INTERVAL;

    this.eventId = Tone.Transport.scheduleRepeat((time) => {
      const step = this.currentStep;
      this.triggerStep(step, time);
      if (this.onStep) {
        this.onStep(step);
      }
      this.currentStep = (step + 1) % this.stepCount;
    }, STEP_INTERVAL);

    Tone.Transport.start('+0.02');
  }

  stop({ resetStep = true } = {}) {
    this.clearEvent();
    Tone.Transport.stop();
    if (resetStep) {
      this.currentStep = 0;
      if (this.onStep) {
        this.onStep(0);
      }
    }
  }

  async preview(soundFile, volume = 0.7) {
    if (!soundFile) {
      return;
    }
    await this.ensureAudioStarted();
    await this.ensureSoundLoaded(soundFile);
    const player = this.players.player(soundFile);
    player.volume.value = toDecibels(volume);
    player.start();
  }

  dispose() {
    this.stop();
    this.players.dispose();
    this.loadedSounds.clear();
    this.loadingSounds.clear();
  }

  clearEvent() {
    if (this.eventId !== null) {
      Tone.Transport.clear(this.eventId);
      this.eventId = null;
    }
  }

  async ensureAudioStarted() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
  }

  async preloadSounds(soundFiles) {
    const uniqueSounds = [...new Set(soundFiles.filter(Boolean))];
    if (uniqueSounds.length === 0) {
      return;
    }

    const pendingLoads = uniqueSounds.map((soundFile) =>
      this.ensureSoundLoaded(soundFile)
    );
    await Promise.allSettled(pendingLoads);
  }

  async ensureSoundLoaded(soundFile) {
    if (this.loadedSounds.has(soundFile)) {
      return;
    }

    if (this.loadingSounds.has(soundFile)) {
      await this.loadingSounds.get(soundFile);
      return;
    }

    const loadPromise = new Promise((resolve) => {
      this.players.add(soundFile, toSamplePath(soundFile), () => {
        this.loadedSounds.add(soundFile);
        resolve();
      });
    });

    this.loadingSounds.set(soundFile, loadPromise);
    await loadPromise;
    this.loadingSounds.delete(soundFile);
  }

  triggerStep(step, time) {
    this.tracks.forEach((track, trackIndex) => {
      const isStepActive = this.sequence?.[trackIndex]?.[step];
      if (!isStepActive || !track?.sound || track.mute) {
        return;
      }

      const probability = clamp(track.probability ?? 1, 0, 1);
      if (Math.random() > probability) {
        return;
      }

      if (!this.loadedSounds.has(track.sound)) {
        return;
      }

      const player = this.players.player(track.sound);
      player.volume.value = toDecibels(track.volume ?? 0.7);

      const offset =
        (Math.random() * 2 - 1) * this.humanize * MAX_HUMANIZE_SECONDS;
      const scheduledTime = Math.max(time + offset, time);
      player.start(scheduledTime);
    });
  }
}

export const createDrumMachineEngine = (options = {}) =>
  new DrumMachineEngine(options);
