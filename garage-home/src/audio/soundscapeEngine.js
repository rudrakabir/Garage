import * as Tone from 'tone';

const WARM_CHORDS = [
  ['C3', 'G3', 'D4'],
  ['A2', 'E3', 'B3'],
  ['F2', 'C3', 'G3'],
  ['G2', 'D3', 'A3'],
];

const TENSE_NOTES = ['C3', 'Db3', 'F#3', 'Bb2', 'E3'];

export class SoundscapeEngine {
  constructor() {
    this.initialized = false;
    this.personVoices = new Map();
    this.state = {
      togetherness: 0.5,
      movement: 0,
      peopleCount: 0,
    };
    this.previousTogetherness = 0.5;
    this.lastReunionTime = 0;
  }

  init() {
    if (this.initialized) {
      return;
    }

    this.limiter = new Tone.Limiter(-1).toDestination();
    this.master = new Tone.Gain(0.85).connect(this.limiter);

    this.warmBus = new Tone.Gain(0.7).connect(this.master);
    this.harshBus = new Tone.Gain(0.3).connect(this.master);
    this.personBus = new Tone.Gain(0.18).connect(this.master);

    this.warmFilter = new Tone.Filter(1350, 'lowpass');
    this.warmChorus = new Tone.Chorus({
      frequency: 0.2,
      delayTime: 3.2,
      depth: 0.35,
      wet: 0.25,
    }).start();
    this.warmReverb = new Tone.Reverb({
      decay: 8,
      wet: 0.42,
      preDelay: 0.15,
    });
    this.warmSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 1.4,
        decay: 0.6,
        sustain: 0.45,
        release: 3.4,
      },
      volume: -14,
    }).chain(this.warmFilter, this.warmChorus, this.warmReverb, this.warmBus);

    this.harshHighpass = new Tone.Filter(850, 'highpass');
    this.harshDistortion = new Tone.Distortion(0.28);
    this.harshCrush = new Tone.BitCrusher(4);
    this.harshSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.7,
      modulationIndex: 15,
      envelope: {
        attack: 0.05,
        decay: 0.35,
        sustain: 0.2,
        release: 0.7,
      },
      modulation: {
        type: 'triangle',
      },
      volume: -10,
    }).chain(this.harshHighpass, this.harshDistortion, this.harshCrush, this.harshBus);

    this.harshNoise = new Tone.NoiseSynth({
      noise: {
        type: 'pink',
      },
      envelope: {
        attack: 0.01,
        decay: 0.12,
        sustain: 0,
        release: 0.15,
      },
      volume: -18,
    }).connect(this.harshBus);

    Tone.Transport.bpm.value = 72;

    this.warmLoop = new Tone.Loop((time) => {
      const warmth = this.state.togetherness;
      if (this.state.peopleCount === 0 || warmth < 0.14) {
        return;
      }

      const chord = WARM_CHORDS[Math.floor(Math.random() * WARM_CHORDS.length)];
      const velocity = 0.2 + (warmth * 0.5);
      this.warmSynth.triggerAttackRelease(chord, '1m', time, velocity);
    }, '1m').start(0);

    this.harshLoop = new Tone.Loop((time) => {
      const intensity = 1 - this.state.togetherness;
      if (this.state.peopleCount === 0 || intensity < 0.2) {
        return;
      }

      const note = TENSE_NOTES[Math.floor(Math.random() * TENSE_NOTES.length)];
      this.harshSynth.triggerAttackRelease(note, '8n', time, 0.15 + (intensity * 0.45));

      if (this.state.movement > 0.36) {
        this.harshNoise.triggerAttackRelease('16n', time, 0.12 + (intensity * 0.3));
      }
    }, '4n').start('0:2');

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }

    this.initialized = true;
  }

  createPersonVoice(personId) {
    const osc = new Tone.Oscillator({
      frequency: 220,
      type: 'sine',
    }).start();
    const filter = new Tone.Filter(1400, 'lowpass');
    const panner = new Tone.Panner(0);
    const gain = new Tone.Gain(0);

    osc.chain(filter, panner, gain, this.personBus);

    const voice = { id: personId, osc, filter, panner, gain };
    this.personVoices.set(personId, voice);
    return voice;
  }

  updatePersonVoices(people, togetherness) {
    const activeIds = new Set(people.map((person) => person.id));

    people.forEach((person, index) => {
      const voice = this.personVoices.get(person.id) ?? this.createPersonVoice(person.id);
      const baseFrequency = 160 + ((1 - person.y) * 210) + ((index % 4) * 18);
      const pan = (person.x * 2) - 1;
      const brightness = 800 + (togetherness * 1800);
      const level = people.length === 0 ? 0 : (0.01 + (0.06 / Math.max(people.length, 1)));
      const timbre = togetherness > 0.58 ? 'sine' : togetherness > 0.32 ? 'triangle' : 'sawtooth';

      voice.osc.type = timbre;
      voice.osc.frequency.rampTo(baseFrequency, 0.22);
      voice.panner.pan.rampTo(pan, 0.2);
      voice.filter.frequency.rampTo(brightness, 0.25);
      voice.gain.gain.rampTo(level, 0.22);
    });

    this.personVoices.forEach((voice, voiceId) => {
      if (!activeIds.has(voiceId)) {
        voice.gain.gain.rampTo(0, 0.14);
        setTimeout(() => {
          if (this.personVoices.has(voiceId)) {
            const staleVoice = this.personVoices.get(voiceId);
            staleVoice.osc.dispose();
            staleVoice.filter.dispose();
            staleVoice.panner.dispose();
            staleVoice.gain.dispose();
            this.personVoices.delete(voiceId);
          }
        }, 250);
      }
    });
  }

  triggerReunion() {
    const now = Tone.now();
    if (now - this.lastReunionTime < 2.8) {
      return;
    }

    this.lastReunionTime = now;
    this.warmSynth.triggerAttackRelease(['C4', 'G4', 'D5'], '2n', now, 0.45);
  }

  updateScene({ people, metrics }) {
    if (!this.initialized) {
      return;
    }

    const togetherness = metrics.togethernessSmoothed ?? metrics.togetherness ?? 0.5;
    const movement = metrics.movement ?? 0;
    const peopleCount = metrics.count ?? people.length;
    const harshness = 1 - togetherness;

    this.state = {
      togetherness,
      movement,
      peopleCount,
    };

    this.warmBus.gain.rampTo(0.12 + (0.85 * togetherness), 0.5);
    this.harshBus.gain.rampTo(0.08 + (0.85 * harshness), 0.5);
    this.personBus.gain.rampTo(0.08 + (0.22 * (0.25 + togetherness)), 0.35);

    this.warmFilter.frequency.rampTo(850 + (2700 * togetherness), 0.3);
    this.harshHighpass.frequency.rampTo(300 + (3000 * harshness), 0.2);
    this.harshDistortion.distortion = 0.06 + (0.82 * harshness);

    this.updatePersonVoices(people, togetherness);

    if (this.previousTogetherness < 0.4 && togetherness - this.previousTogetherness > 0.18) {
      this.triggerReunion();
    }
    this.previousTogetherness = togetherness;
  }

  dispose() {
    if (!this.initialized) {
      return;
    }

    this.personVoices.forEach((voice) => {
      voice.osc.dispose();
      voice.filter.dispose();
      voice.panner.dispose();
      voice.gain.dispose();
    });
    this.personVoices.clear();

    this.warmLoop.dispose();
    this.harshLoop.dispose();

    this.warmSynth.dispose();
    this.harshSynth.dispose();
    this.harshNoise.dispose();

    this.warmFilter.dispose();
    this.warmChorus.dispose();
    this.warmReverb.dispose();
    this.harshHighpass.dispose();
    this.harshDistortion.dispose();
    this.harshCrush.dispose();

    this.warmBus.dispose();
    this.harshBus.dispose();
    this.personBus.dispose();
    this.master.dispose();
    this.limiter.dispose();

    this.initialized = false;
  }
}
