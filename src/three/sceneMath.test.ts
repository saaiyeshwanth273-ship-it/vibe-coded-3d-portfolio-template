import assert from 'node:assert/strict';
import test from 'node:test';
import { computeScrollCameraPose, layoutStationReticles } from './sceneMath.ts';
import { CIRCUIT_STATIONS } from './stationBuilders.ts';

test('computeScrollCameraPose shifts target for hero text on desktop at scroll=0 and centers when controls are collapsed', () => {
  const openDesktop = computeScrollCameraPose(0, true, false);
  const hiddenDesktop = computeScrollCameraPose(0, true, true);

  assert.ok(openDesktop.targetX < -1.5, 'Desktop open controls should offset target left to frame hero text');
  assert.equal(hiddenDesktop.targetX, 0, 'Collapsed controls should center look-at X at origin');
  assert.equal(hiddenDesktop.targetZ, 0, 'Collapsed controls should center look-at Z at origin');
});

test('computeScrollCameraPose smoothly sweeps orbital azimuth and elevation as scroll progresses', () => {
  const start = computeScrollCameraPose(0, true, false);
  const mid = computeScrollCameraPose(0.5, true, false);
  const end = computeScrollCameraPose(1, true, false);

  assert.notEqual(start.camX, end.camX);
  assert.ok(mid.camY > start.camY, 'Mid-scroll should elevate camera along orbital arc');
  assert.ok(Math.abs(end.targetX) < Math.abs(start.targetX), 'Scrolling down should gradually center the hub');
});

test('layoutStationReticles hides all reticles when controlsCollapsed is true', () => {
  const placed = layoutStationReticles(
    [
      { id: 'projects', sx: 700, sy: 250, ndcZ: 0.2 },
      { id: 'skills', sx: 850, sy: 420, ndcZ: 0.3 },
    ],
    1440,
    900,
    0,
    true,
  );
  assert.equal(placed.length, 0);
});

test('layoutStationReticles filters overlapping labels and excludes left hero text and top-right FPS HUD', () => {
  const placed = layoutStationReticles(
    [
      { id: 'heroOverlap', sx: 220, sy: 300, ndcZ: 0.1 },
      { id: 'blockquoteEdge', sx: 500, sy: 350, ndcZ: 0.15 },
      { id: 'fpsOverlap', sx: 1360, sy: 40, ndcZ: 0.1 },
      { id: 'frontLabel', sx: 800, sy: 350, ndcZ: 0.2 },
      { id: 'collidingBackLabel', sx: 830, sy: 360, ndcZ: 0.5 },
      { id: 'distinctLabel', sx: 1050, sy: 500, ndcZ: 0.4 },
    ],
    1440,
    900,
    0,
    false,
  );

  assert.deepEqual(
    placed.map((p) => p.id),
    ['frontLabel', 'distinctLabel'],
  );
});

test('CIRCUIT_STATIONS routes the 3D RESUME lectern directly to profile-summary', () => {
  const resumeStation = CIRCUIT_STATIONS.find((s) => s.id === 'resume');
  assert.ok(resumeStation, 'RESUME station should exist in CIRCUIT_STATIONS');
  assert.equal(resumeStation.reticleLabel, 'RESUME');
  assert.equal(resumeStation.sectionId, 'profile-summary');
});

test('CIRCUIT_STATIONS routes the CONNECT Collaborate & Message station directly to send-direct-message', () => {
  const connectStation = CIRCUIT_STATIONS.find((s) => s.id === 'connect');
  assert.ok(connectStation, 'CONNECT station should exist in CIRCUIT_STATIONS');
  assert.equal(connectStation.reticleLabel, 'CONNECT');
  assert.equal(connectStation.subtitle, 'Collaborate & Message');
  assert.equal(connectStation.sectionId, 'send-direct-message');
});
