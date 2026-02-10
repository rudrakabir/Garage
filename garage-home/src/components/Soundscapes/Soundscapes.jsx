import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Cpu,
  Eye,
  EyeOff,
  Play,
  Square,
  Users,
  Waves,
} from 'lucide-react';
import { SoundscapeEngine } from '../../audio/soundscapeEngine';
import { assignTracks, computeSocialMetrics } from '../../vision/socialMetrics';
import { createPersonDetector } from '../../vision/personDetector';

const DETECTION_INTERVAL_MS = 140;

const METRIC_FALLBACK = {
  count: 0,
  meanDistance: 0,
  clusters: 0,
  isolationRatio: 0,
  movement: 0,
  togetherness: 0.5,
  togethernessSmoothed: 0.5,
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const formatPercent = (value) => `${Math.round(clamp(value) * 100)}%`;

const scoreLabel = (value) => {
  if (value >= 0.74) {
    return 'Connected';
  }
  if (value >= 0.45) {
    return 'Shifting';
  }
  return 'Isolated';
};

const Soundscapes = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const detectionBusyRef = useRef(false);
  const tracksRef = useRef([]);
  const nextTrackIdRef = useRef(1);
  const togethernessRef = useRef(0.5);
  const engineRef = useRef(null);
  const renderFrameRef = useRef(null);
  const visualStateRef = useRef({
    tracks: [],
    togetherness: 0.5,
    movement: 0,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [metrics, setMetrics] = useState(METRIC_FALLBACK);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [detectorMode, setDetectorMode] = useState('none');
  const [showCameraGhost, setShowCameraGhost] = useState(false);

  const clearOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const resizeOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      return;
    }

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  const drawAbstractScene = useCallback((timeMs) => {
    resizeOverlay();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    const width = canvas.width || 1280;
    const height = canvas.height || 720;
    const time = timeMs / 1000;
    const { tracks, togetherness, movement } = visualStateRef.current;
    const warmHue = 28 + (96 * togetherness);
    const coolHue = 220 - (86 * togetherness);
    const baseLight = 10 + (12 * togetherness) + (6 * movement);

    const backgroundGradient = context.createLinearGradient(0, 0, width, height);
    backgroundGradient.addColorStop(0, `hsla(${coolHue}, 58%, ${baseLight}%, 1)`);
    backgroundGradient.addColorStop(1, `hsla(${warmHue}, 68%, ${baseLight + 6}%, 1)`);
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = 'screen';
    const waveCount = 4;
    for (let i = 0; i < waveCount; i += 1) {
      const amplitude = (10 + (movement * 24)) * (1 + (i * 0.35));
      const baseline = ((i + 1) / (waveCount + 1)) * height;
      const phase = time * (0.6 + (0.25 * i)) + (togetherness * 4.2);

      context.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const normalizedX = x / width;
        const y = baseline
          + Math.sin((normalizedX * 8.8) + phase) * amplitude
          + Math.cos((normalizedX * 5.1) - phase) * amplitude * 0.2;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.lineWidth = 1.6 + (0.6 * i);
      context.strokeStyle = `hsla(${warmHue + (i * 8)}, 80%, ${54 + (i * 3)}%, ${0.14 + (movement * 0.14)})`;
      context.stroke();
    }

    if (tracks.length > 0) {
      for (let i = 0; i < tracks.length; i += 1) {
        for (let j = i + 1; j < tracks.length; j += 1) {
          const x1 = tracks[i].x * width;
          const y1 = tracks[i].y * height;
          const x2 = tracks[j].x * width;
          const y2 = tracks[j].y * height;
          const distance = Math.sqrt(((x1 - x2) ** 2) + ((y1 - y2) ** 2)) / Math.max(width, height);
          if (distance > 0.36) {
            continue;
          }

          const alpha = (0.36 - distance) / 0.36;
          context.beginPath();
          context.moveTo(x1, y1);
          context.lineTo(x2, y2);
          context.lineWidth = 1.3 + (alpha * 3.2);
          context.strokeStyle = `hsla(${warmHue}, 90%, 65%, ${0.15 + (alpha * 0.4)})`;
          context.stroke();
        }
      }
    }

    tracks.forEach((track, index) => {
      const x = track.x * width;
      const y = track.y * height;
      const pulse = 0.76 + (0.35 * (Math.sin((time * 1.8) + (index * 1.7)) * 0.5 + 0.5));
      const radius = (54 + (64 * togetherness) + (18 * movement)) * pulse;

      const aura = context.createRadialGradient(x, y, 0, x, y, radius);
      aura.addColorStop(0, `hsla(${warmHue + (index * 7)}, 96%, ${62 + (8 * togetherness)}%, 0.72)`);
      aura.addColorStop(0.45, `hsla(${warmHue + (index * 11)}, 86%, 52%, 0.32)`);
      aura.addColorStop(1, `hsla(${coolHue}, 82%, 40%, 0)`);

      context.fillStyle = aura;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.strokeStyle = `hsla(${warmHue}, 98%, 76%, 0.62)`;
      context.lineWidth = 1.2;
      context.arc(x, y, 10 + (pulse * 6), 0, Math.PI * 2);
      context.stroke();
    });

    if (tracks.length === 0) {
      const idleX = width * (0.5 + (Math.sin(time * 0.28) * 0.08));
      const idleY = height * (0.54 + (Math.cos(time * 0.24) * 0.06));
      const idleRadius = 120 + (18 * Math.sin(time * 0.6));
      const idleGlow = context.createRadialGradient(idleX, idleY, 0, idleX, idleY, idleRadius);
      idleGlow.addColorStop(0, `hsla(${warmHue}, 80%, 58%, 0.24)`);
      idleGlow.addColorStop(1, 'hsla(210, 75%, 42%, 0)');
      context.fillStyle = idleGlow;
      context.beginPath();
      context.arc(idleX, idleY, idleRadius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalCompositeOperation = 'source-over';
  }, [resizeOverlay]);

  const stopRenderLoop = useCallback(() => {
    if (renderFrameRef.current !== null) {
      window.cancelAnimationFrame(renderFrameRef.current);
      renderFrameRef.current = null;
    }
  }, []);

  const renderFrame = useCallback((timeMs) => {
    drawAbstractScene(timeMs);
    renderFrameRef.current = window.requestAnimationFrame(renderFrame);
  }, [drawAbstractScene]);

  const startRenderLoop = useCallback(() => {
    stopRenderLoop();
    renderFrameRef.current = window.requestAnimationFrame(renderFrame);
  }, [renderFrame, stopRenderLoop]);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    detectionBusyRef.current = false;
  }, []);

  const cleanup = useCallback((resetState = true) => {
    stopDetection();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (detectorRef.current?.destroy) {
      detectorRef.current.destroy();
    }
    detectorRef.current = null;
    tracksRef.current = [];
    nextTrackIdRef.current = 1;
    togethernessRef.current = 0.5;
    visualStateRef.current = {
      tracks: [],
      togetherness: 0.5,
      movement: 0,
    };

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    if (resetState) {
      setIsRunning(false);
      setIsCameraReady(false);
      setIsAudioReady(false);
      setMetrics(METRIC_FALLBACK);
      setDetectorMode('none');
      setWarning('');
      setError('');
      clearOverlay();
    }
  }, [clearOverlay, stopDetection]);

  const detectPeople = useCallback(async () => {
    if (detectionBusyRef.current) {
      return;
    }
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      return;
    }

    detectionBusyRef.current = true;
    try {
      const normalizedDetections = await detectorRef.current.detect(videoRef.current);

      const nowMs = performance.now();
      const { tracks, nextId } = assignTracks(
        tracksRef.current,
        normalizedDetections,
        nowMs,
        nextTrackIdRef.current,
      );
      tracksRef.current = tracks;
      nextTrackIdRef.current = nextId;

      const social = computeSocialMetrics(tracks);
      togethernessRef.current = (0.88 * togethernessRef.current) + (0.12 * social.togetherness);
      const nextMetrics = {
        ...social,
        togethernessSmoothed: togethernessRef.current,
      };

      visualStateRef.current = {
        tracks,
        togetherness: togethernessRef.current,
        movement: nextMetrics.movement,
      };
      setMetrics(nextMetrics);

      if (engineRef.current) {
        engineRef.current.updateScene({
          people: tracks,
          metrics: nextMetrics,
        });
      }
    } catch (detectorError) {
      console.error('Detection error', detectorError);
      setWarning('Detection paused briefly. If this keeps happening, restart the session.');
    } finally {
      detectionBusyRef.current = false;
    }
  }, []);

  const startDetection = useCallback(() => {
    stopDetection();
    detectionIntervalRef.current = window.setInterval(detectPeople, DETECTION_INTERVAL_MS);
  }, [detectPeople, stopDetection]);

  const startSession = useCallback(async () => {
    setError('');
    setWarning('');

    try {
      cleanup(false);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = mediaStream;

      const video = videoRef.current;
      video.srcObject = mediaStream;
      await video.play();
      resizeOverlay();

      detectorRef.current = await createPersonDetector({
        maxPeople: 8,
        onStatus: (status) => setWarning(status),
      });
      setDetectorMode(detectorRef.current.mode);

      await Tone.start();
      const engine = new SoundscapeEngine();
      engine.init();
      engineRef.current = engine;

      if (detectorRef.current.mode === 'face-detector') {
        setWarning('');
      }

      setIsAudioReady(true);
      setIsCameraReady(true);
      setIsRunning(true);
      startDetection();
    } catch (sessionError) {
      console.error('Session start failed', sessionError);
      cleanup();
      if (sessionError instanceof Error && sessionError.message) {
        setError(sessionError.message);
      } else {
        setError('Could not start camera/audio. Check permissions and reload.');
      }
    }
  }, [cleanup, resizeOverlay, startDetection]);

  const stopSession = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    startRenderLoop();
    return () => stopRenderLoop();
  }, [startRenderLoop, stopRenderLoop]);

  useEffect(() => () => cleanup(false), [cleanup]);

  const toneDescription = scoreLabel(metrics.togethernessSmoothed);

  return (
    <div className="soundscapes-page">
      <header className="soundscapes-header">
        <h1>Soundscapes</h1>
        <p>
          Generative ambience from social spacing. Stand close to blend into warmth. Separate to
          pull the harmony into tension.
        </p>
      </header>

      <div className="soundscapes-controls">
        <button
          className="soundscapes-button"
          type="button"
          onClick={isRunning ? stopSession : startSession}
        >
          {isRunning ? <Square size={18} /> : <Play size={18} />}
          {isRunning ? 'Stop Session' : 'Start Session'}
        </button>

        <button
          className="soundscapes-button soundscapes-button-secondary"
          type="button"
          onClick={() => setShowCameraGhost((value) => !value)}
        >
          {showCameraGhost ? <EyeOff size={18} /> : <Eye size={18} />}
          {showCameraGhost ? 'Hide Camera Ghost' : 'Show Camera Ghost'}
        </button>

        <div className="soundscapes-status">
          <span className={isCameraReady ? 'is-on' : 'is-off'}>
            {isCameraReady ? <Camera size={16} /> : <CameraOff size={16} />}
            Camera {isCameraReady ? 'On' : 'Off'}
          </span>
          <span className={isAudioReady ? 'is-on' : 'is-off'}>
            <Waves size={16} />
            Audio {isAudioReady ? 'Active' : 'Idle'}
          </span>
          <span className={isRunning ? 'is-on' : 'is-off'}>
            <Users size={16} />
            {metrics.count} detected
          </span>
          <span className={isRunning ? 'is-on' : 'is-off'}>
            <Cpu size={16} />
            {detectorMode === 'face-detector'
              ? 'Face API'
              : detectorMode === 'coco-ssd'
                ? 'TensorFlow'
                : 'Detector idle'}
          </span>
        </div>
      </div>

      {error && (
        <div className="soundscapes-alert soundscapes-alert-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="soundscapes-alert">
          <AlertTriangle size={16} />
          {warning}
        </div>
      )}

      <div className="soundscapes-stage">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`soundscapes-video ${showCameraGhost ? 'soundscapes-video-visible' : 'soundscapes-video-hidden'}`}
        />
        <canvas ref={canvasRef} className="soundscapes-canvas" />
      </div>

      <div className="soundscapes-metrics">
        <article>
          <h2>Togetherness</h2>
          <p className="metric-value">{formatPercent(metrics.togethernessSmoothed)}</p>
          <p>{toneDescription}</p>
        </article>
        <article>
          <h2>Clusters</h2>
          <p className="metric-value">{metrics.clusters}</p>
          <p>Spatial groups in frame</p>
        </article>
        <article>
          <h2>Isolation</h2>
          <p className="metric-value">{formatPercent(metrics.isolationRatio)}</p>
          <p>People without nearby neighbor</p>
        </article>
        <article>
          <h2>Movement</h2>
          <p className="metric-value">{formatPercent(metrics.movement)}</p>
          <p>Motion energy driving texture</p>
        </article>
      </div>
    </div>
  );
};

export default Soundscapes;
