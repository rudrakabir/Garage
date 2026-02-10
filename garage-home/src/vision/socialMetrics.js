const MATCH_DISTANCE = 0.2;
const CLUSTER_DISTANCE = 0.22;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const normalizedDistance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt((dx * dx) + (dy * dy)) / Math.SQRT2;
};

export const assignTracks = (previousTracks, detections, nowMs, nextId) => {
  const remainingTrackIndexes = new Set(previousTracks.map((_, index) => index));
  const currentTracks = [];
  let currentNextId = nextId;

  detections.forEach((detection) => {
    let bestTrackIndex = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    remainingTrackIndexes.forEach((trackIndex) => {
      const distance = normalizedDistance(detection, previousTracks[trackIndex]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestTrackIndex = trackIndex;
      }
    });

    if (bestTrackIndex !== null && bestDistance <= MATCH_DISTANCE) {
      const matchedTrack = previousTracks[bestTrackIndex];
      const deltaSeconds = Math.max((nowMs - matchedTrack.lastSeen) / 1000, 0.001);

      currentTracks.push({
        id: matchedTrack.id,
        x: detection.x,
        y: detection.y,
        bbox: detection.bbox,
        vx: (detection.x - matchedTrack.x) / deltaSeconds,
        vy: (detection.y - matchedTrack.y) / deltaSeconds,
        lastSeen: nowMs,
      });

      remainingTrackIndexes.delete(bestTrackIndex);
      return;
    }

    currentTracks.push({
      id: currentNextId,
      x: detection.x,
      y: detection.y,
      bbox: detection.bbox,
      vx: 0,
      vy: 0,
      lastSeen: nowMs,
    });
    currentNextId += 1;
  });

  currentTracks.sort((a, b) => a.id - b.id);

  return {
    tracks: currentTracks,
    nextId: currentNextId,
  };
};

const getMeanPairwiseDistance = (people) => {
  if (people.length < 2) {
    return 0;
  }

  let sum = 0;
  let count = 0;

  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      sum += normalizedDistance(people[i], people[j]);
      count += 1;
    }
  }

  return count > 0 ? sum / count : 0;
};

const getClusterCount = (people) => {
  if (people.length === 0) {
    return 0;
  }

  const visited = new Set();
  let clusters = 0;

  for (let i = 0; i < people.length; i += 1) {
    if (visited.has(i)) {
      continue;
    }

    clusters += 1;
    const stack = [i];
    visited.add(i);

    while (stack.length > 0) {
      const current = stack.pop();

      for (let j = 0; j < people.length; j += 1) {
        if (visited.has(j)) {
          continue;
        }

        const distance = normalizedDistance(people[current], people[j]);
        if (distance <= CLUSTER_DISTANCE) {
          visited.add(j);
          stack.push(j);
        }
      }
    }
  }

  return clusters;
};

const getIsolationRatio = (people) => {
  if (people.length === 0) {
    return 0;
  }

  let isolatedCount = 0;

  for (let i = 0; i < people.length; i += 1) {
    let hasNeighbor = false;

    for (let j = 0; j < people.length; j += 1) {
      if (i === j) {
        continue;
      }

      const distance = normalizedDistance(people[i], people[j]);
      if (distance <= CLUSTER_DISTANCE) {
        hasNeighbor = true;
        break;
      }
    }

    if (!hasNeighbor) {
      isolatedCount += 1;
    }
  }

  return isolatedCount / people.length;
};

const getMovementEnergy = (people) => {
  if (people.length === 0) {
    return 0;
  }

  const meanVelocity = people.reduce((sum, person) => {
    const velocity = Math.sqrt((person.vx * person.vx) + (person.vy * person.vy));
    return sum + velocity;
  }, 0) / people.length;

  return clamp(meanVelocity / 2.4, 0, 1);
};

export const computeSocialMetrics = (people) => {
  const count = people.length;
  const movement = getMovementEnergy(people);

  if (count === 0) {
    return {
      count: 0,
      meanDistance: 0,
      clusters: 0,
      isolationRatio: 0,
      movement,
      togetherness: 0.5,
    };
  }

  if (count === 1) {
    return {
      count,
      meanDistance: 1,
      clusters: 1,
      isolationRatio: 1,
      movement,
      togetherness: 0.12,
    };
  }

  const meanDistance = getMeanPairwiseDistance(people);
  const clusters = getClusterCount(people);
  const isolationRatio = getIsolationRatio(people);

  const togetherness = clamp(
    (0.55 * (1 - meanDistance))
      + (0.25 * (1 - ((clusters - 1) / Math.max(1, count - 1))))
      + (0.2 * (1 - isolationRatio)),
    0,
    1,
  );

  return {
    count,
    meanDistance,
    clusters,
    isolationRatio,
    movement,
    togetherness,
  };
};
