export interface CameraPose {
  camX: number;
  camY: number;
  camZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface ProjectedStationCandidate {
  id: string;
  sx: number;
  sy: number;
  ndcZ: number;
}

export interface PlacedStationLabel {
  id: string;
  sx: number;
  sy: number;
  depth: number;
}

/**
 * Computes the deterministic 3D camera & look-at target pose for the Circuit Command Hub
 * as a function of normalized scroll progress [0..1], desktop layout flag, and whether
 * HUD controls/text are collapsed.
 */
export function computeScrollCameraPose(
  rawScroll: number,
  isDesktop: boolean,
  controlsCollapsed: boolean,
): CameraPose {
  const scroll = Math.min(1, Math.max(0, Number.isFinite(rawScroll) ? rawScroll : 0));
  const angle = 0.62 + scroll * 0.92;
  const radius = 22.8 + (20.6 - 22.8) * scroll;
  const elevation = 15.8 + Math.sin(scroll * Math.PI) * 3.1;

  const textClearance = isDesktop && !controlsCollapsed ? 2.25 * (1 - scroll * 0.75) : 0;
  const shiftX = textClearance === 0 ? 0 : -textClearance * Math.cos(angle);
  const shiftZ = textClearance === 0 ? 0 : textClearance * Math.sin(angle);

  const targetY = 0.95 + (0.75 - 0.95) * scroll;

  return {
    camX: Math.sin(angle) * radius + shiftX,
    camY: elevation,
    camZ: Math.cos(angle) * radius + shiftZ,
    targetX: shiftX,
    targetY,
    targetZ: shiftZ,
  };
}

/**
 * Filters and de-overlaps projected 3D-to-2D station reticle coordinates so labels
 * never collide with the left hero typography block, top-right FPS HUD, or each other.
 */
export function layoutStationReticles(
  candidates: ProjectedStationCandidate[],
  canvasW: number,
  canvasH: number,
  scroll: number,
  controlsCollapsed: boolean,
): PlacedStationLabel[] {
  if (controlsCollapsed || canvasW <= 0 || canvasH <= 0) {
    return [];
  }

  const isDesktop = canvasW >= 1024;
  const clampedScroll = Math.min(1, Math.max(0, Number.isFinite(scroll) ? scroll : 0));
  const minX = isDesktop && clampedScroll < 0.28 ? Math.min(685, canvasW * 0.48) : 68;

  const visible: PlacedStationLabel[] = [];
  for (const cand of candidates) {
    if (cand.ndcZ > 1 || cand.ndcZ < -1) continue;
    const inTopRightFpsZone = cand.sx > canvasW - 140 && cand.sy < 72;
    const inBounds =
      cand.sx > minX &&
      cand.sx < canvasW - 68 &&
      cand.sy > 76 &&
      cand.sy < canvasH - 96 &&
      !inTopRightFpsZone;

    if (inBounds) {
      visible.push({ id: cand.id, sx: cand.sx, sy: cand.sy, depth: cand.ndcZ });
    }
  }

  visible.sort((a, b) => a.depth - b.depth);
  const accepted: PlacedStationLabel[] = [];

  for (const item of visible) {
    const collides = accepted.some(
      (other) => Math.abs(other.sx - item.sx) < 112 && Math.abs(other.sy - item.sy) < 34,
    );
    if (!collides) {
      accepted.push(item);
    }
  }

  return accepted;
}
