const TFJS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const COCO_SSD_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js';
const MIN_PERSON_SCORE = 0.45;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pendingScripts = new Map();

const createScriptTag = (src) => {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.dataset.codexSrc = src;
  return script;
};

const loadScript = (src) => {
  if (pendingScripts.has(src)) {
    return pendingScripts.get(src);
  }

  const currentScript = document.querySelector(`script[data-codex-src="${src}"]`);
  if (currentScript?.dataset.loaded === 'true') {
    return Promise.resolve();
  }

  const promise = new Promise((resolve, reject) => {
    const script = currentScript ?? createScriptTag(src);

    const handleLoad = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    const handleError = () => {
      reject(new Error(`Failed to load ${src}`));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!currentScript) {
      document.head.appendChild(script);
    }
  });

  pendingScripts.set(src, promise);
  return promise;
};

const normalizeBox = (box, width, height) => {
  const normalizedWidth = clamp(box.width / width, 0, 1);
  const normalizedHeight = clamp(box.height / height, 0, 1);
  const normalizedX = clamp(box.x / width, 0, 1 - normalizedWidth);
  const normalizedY = clamp(box.y / height, 0, 1 - normalizedHeight);

  return {
    x: clamp(normalizedX + (normalizedWidth / 2)),
    y: clamp(normalizedY + (normalizedHeight / 2)),
    bbox: [normalizedX, normalizedY, normalizedWidth, normalizedHeight],
  };
};

const createFaceApiDetector = (maxPeople) => {
  const detector = new window.FaceDetector({
    fastMode: true,
    maxDetectedFaces: maxPeople,
  });

  return {
    mode: 'face-detector',
    detect: async (video) => {
      const width = video.videoWidth || 1;
      const height = video.videoHeight || 1;
      const detections = await detector.detect(video);

      return detections
        .slice(0, maxPeople)
        .map((item) => normalizeBox(item.boundingBox, width, height));
    },
    destroy: () => {},
  };
};

const createTensorFlowDetector = async (maxPeople, onStatus) => {
  onStatus?.('Loading TensorFlow fallback detector...');
  await loadScript(TFJS_SCRIPT_URL);
  await loadScript(COCO_SSD_SCRIPT_URL);

  if (!window.cocoSsd) {
    throw new Error('TensorFlow detector could not be loaded.');
  }

  onStatus?.('Loading person model...');
  const model = await window.cocoSsd.load({
    base: 'lite_mobilenet_v2',
  });

  onStatus?.('TensorFlow fallback active.');
  return {
    mode: 'coco-ssd',
    detect: async (video) => {
      const width = video.videoWidth || 1;
      const height = video.videoHeight || 1;
      const predictions = await model.detect(video, maxPeople);

      return predictions
        .filter((prediction) => prediction.class === 'person' && prediction.score >= MIN_PERSON_SCORE)
        .slice(0, maxPeople)
        .map((prediction) => {
          const [x, y, w, h] = prediction.bbox;
          return normalizeBox({ x, y, width: w, height: h }, width, height);
        });
    },
    destroy: () => {
      if (typeof model.dispose === 'function') {
        model.dispose();
      }
    },
  };
};

export const createPersonDetector = async ({ maxPeople = 8, onStatus } = {}) => {
  if ('FaceDetector' in window) {
    return createFaceApiDetector(maxPeople);
  }

  return createTensorFlowDetector(maxPeople, onStatus);
};
