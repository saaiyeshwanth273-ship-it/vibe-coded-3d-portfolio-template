import * as THREE from 'three';

export interface StationMetadata {
  id: string;
  sectionId: string;
  reticleLabel: string;
  subtitle: string;
  position: THREE.Vector3;
  accentHex: number;
}

export const CIRCUIT_STATIONS: StationMetadata[] = [
  {
    id: 'about',
    sectionId: 'about',
    reticleLabel: 'ABOUT ME',
    subtitle: 'Curiosity · Creation · Leadership',
    position: new THREE.Vector3(-7.6, 0, -7.0),
    accentHex: 0xff1e38,
  },
  {
    id: 'projects',
    sectionId: 'projects',
    reticleLabel: 'PROJECTS',
    subtitle: 'NexusRAG · AeroSense',
    position: new THREE.Vector3(0, 0, -9.2),
    accentHex: 0xffffff,
  },
  {
    id: 'connect',
    sectionId: 'send-direct-message',
    reticleLabel: 'CONNECT',
    subtitle: 'Collaborate & Message',
    position: new THREE.Vector3(8.2, 0, -7.2),
    accentHex: 0xff1e38,
  },
  {
    id: 'resume',
    sectionId: 'profile-summary',
    reticleLabel: 'RESUME',
    subtitle: 'AR Profile Summary',
    position: new THREE.Vector3(9.0, 0, 0.4),
    accentHex: 0xffffff,
  },
  {
    id: 'playground',
    sectionId: 'playground',
    reticleLabel: 'AI PLAYGROUND',
    subtitle: '12 Model Ecosystems',
    position: new THREE.Vector3(7.6, 0, 7.6),
    accentHex: 0xff1e38,
  },
  {
    id: 'skills',
    sectionId: 'skills',
    reticleLabel: 'SKILLS',
    subtitle: 'Interactive Constellation',
    position: new THREE.Vector3(0, 0, 8.8),
    accentHex: 0xffffff,
  },
  {
    id: 'leadership',
    sectionId: 'leadership',
    reticleLabel: 'LEADERSHIP',
    subtitle: 'Student Engineering Council · OpenTech Developer Community · Acme AI Labs',
    position: new THREE.Vector3(-7.0, 0, 6.8),
    accentHex: 0xff3b52,
  },
  {
    id: 'achievements',
    sectionId: 'achievements',
    reticleLabel: 'ACHIEVEMENTS',
    subtitle: 'Medals & Hackathons',
    position: new THREE.Vector3(-8.2, 0, 0.2),
    accentHex: 0xffffff,
  },
];

export interface MaterialPalette {
  obsidian: THREE.MeshStandardMaterial;
  slateMetal: THREE.MeshStandardMaterial;
  brushedChrome: THREE.MeshPhysicalMaterial;
  cyanGlow: THREE.MeshStandardMaterial;
  blueGlow: THREE.MeshStandardMaterial;
  violetGlow: THREE.MeshStandardMaterial;
  goldMetal: THREE.MeshPhysicalMaterial;
  dieTopMat: THREE.MeshStandardMaterial;
  cvDocMat: THREE.MeshStandardMaterial;
  shadowMat: THREE.MeshBasicMaterial;
}

export function createMaterialPalette(
  brushedMap: THREE.CanvasTexture,
  shadowTex: THREE.CanvasTexture,
  dieTex: THREE.CanvasTexture,
  cvTex: THREE.CanvasTexture,
): MaterialPalette {
  return {
    obsidian: new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.7,
      metalness: 0.34,
      bumpMap: brushedMap,
      bumpScale: 0.012,
    }),
    slateMetal: new THREE.MeshStandardMaterial({
      color: 0x181822,
      roughness: 0.36,
      metalness: 0.82,
      bumpMap: brushedMap,
      bumpScale: 0.008,
    }),
    brushedChrome: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.16,
      metalness: 0.94,
      anisotropy: 0.75,
    }),
    cyanGlow: new THREE.MeshStandardMaterial({
      color: 0xff1e38,
      emissive: 0xff1e38,
      emissiveIntensity: 1.7,
      roughness: 0.2,
      metalness: 0.12,
    }),
    blueGlow: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1.45,
      roughness: 0.18,
      metalness: 0.15,
    }),
    violetGlow: new THREE.MeshStandardMaterial({
      color: 0xff3b52,
      emissive: 0xff1e38,
      emissiveIntensity: 1.55,
      roughness: 0.2,
      metalness: 0.15,
    }),
    goldMetal: new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xff1e38,
      emissiveIntensity: 0.48,
      roughness: 0.14,
      metalness: 0.95,
      anisotropy: 0.8,
    }),
    dieTopMat: new THREE.MeshStandardMaterial({
      map: dieTex,
      color: 0xffffff,
      emissiveMap: dieTex,
      emissive: 0xff1e38,
      emissiveIntensity: 0.68,
      roughness: 0.22,
      metalness: 0.68,
    }),
    cvDocMat: new THREE.MeshStandardMaterial({
      map: cvTex,
      color: 0xffffff,
      roughness: 0.52,
      metalness: 0.05,
    }),
    shadowMat: new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.62,
    }),
  };
}

function addContactShadow(group: THREE.Group, mat: THREE.MeshBasicMaterial, radius = 2.2) {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), mat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  group.add(disc);
}

/**
 * Creates a rounded rectangular beveled slab whose bottom rests strictly at local `y = 0`
 * and top rests strictly at local `y = totalHeight`. Zero vertical clipping or Z-fighting.
 */
function createFlushSlab(
  width: number,
  depth: number,
  totalHeight: number,
  bevel = 0.04,
): THREE.ExtrudeGeometry {
  const safeBevel = Math.min(bevel, totalHeight * 0.35);
  const coreDepth = Math.max(0.02, totalHeight - safeBevel * 2);
  const hw = Math.max(0.05, width / 2 - safeBevel);
  const hd = Math.max(0.05, depth / 2 - safeBevel);
  const r = Math.min(0.18, hw * 0.22, hd * 0.22);

  const shape = new THREE.Shape();
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: coreDepth,
    bevelEnabled: true,
    bevelThickness: safeBevel,
    bevelSize: safeBevel,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);
  // Shift so local bounding box bottom sits strictly at y = 0
  geo.translate(0, safeBevel, 0);
  return geo;
}

/**
 * Computes an exit point on the perimeter of a square pad of half-extent `padHalf`
 * along direction `(dx, dz)` so PCB traces terminate cleanly at external terminal sockets.
 */
function perimeterExitPoint(
  cx: number,
  cz: number,
  dx: number,
  dz: number,
  padHalf: number,
  y: number,
): THREE.Vector3 {
  const maxComp = Math.max(Math.abs(dx), Math.abs(dz), 0.0001);
  return new THREE.Vector3(
    cx + (dx / maxComp) * padHalf,
    y,
    cz + (dz / maxComp) * padHalf,
  );
}

/**
 * Builds the Enhanced Central Circuit-Board Processor Core ([ SAAI CORE ]),
 * terminal-to-terminal PCB bus traces, and all 8 Flush-Grounded Composite 3D Stations.
 */
export function buildCircuitHubGroup(mats: MaterialPalette): {
  group: THREE.Group;
  stationInteractables: THREE.Mesh[];
  stationGroups: Map<string, THREE.Group>;
  stationRings: Map<string, THREE.Mesh>;
  animatedParts: {
    cpuCoreRotor: THREE.Group;
    robotArm: THREE.Group;
    trophyMedallion: THREE.Mesh;
    radarDish: THREE.Group;
    playgroundCore: THREE.Mesh;
    dataPulses: Array<{ mesh: THREE.Mesh; curve: THREE.CurvePath<THREE.Vector3>; offset: number }>;
  };
} {
  const group = new THREE.Group();
  const stationInteractables: THREE.Mesh[] = [];
  const stationGroups = new Map<string, THREE.Group>();
  const stationRings = new Map<string, THREE.Mesh>();

  // 1. Central Processor Core ([ SAAI CORE ]) — Bottom at y = 0.02, flush-stacked tiers
  const cpuGroup = new THREE.Group();
  addContactShadow(cpuGroup, mats.shadowMat, 2.85);

  const cpuBaseY = 0.02;
  const cpuSubH = 0.22;
  const cpuSubstrate = new THREE.Mesh(createFlushSlab(3.1, 3.1, cpuSubH, 0.045), mats.obsidian);
  cpuSubstrate.position.y = cpuBaseY;
  cpuGroup.add(cpuSubstrate);

  const cpuTrimY = cpuBaseY + cpuSubH; // 0.24
  const cpuTrimH = 0.2;
  const cpuHeatsink = new THREE.Mesh(
    createFlushSlab(2.45, 2.45, cpuTrimH, 0.04),
    mats.slateMetal,
  );
  cpuHeatsink.position.y = cpuTrimY;
  cpuGroup.add(cpuHeatsink);

  const cpuBezelY = cpuTrimY + cpuTrimH; // 0.44
  const cpuBezelH = 0.14;
  const cpuBezel = new THREE.Mesh(
    createFlushSlab(1.88, 1.88, cpuBezelH, 0.03),
    mats.brushedChrome,
  );
  cpuBezel.position.y = cpuBezelY;
  cpuGroup.add(cpuBezel);

  const cpuDieY = cpuBezelY + cpuBezelH; // 0.58
  const cpuDieH = 0.14;
  const cpuDieSlab = new THREE.Mesh(createFlushSlab(1.48, 1.48, cpuDieH, 0.02), mats.obsidian);
  cpuDieSlab.position.y = cpuDieY;
  cpuGroup.add(cpuDieSlab);

  // Engraved silicon die top cap offset 0.008 above die slab to eliminate Z-fighting
  const dieCap = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.36), mats.dieTopMat);
  dieCap.rotation.x = -Math.PI / 2;
  dieCap.position.y = cpuDieY + cpuDieH + 0.008;
  cpuGroup.add(dieCap);

  // 4-sided IC metallic pins seated cleanly along the substrate perimeter (x/z = ±1.62)
  const pinGeoFB = new THREE.BoxGeometry(0.1, 0.12, 0.22);
  const pinGeoLR = new THREE.BoxGeometry(0.22, 0.12, 0.1);
  for (let i = -3; i <= 3; i++) {
    const pFront = new THREE.Mesh(pinGeoFB, mats.brushedChrome);
    pFront.position.set(i * 0.34, 0.12, 1.62);
    cpuGroup.add(pFront);

    const pBack = new THREE.Mesh(pinGeoFB, mats.brushedChrome);
    pBack.position.set(i * 0.34, 0.12, -1.62);
    cpuGroup.add(pBack);

    const pRight = new THREE.Mesh(pinGeoLR, mats.brushedChrome);
    pRight.position.set(1.62, 0.12, i * 0.34);
    cpuGroup.add(pRight);

    const pLeft = new THREE.Mesh(pinGeoLR, mats.brushedChrome);
    pLeft.position.set(-1.62, 0.12, i * 0.34);
    cpuGroup.add(pLeft);
  }

  // 4 Corner Gold-Plated Capacitor Towers seated flush on substrate corners
  const capGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.22, 14);
  const capOffsets: Array<[number, number]> = [
    [-1.28, -1.28],
    [1.28, -1.28],
    [1.28, 1.28],
    [-1.28, 1.28],
  ];
  for (const [cx, cz] of capOffsets) {
    const cap = new THREE.Mesh(capGeo, mats.goldMetal);
    cap.position.set(cx, cpuTrimY + 0.11, cz);
    cpuGroup.add(cap);
  }

  // Hovering Kinetic Telemetry Ring & Neural Core Rotor above the CPU Die (responds to scroll!)
  const cpuCoreRotor = new THREE.Group();
  cpuCoreRotor.position.set(0, 1.48, 0);

  const innerCorePoly = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), mats.cyanGlow);
  cpuCoreRotor.add(innerCorePoly);

  const gimbalOuter = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.028, 12, 48),
    mats.brushedChrome,
  );
  gimbalOuter.rotation.x = Math.PI / 2;
  cpuCoreRotor.add(gimbalOuter);

  const gimbalInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.022, 10, 40),
    mats.cyanGlow,
  );
  gimbalInner.rotation.x = Math.PI / 3;
  cpuCoreRotor.add(gimbalInner);

  cpuGroup.add(cpuCoreRotor);
  group.add(cpuGroup);

  // 2. Terminal-to-Terminal 90-Degree PCB Traces + Data Pulses (Zero internal clipping!)
  const dataPulses: Array<{
    mesh: THREE.Mesh;
    curve: THREE.CurvePath<THREE.Vector3>;
    offset: number;
  }> = [];

  const traceMat = new THREE.MeshStandardMaterial({
    color: 0x48ddf5,
    emissive: 0x48ddf5,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.4,
  });

  const terminalPadGeo = createFlushSlab(0.26, 0.26, 0.08, 0.015);
  const viaRingGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.07, 14);
  const pulseGeo = new THREE.SphereGeometry(0.11, 12, 10);

  // Subtle outer motherboard perimeter bus trace & corner anchor vias
  const perimPts = [
    new THREE.Vector3(-10.8, 0.045, -10.8),
    new THREE.Vector3(10.8, 0.045, -10.8),
    new THREE.Vector3(10.8, 0.045, 10.8),
    new THREE.Vector3(-10.8, 0.045, 10.8),
    new THREE.Vector3(-10.8, 0.045, -10.8),
  ];
  const perimPath = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < perimPts.length - 1; i++) {
    perimPath.add(new THREE.LineCurve3(perimPts[i], perimPts[i + 1]));
    const cornerVia = new THREE.Mesh(terminalPadGeo, mats.goldMetal);
    cornerVia.position.set(perimPts[i].x, 0.02, perimPts[i].z);
    group.add(cornerVia);
  }
  const perimGeo = new THREE.TubeGeometry(perimPath, 64, 0.026, 6, true);
  group.add(new THREE.Mesh(perimGeo, traceMat));

  CIRCUIT_STATIONS.forEach((st, idx) => {
    const end = st.position;
    const startTerm = perimeterExitPoint(0, 0, end.x, end.z, 1.66, 0.06);
    const endTerm = perimeterExitPoint(end.x, end.z, -end.x, -end.z, 1.28, 0.06);

    // Place beveled terminal socket blocks at both trace endpoints
    const startPad = new THREE.Mesh(terminalPadGeo, mats.goldMetal);
    startPad.position.set(startTerm.x, 0.02, startTerm.z);
    group.add(startPad);

    const endPad = new THREE.Mesh(terminalPadGeo, mats.goldMetal);
    endPad.position.set(endTerm.x, 0.02, endTerm.z);
    group.add(endPad);

    const midX =
      Math.abs(end.x) > 0.5
        ? THREE.MathUtils.lerp(startTerm.x, endTerm.x, 0.52)
        : startTerm.x;
    const p1 = new THREE.Vector3(midX, 0.06, startTerm.z);
    const p2 = new THREE.Vector3(midX, 0.06, endTerm.z);

    // Place gold solder vias at 90-degree trace corners
    if (p1.distanceTo(startTerm) > 0.35 && p1.distanceTo(endTerm) > 0.35) {
      const via1 = new THREE.Mesh(viaRingGeo, mats.goldMetal);
      via1.position.set(p1.x, 0.055, p1.z);
      group.add(via1);
    }
    if (p2.distanceTo(p1) > 0.35 && p2.distanceTo(endTerm) > 0.35) {
      const via2 = new THREE.Mesh(viaRingGeo, mats.goldMetal);
      via2.position.set(p2.x, 0.055, p2.z);
      group.add(via2);
    }

    const path = new THREE.CurvePath<THREE.Vector3>();
    const waypoints = [startTerm, p1, p2, endTerm];
    for (let w = 0; w < waypoints.length - 1; w++) {
      if (waypoints[w].distanceTo(waypoints[w + 1]) > 0.05) {
        path.add(new THREE.LineCurve3(waypoints[w], waypoints[w + 1]));
      }
    }

    const traceGeo = new THREE.TubeGeometry(path, 28, 0.042, 8, false);
    group.add(new THREE.Mesh(traceGeo, traceMat));

    const pulse = new THREE.Mesh(pulseGeo, mats.cyanGlow);
    pulse.position.copy(startTerm);
    group.add(pulse);
    dataPulses.push({ mesh: pulse, curve: path, offset: idx * 0.125 });
  });

  // 3. Build Each of the 8 Flush-Grounded Composite 3D Stations
  let robotArm = new THREE.Group();
  let trophyMedallion = new THREE.Mesh();
  let radarDish = new THREE.Group();
  let playgroundCore = new THREE.Mesh();

  const proxyGeo = new THREE.BoxGeometry(2.9, 2.9, 2.9);
  const proxyMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  const basePlinthGeo = createFlushSlab(2.44, 2.44, 0.18, 0.04);
  const upperTrimGeo = createFlushSlab(2.12, 2.12, 0.1, 0.025);

  for (const st of CIRCUIT_STATIONS) {
    const stGroup = new THREE.Group();
    stGroup.position.copy(st.position);
    addContactShadow(stGroup, mats.shadowMat, 2.15);

    // Tier 1 Base Plinth: y = 0.02 .. 0.20
    const basePlinth = new THREE.Mesh(basePlinthGeo, mats.obsidian);
    basePlinth.position.y = 0.02;
    stGroup.add(basePlinth);

    // Tier 2 Chamfered Upper Deck: y = 0.20 .. 0.30
    const upperTrim = new THREE.Mesh(upperTrimGeo, mats.slateMetal);
    upperTrim.position.y = 0.2;
    stGroup.add(upperTrim);

    // Accent Focus Halo Ring seated cleanly at y = 0.308 (no Z-fighting)
    const accentMat = new THREE.MeshStandardMaterial({
      color: st.accentHex,
      emissive: st.accentHex,
      emissiveIntensity: 0.95,
      roughness: 0.25,
    });
    const focusRing = new THREE.Mesh(new THREE.RingGeometry(0.86, 0.96, 36), accentMat);
    focusRing.rotation.x = -Math.PI / 2;
    focusRing.position.y = 0.308;
    stGroup.add(focusRing);
    stationRings.set(st.id, focusRing);

    // All station structures mount flush onto BASE_Y = 0.30
    const BASE_Y = 0.3;

    if (st.id === 'about') {
      // Architectural Portal & Gateway (Columns + Capitals + Lintel + Suspended Portal Ring)
      const colH = 1.66;
      const leftCol = new THREE.Mesh(new THREE.BoxGeometry(0.3, colH, 0.38), mats.slateMetal);
      leftCol.position.set(-0.7, BASE_Y + colH / 2, 0);
      stGroup.add(leftCol);

      const rightCol = new THREE.Mesh(new THREE.BoxGeometry(0.3, colH, 0.38), mats.slateMetal);
      rightCol.position.set(0.7, BASE_Y + colH / 2, 0);
      stGroup.add(rightCol);

      const capH = 0.1;
      const leftCap = new THREE.Mesh(new THREE.BoxGeometry(0.38, capH, 0.44), mats.goldMetal);
      leftCap.position.set(-0.7, BASE_Y + colH + capH / 2, 0);
      stGroup.add(leftCap);

      const rightCap = new THREE.Mesh(new THREE.BoxGeometry(0.38, capH, 0.44), mats.goldMetal);
      rightCap.position.set(0.7, BASE_Y + colH + capH / 2, 0);
      stGroup.add(rightCap);

      const lintelH = 0.24;
      const lintel = new THREE.Mesh(
        createFlushSlab(1.88, 0.5, lintelH, 0.03),
        mats.brushedChrome,
      );
      lintel.position.set(0, BASE_Y + colH + capH, 0);
      stGroup.add(lintel);

      const portalRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.46, 0.045, 12, 36),
        mats.cyanGlow,
      );
      portalRing.position.set(0, BASE_Y + 0.86, 0);
      stGroup.add(portalRing);
    } else if (st.id === 'projects') {
      // AI Server Rack Cluster (3 Cabinets + Top Caps + Offset LED Bars + Console)
      const rackH = 1.68;
      for (let r = -1; r <= 1; r++) {
        const rx = r * 0.64;
        const rack = new THREE.Mesh(new THREE.BoxGeometry(0.5, rackH, 0.66), mats.slateMetal);
        rack.position.set(rx, BASE_Y + rackH / 2, -0.24);
        stGroup.add(rack);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.68), mats.brushedChrome);
        cap.position.set(rx, BASE_Y + rackH + 0.03, -0.24);
        stGroup.add(cap);

        // LED strips offset cleanly to z = 0.11 (front face of rack is -0.24 + 0.33 = 0.09)
        const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.03), mats.cyanGlow);
        led1.position.set(rx, BASE_Y + 1.36, 0.11);
        stGroup.add(led1);

        const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.03), mats.blueGlow);
        led2.position.set(rx, BASE_Y + 1.06, 0.11);
        stGroup.add(led2);
      }

      const deskH = 0.44;
      const consoleDesk = new THREE.Mesh(
        createFlushSlab(1.44, 0.48, deskH, 0.03),
        mats.brushedChrome,
      );
      consoleDesk.position.set(0, BASE_Y, 0.56);
      stGroup.add(consoleDesk);

      const screenStand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.12), mats.slateMetal);
      screenStand.position.set(0, BASE_Y + deskH + 0.11, 0.56);
      stGroup.add(screenStand);

      const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.42, 0.05), mats.cyanGlow);
      monitor.position.set(0, BASE_Y + deskH + 0.34, 0.54);
      monitor.rotation.x = -0.22;
      stGroup.add(monitor);
    } else if (st.id === 'connect') {
      // Deep-Space Telemetry Dish Array (Pedestal + Mast + Gimbal Yoke + Parabolic Dish)
      const pedH = 0.28;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.58, pedH, 8), mats.obsidian);
      ped.position.set(0, BASE_Y + pedH / 2, 0);
      stGroup.add(ped);

      const mastH = 0.96;
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.24, mastH, 16),
        mats.slateMetal,
      );
      mast.position.set(0, BASE_Y + pedH + mastH / 2, 0);
      stGroup.add(mast);

      const yokeY = BASE_Y + pedH + mastH; // 1.54
      const yoke = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16), mats.goldMetal);
      yoke.position.set(0, yokeY + 0.08, 0);
      stGroup.add(yoke);

      // Pivot radarDish well above yoke (y = 1.92) so tilted dish rim never touches mast
      radarDish = new THREE.Group();
      radarDish.position.set(0, yokeY + 0.38, 0);

      const points = [
        new THREE.Vector2(0.01, 0),
        new THREE.Vector2(0.42, 0.11),
        new THREE.Vector2(0.78, 0.36),
        new THREE.Vector2(0.94, 0.58),
      ];
      const dishGeo = new THREE.LatheGeometry(points, 28);
      dishGeo.computeVertexNormals();
      const dishMat = mats.brushedChrome.clone();
      dishMat.side = THREE.DoubleSide;
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = Math.PI / 5;
      radarDish.add(dishMesh);

      const feedHorn = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), mats.cyanGlow);
      feedHorn.position.set(0, 0.38, 0.28);
      radarDish.add(feedHorn);

      stGroup.add(radarDish);
    } else if (st.id === 'resume') {
      // Verified Curriculum Vitae Dossier Pedestal (Flush Lectern + Framed Engraved CV)
      const pedH = 0.58;
      const lectern = new THREE.Mesh(
        createFlushSlab(1.25, 0.72, pedH, 0.03),
        mats.slateMetal,
      );
      lectern.position.set(0, BASE_Y, 0.08);
      stGroup.add(lectern);

      const deskH = 0.1;
      const deskTop = new THREE.Mesh(
        createFlushSlab(1.56, 0.88, deskH, 0.025),
        mats.brushedChrome,
      );
      deskTop.position.set(0, BASE_Y + pedH, 0.06);
      stGroup.add(deskTop);

      const frameY = BASE_Y + pedH + deskH; // 0.98
      const frameH = 1.16;
      const backing = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, frameH, 0.08),
        mats.slateMetal,
      );
      backing.position.set(0, frameY + frameH / 2, -0.06);
      stGroup.add(backing);

      const docSheet = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.04), mats.cvDocMat);
      docSheet.position.set(0, frameY + frameH / 2, -0.014);
      stGroup.add(docSheet);

      const goldSeal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18),
        mats.goldMetal,
      );
      goldSeal.rotation.x = Math.PI / 2;
      goldSeal.position.set(0.24, frameY + 0.24, -0.005);
      stGroup.add(goldSeal);
    } else if (st.id === 'playground') {
      // Neural Computation Chamber (Stepped Emitter + 4 Fins + Levitating Polyhedron)
      const emitterH = 0.44;
      const emitter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.74, emitterH, 20),
        mats.slateMetal,
      );
      emitter.position.set(0, BASE_Y + emitterH / 2, 0);
      stGroup.add(emitter);

      const emitterRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.58, 0.58, 0.06, 20),
        mats.cyanGlow,
      );
      emitterRing.position.set(0, BASE_Y + emitterH + 0.03, 0);
      stGroup.add(emitterRing);

      for (let f = 0; f < 4; f++) {
        const ang = (f / 4) * Math.PI * 2 + Math.PI / 4;
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.62, 0.24), mats.brushedChrome);
        fin.position.set(Math.cos(ang) * 0.68, BASE_Y + 0.31, Math.sin(ang) * 0.68);
        fin.rotation.y = -ang;
        stGroup.add(fin);
      }

      playgroundCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), mats.violetGlow);
      playgroundCore.position.set(0, BASE_Y + 1.24, 0);
      stGroup.add(playgroundCore);

      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.035, 10, 36), mats.cyanGlow);
      halo.position.set(0, BASE_Y + 1.24, 0);
      halo.rotation.x = Math.PI / 3;
      stGroup.add(halo);
    } else if (st.id === 'skills') {
      // Articulated Robotic Manipulator Holding Glowing Energy Cube
      const turretH = 0.38;
      const turret = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.66, turretH, 20),
        mats.slateMetal,
      );
      turret.position.set(0, BASE_Y + turretH / 2, 0);
      stGroup.add(turret);

      const shoulderH = 0.16;
      const shoulder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.38, shoulderH, 16),
        mats.goldMetal,
      );
      shoulder.position.set(0, BASE_Y + turretH + shoulderH / 2, 0);
      stGroup.add(shoulder);

      robotArm = new THREE.Group();
      robotArm.position.set(0, BASE_Y + turretH + shoulderH, 0); // 0.84

      const lowerBoom = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.82, 0.24), mats.brushedChrome);
      lowerBoom.position.set(-0.08, 0.38, 0);
      lowerBoom.rotation.z = 0.22;
      robotArm.add(lowerBoom);

      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), mats.slateMetal);
      elbow.position.set(-0.17, 0.78, 0);
      robotArm.add(elbow);

      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.2, 0.2), mats.brushedChrome);
      upperArm.position.set(0.22, 0.82, 0);
      robotArm.add(upperArm);

      const wrist = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.34), mats.slateMetal);
      wrist.position.set(0.62, 0.82, 0);
      robotArm.add(wrist);

      const glowingCube = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), mats.cyanGlow);
      glowingCube.position.set(0.92, 0.82, 0);
      robotArm.add(glowingCube);

      stGroup.add(robotArm);
    } else if (st.id === 'leadership') {
      // Hexagonal Governance Table & Council Beacons (Flush tabletop + anchored pillars)
      const colH = 0.48;
      const tableBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.56, 0.7, colH, 6),
        mats.obsidian,
      );
      tableBase.position.set(0, BASE_Y + colH / 2, 0);
      stGroup.add(tableBase);

      const topH = 0.12;
      const tableTopY = BASE_Y + colH; // 0.78
      const tableTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.96, 0.88, topH, 6),
        mats.slateMetal,
      );
      tableTop.position.set(0, tableTopY + topH / 2, 0);
      stGroup.add(tableTop);

      const surfaceY = tableTopY + topH; // 0.90
      const holoMap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.54, 0.54, 0.04, 6),
        mats.goldMetal,
      );
      holoMap.position.set(0, surfaceY + 0.02, 0);
      stGroup.add(holoMap);

      const pillarH = 0.72;
      for (let p = 0; p < 3; p++) {
        const a = (p / 3) * Math.PI * 2;
        const px = Math.cos(a) * 0.68;
        const pz = Math.sin(a) * 0.68;
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.18, pillarH, 0.18),
          mats.brushedChrome,
        );
        pillar.position.set(px, surfaceY + pillarH / 2, pz);
        stGroup.add(pillar);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mats.cyanGlow);
        beacon.position.set(px, surfaceY + pillarH + 0.11, pz);
        stGroup.add(beacon);
      }
    } else if (st.id === 'achievements') {
      // Honor Pedestal & Elevated Spinning Gold Medallion (Zero clipping into pedestal!)
      const colH = 0.78;
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.54, colH, 20),
        mats.slateMetal,
      );
      column.position.set(0, BASE_Y + colH / 2, 0);
      stGroup.add(column);

      const capH = 0.12;
      const capY = BASE_Y + colH; // 1.08
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.42, capH, 20), mats.brushedChrome);
      cap.position.set(0, capY + capH / 2, 0);
      stGroup.add(cap);

      const cradleY = capY + capH; // 1.20
      const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.24), mats.goldMetal);
      cradle.position.set(0, cradleY + 0.08, 0);
      stGroup.add(cradle);

      // Center medallion & outer laurel ring at y = 1.98 so bottom (1.98 - 0.62 = 1.36) sits cleanly on cradle top!
      const medalCenterY = cradleY + 0.78; // 1.98
      trophyMedallion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.44, 0.44, 0.12, 28),
        mats.goldMetal,
      );
      trophyMedallion.rotation.x = Math.PI / 2;
      trophyMedallion.position.set(0, medalCenterY, 0);
      stGroup.add(trophyMedallion);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 12, 36), mats.goldMetal);
      ring.position.set(0, medalCenterY, 0);
      stGroup.add(ring);
    }

    // Invisible raycast collision box enclosing the entire 3D station mesh
    const hitBox = new THREE.Mesh(proxyGeo, proxyMat);
    hitBox.position.y = 1.45;
    hitBox.layers.set(1);
    hitBox.userData = { stationId: st.id, sectionId: st.sectionId };
    stGroup.add(hitBox);
    stationInteractables.push(hitBox);

    group.add(stGroup);
    stationGroups.set(st.id, stGroup);
  }

  // Assign crisp studio shadows to solid structural hardware (excluding decals, glows, and raycast proxies)
  group.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    const mat = mesh.material;
    if (mat === proxyMat || mat === mats.shadowMat || mat === traceMat) return;
    if (mat === mats.cyanGlow || mat === mats.blueGlow || mat === mats.violetGlow) return;
    if (mat === mats.dieTopMat || mat === mats.cvDocMat) {
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      return;
    }
    if (!Array.isArray(mat) && mat instanceof THREE.MeshStandardMaterial && mat.emissiveIntensity > 0.8) {
      return;
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return {
    group,
    stationInteractables,
    stationGroups,
    stationRings,
    animatedParts: {
      cpuCoreRotor,
      robotArm,
      trophyMedallion,
      radarDish,
      playgroundCore,
      dataPulses,
    },
  };
}
