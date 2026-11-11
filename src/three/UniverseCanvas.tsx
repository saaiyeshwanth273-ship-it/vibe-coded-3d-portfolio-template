import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ColorMode } from '../types/portfolio.ts';
import { soundEngine } from '../utils/soundEffects.ts';
import {
  createBrushedMetalMap,
  createCircuitGridTexture,
  createContactShadowTexture,
  createCvSheetTexture,
  createRadialGlowTexture,
  createSiliconDieTexture,
} from './proceduralTextures.ts';
import {
  CIRCUIT_STATIONS,
  buildCircuitHubGroup,
  createMaterialPalette,
} from './stationBuilders.ts';
import {
  ProjectedStationCandidate,
  computeScrollCameraPose,
  layoutStationReticles,
} from './sceneMath.ts';

interface UniverseCanvasProps {
  colorMode: ColorMode;
  highQuality: boolean;
  controlsCollapsed: boolean;
  onSelectStation: (sectionId: string, stationId: string) => void;
  focusedStationId: string | null;
  scrollProgressRef: React.MutableRefObject<number>;
}

// Pre-allocated scratch math helpers (Zero GC in render loop)
const _projVec = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _pulsePos = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function checkWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const ok = Boolean(gl);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export const UniverseCanvas: React.FC<UniverseCanvasProps> = ({
  colorMode,
  highQuality,
  controlsCollapsed,
  onSelectStation,
  focusedStationId,
  scrollProgressRef,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const reticleRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const fpsSpanRef = useRef<HTMLSpanElement | null>(null);

  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [webglSupported] = useState<boolean>(() => checkWebGLAvailable());
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Latest props stored in refs so WebGLRenderer mounts once and never tears down
  const colorRef = useRef<ColorMode>(colorMode);
  const qualityRef = useRef<boolean>(highQuality);
  const collapsedRef = useRef<boolean>(controlsCollapsed);
  const focusedRef = useRef<string | null>(focusedStationId);
  const onSelectRef = useRef(onSelectStation);
  const userInteractingRef = useRef<boolean>(false);
  const canvasWidthRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 1440);

  colorRef.current = colorMode;
  qualityRef.current = highQuality;
  collapsedRef.current = controlsCollapsed;
  focusedRef.current = focusedStationId;
  onSelectRef.current = onSelectStation;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!webglSupported || !mountRef.current) return;

    const container = mountRef.current;
    const isSoftwareGl = detectSoftwareWebGL();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, qualityRef.current ? 2 : 1.25),
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    canvasWidthRef.current = width;
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const darkBg = new THREE.Color(0x050507);
    const lightBg = new THREE.Color(0xf5f5f8);
    scene.background = (colorRef.current === 'dark' ? darkBg : lightBg).clone();
    scene.fog = new THREE.FogExp2(
      colorRef.current === 'dark' ? 0x050507 : 0xf5f5f8,
      0.013,
    );

    // Mandatory Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const initialDesktop = width >= 1024;
    const initialPose = computeScrollCameraPose(
      scrollProgressRef.current || 0,
      initialDesktop,
      collapsedRef.current,
    );
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 160);
    camera.position.set(initialPose.camX, initialPose.camY, initialPose.camZ);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 9;
    controls.maxDistance = 36;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(initialPose.targetX, initialPose.targetY, initialPose.targetZ);

    let userInteractionTimeout = 0;
    controls.addEventListener('start', () => {
      userInteractingRef.current = true;
      window.clearTimeout(userInteractionTimeout);
    });
    controls.addEventListener('end', () => {
      window.clearTimeout(userInteractionTimeout);
      userInteractionTimeout = window.setTimeout(() => {
        userInteractingRef.current = false;
      }, 2800);
    });

    // 3-Point Black, Red & Stark White Neon Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x160307, 0.96);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.72);
    keyLight.position.set(14, 22, 12);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 55;
      keyLight.shadow.camera.left = -16;
      keyLight.shadow.camera.right = 16;
      keyLight.shadow.camera.top = 16;
      keyLight.shadow.camera.bottom = -16;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff1e38, 1.45);
    rimLight.position.set(-16, 12, -14);
    scene.add(rimLight);

    const corePointLight = new THREE.PointLight(0xff1e38, 2.45, 24, 1.55);
    corePointLight.position.set(0, 4.2, 0);
    scene.add(corePointLight);

    // Procedural Textures & Materials
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const darkGridTex = createCircuitGridTexture(true, maxAniso);
    const lightGridTex = createCircuitGridTexture(false, maxAniso);
    const dieTex = createSiliconDieTexture(maxAniso);
    const cvTex = createCvSheetTexture(maxAniso);
    const brushedMap = createBrushedMetalMap();
    const shadowTex = createContactShadowTexture();
    const glowTex = createRadialGlowTexture();

    const mats = createMaterialPalette(brushedMap, shadowTex, dieTex, cvTex);

    // Architectural Circuit Floor Plane
    const floorMat = new THREE.MeshStandardMaterial({
      map: colorRef.current === 'dark' ? darkGridTex : lightGridTex,
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
    });
    const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(78, 78), floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    // Build Enhanced Circuit Command Hub
    const circuit = buildCircuitHubGroup(mats);
    scene.add(circuit.group);

    // Subtle Ambient Telemetry Particle Field (Red & White Neon)
    const particleCount = isSoftwareGl ? 140 : qualityRef.current ? 320 : 160;
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const cRed = new THREE.Color(0xff1e38);
    const cWhite = new THREE.Color(0xffffff);
    const cCrimson = new THREE.Color(0xff4d63);

    for (let i = 0; i < particleCount; i++) {
      const r = 10 + ((i * 7.31) % 24);
      const theta = i * 2.39996;
      const y = 0.9 + ((i * 2.83) % 10);
      pPositions[i * 3] = Math.cos(theta) * r;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = Math.sin(theta) * r;

      const chosen = i % 3 === 0 ? cRed : i % 3 === 1 ? cWhite : cCrimson;
      pColors[i * 3] = chosen.r;
      pColors[i * 3 + 1] = chosen.g;
      pColors[i * 3 + 2] = chosen.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.24,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const ambientPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(ambientPoints);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycaster for Interactive Station Hover & Click
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNDC = new THREE.Vector2();
    let lastRaycastMs = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const updatePointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 60) return;
      lastRaycastMs = now;

      updatePointer(e);
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(circuit.stationInteractables, false);
      if (hits.length > 0) {
        const stId = String(hits[0].object.userData.stationId || '');
        setHoveredStation((prev) => {
          if (prev !== stId) {
            soundEngine.playHover();
          }
          return stId;
        });
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredStation(null);
        renderer.domElement.style.cursor = 'grab';
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 8) return; // Ignore orbit drags

      updatePointer(e);
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(circuit.stationInteractables, false);
      if (hits.length > 0) {
        const stId = String(hits[0].object.userData.stationId || '');
        const secId = String(hits[0].object.userData.sectionId || '');
        if (stId && secId) {
          soundEngine.playSelect();
          onSelectRef.current(secId, stId);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    // Resize Observer
    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // Software-WebGL afterDraw() Pacing + Animation & Scroll Choreography Loop
    let frameId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let elapsed = 0;
    let fpsFrames = 0;
    let fpsLastSample = performance.now();
    let currentAppliedColor: ColorMode = colorRef.current;
    let lastScrollValue = scrollProgressRef.current;
    const reticleCandidates: ProjectedStationCandidate[] = [];

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state =
          sync && gl.getSyncParameter ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync && gl.deleteSync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min(isSoftwareGl ? 0.45 : 0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      // Update FPS counter at 2Hz without React re-render
      fpsFrames += 1;
      if (now - fpsLastSample >= 500) {
        const measured = Math.max(
          1,
          Math.min(120, Math.round((fpsFrames * 1000) / (now - fpsLastSample))),
        );
        if (fpsSpanRef.current) {
          fpsSpanRef.current.textContent = String(measured);
        }
        fpsFrames = 0;
        fpsLastSample = now;
      }

      // Sync Dark / Light Theme inside 3D Scene
      if (currentAppliedColor !== colorRef.current) {
        currentAppliedColor = colorRef.current;
        const isDark = currentAppliedColor === 'dark';
        floorMat.map = isDark ? darkGridTex : lightGridTex;
        floorMat.needsUpdate = true;
        hemiLight.intensity = isDark ? 0.98 : 1.35;
        particleMat.opacity = isDark ? 0.68 : 0.42;
      }

      const targetBg = colorRef.current === 'dark' ? darkBg : lightBg;
      (scene.background as THREE.Color).lerp(targetBg, 1 - Math.exp(-6 * dt));
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(targetBg, 1 - Math.exp(-6 * dt));
      }

      // Scroll-Driven Kinetic Choreography
      const scroll = Math.min(1, Math.max(0, scrollProgressRef.current || 0));
      if (Math.abs(scroll - lastScrollValue) > 0.002) {
        userInteractingRef.current = false;
        lastScrollValue = scroll;
      }

      const isDesktop = canvasWidthRef.current >= 1024;
      const circuitTargetScale = isDesktop && !collapsedRef.current ? 0.9 : 0.98;
      const nextCircuitScale = THREE.MathUtils.damp(circuit.group.scale.x, circuitTargetScale, 6, dt);
      circuit.group.scale.setScalar(nextCircuitScale);

      // Animate Central Core Gyroscope + Station Mechanisms + Scroll Telemetry Acceleration
      const pulseSpeed = 0.28 + scroll * 0.34;
      circuit.animatedParts.cpuCoreRotor.rotation.y = elapsed * 0.6 + scroll * Math.PI * 2;
      circuit.animatedParts.cpuCoreRotor.position.y = 1.48 + Math.sin(elapsed * 2.1) * 0.08 + scroll * 0.25;
      circuit.animatedParts.robotArm.rotation.y = Math.sin(elapsed * 0.95) * 0.52;
      circuit.animatedParts.trophyMedallion.rotation.z = elapsed * 0.9 + scroll * 2.4;
      circuit.animatedParts.radarDish.rotation.y = Math.sin(elapsed * 0.65) * 0.65 + scroll * 1.1;
      circuit.animatedParts.playgroundCore.rotation.y = elapsed * 0.75;
      circuit.animatedParts.playgroundCore.rotation.x = Math.sin(elapsed * 0.5) * 0.3;

      circuit.animatedParts.dataPulses.forEach((p) => {
        const u = (elapsed * pulseSpeed + p.offset) % 1;
        p.curve.getPointAt(u, _pulsePos);
        p.mesh.position.copy(_pulsePos);
      });

      ambientPoints.rotation.y = elapsed * 0.02 + scroll * 0.45;
      corePointLight.intensity = 2.1 + Math.sin(elapsed * 2.2) * 0.22 + scroll * 0.65;

      // Subtle station ring pulse on focused node
      for (const [stId, ringMesh] of circuit.stationRings.entries()) {
        const isFocused = focusedRef.current === stId;
        const targetRingScale = isFocused ? 1.12 + Math.sin(elapsed * 4.2) * 0.04 : 1.0;
        const nextScale = THREE.MathUtils.damp(ringMesh.scale.x, targetRingScale, 8, dt);
        ringMesh.scale.setScalar(nextScale);
      }

      // Camera Choreography (Station Focus > Scroll Orbital Arc)
      if (!userInteractingRef.current) {
        const focused = focusedRef.current
          ? CIRCUIT_STATIONS.find((s) => s.id === focusedRef.current)
          : null;

        if (focused) {
          const s = nextCircuitScale || 1;
          _targetLookAt.set(focused.position.x * s, 1.1, focused.position.z * s);
          _targetCamPos.set(
            focused.position.x * s + (focused.position.x >= 0 ? 5.6 : -5.6),
            5.8,
            focused.position.z * s + 6.6,
          );
        } else {
          const pose = computeScrollCameraPose(scroll, isDesktop, collapsedRef.current);
          _targetLookAt.set(pose.targetX, pose.targetY, pose.targetZ);
          _targetCamPos.set(pose.camX, pose.camY, pose.camZ);
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 4.2, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 4.2, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 4.2, dt);

        controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetLookAt.x, 4.6, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetLookAt.y, 4.6, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetLookAt.z, 4.6, dt);
      }

      controls.update();
      renderer.render(scene, camera);

      // Projected 3D-to-2D Station Reticle Labels with Pairwise De-Overlap & Hide-Controls Support
      const canvasW = renderer.domElement.clientWidth;
      const canvasH = renderer.domElement.clientHeight;
      canvasWidthRef.current = canvasW;

      reticleCandidates.length = 0;
      for (const st of CIRCUIT_STATIONS) {
        _projVec.set(
          st.position.x * nextCircuitScale,
          2.65 * nextCircuitScale,
          st.position.z * nextCircuitScale,
        );
        _projVec.project(camera);
        reticleCandidates.push({
          id: st.id,
          sx: ((_projVec.x + 1) / 2) * canvasW,
          sy: ((-_projVec.y + 1) / 2) * canvasH,
          ndcZ: _projVec.z,
        });
      }

      const accepted = layoutStationReticles(
        reticleCandidates,
        canvasW,
        canvasH,
        scroll,
        collapsedRef.current,
      );

      const acceptedMap = new Map<string, (typeof accepted)[number]>();
      for (const item of accepted) {
        acceptedMap.set(item.id, item);
      }

      for (const st of CIRCUIT_STATIONS) {
        const el = reticleRefs.current.get(st.id);
        if (!el) continue;
        const hit = acceptedMap.get(st.id);
        if (!hit) {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        } else {
          el.style.transform = `translate3d(${hit.sx.toFixed(1)}px, ${hit.sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
          el.style.opacity = '0.95';
          el.style.pointerEvents = 'auto';
        }
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.clearTimeout(userInteractionTimeout);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });

      darkGridTex.dispose();
      lightGridTex.dispose();
      dieTex.dispose();
      cvTex.dispose();
      brushedMap.dispose();
      shadowTex.dispose();
      glowTex.dispose();
      envRT.dispose();
      renderer.dispose();
    };
  }, [webglSupported]);

  // Accessible non-WebGL or Reduced-Motion Static Circuit Hub Fallback
  if (!webglSupported || reducedMotion) {
    return (
      <div
        data-testid="universe-canvas-fallback"
        className="relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#050507] via-[#120408] to-[#050507]"
      >
        <svg
          viewBox="0 0 1200 720"
          className="w-full h-full opacity-75"
          aria-label="Interactive 3D Circuit Command Hub Map"
        >
          <defs>
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="36%">
              <stop offset="0%" stopColor="#FF1E38" stopOpacity="0.68" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#050507" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="720" fill="url(#coreGlow)" />
          <g stroke="#FF1E38" strokeOpacity="0.35" strokeWidth="1.5" fill="none">
            <path d="M600 360 L300 360 L240 200" />
            <path d="M600 360 L600 150" />
            <path d="M600 360 L900 360 L960 200" />
            <path d="M600 360 L980 360" />
            <path d="M600 360 L900 360 L940 530" />
            <path d="M600 360 L600 570" />
            <path d="M600 360 L300 360 L260 530" />
            <path d="M600 360 L220 360" />
            <rect x="540" y="300" width="120" height="120" stroke="#FFFFFF" strokeOpacity="0.7" />
          </g>
        </svg>
        {!controlsCollapsed && (
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 p-8 pointer-events-auto">
            {CIRCUIT_STATIONS.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onSelectStation(st.sectionId, st.id)}
                className="hud-reticle px-4 py-2 text-xs font-mono-hud tracking-wider uppercase bg-[#0B0B10]/95 text-white border border-[#FF1E38]/45 hover:border-white hover:bg-[#FF1E38] transition-colors cursor-pointer"
              >
                {st.reticleLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none">
      {/* Isolated WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        data-testid="universe-canvas"
        aria-label="Interactive 3D Circuit Command Hub"
        className="w-full h-full"
      />

      {/* Top-Right FPS Performance Readout (Hidden when controlsCollapsed) */}
      {!controlsCollapsed && (
        <div
          data-testid="hero-fps-hud"
          className="pointer-events-none absolute top-6 right-6 z-10 hidden sm:flex items-center gap-2 px-2.5 py-1 border border-zinc-300 dark:border-[#FF1E38]/35 bg-white/90 dark:bg-[#050507]/90 text-[11px] font-mono-hud text-zinc-700 dark:text-zinc-300"
        >
          <span className="uppercase tracking-wider opacity-75">FPS</span>
          <span ref={fpsSpanRef} className="font-semibold text-[#E60023] dark:text-[#FF1E38]">
            60
          </span>
        </div>
      )}

      {/* Projected 3D-to-2D Corner-Bracket Reticle Station Labels */}
      <div
        data-testid="station-reticles-layer"
        className="pointer-events-none absolute inset-0 overflow-hidden z-10 hidden lg:block"
      >
        {CIRCUIT_STATIONS.map((st) => {
          const isHovered = hoveredStation === st.id || focusedStationId === st.id;
          return (
            <button
              key={st.id}
              data-station-id={st.id}
              ref={(el) => {
                if (el) reticleRefs.current.set(st.id, el);
                else reticleRefs.current.delete(st.id);
              }}
              type="button"
              onClick={() => {
                soundEngine.playSelect();
                onSelectStation(st.sectionId, st.id);
              }}
              className={`hud-reticle absolute top-0 left-0 px-3 py-1 text-[11px] font-mono-hud tracking-widest uppercase transition-all cursor-pointer whitespace-nowrap border ${
                isHovered
                  ? 'bg-[#FF1E38] border-white text-white font-semibold shadow-[0_0_18px_rgba(255,30,56,0.65)]'
                  : 'bg-white/90 dark:bg-[#07070B]/90 border-zinc-300 dark:border-[#FF1E38]/40 text-zinc-900 dark:text-white hover:border-[#FF1E38] hover:text-[#FF1E38]'
              }`}
              title={`${st.reticleLabel} — ${st.subtitle}`}
            >
              {st.reticleLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
};
