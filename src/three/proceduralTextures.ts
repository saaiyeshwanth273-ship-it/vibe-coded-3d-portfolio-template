import * as THREE from 'three';

/**
 * Generates a razor-sharp architectural circuit grid texture for the Isometric Hub floor
 * in a Black, Red, and White Neon palette.
 */
export function createCircuitGridTexture(
  isDark: boolean,
  maxAnisotropy: number,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isDark ? '#050508' : '#F4F4F8';
  ctx.fillRect(0, 0, size, size);

  // Subtle sub-grid lines in crimson neon
  ctx.strokeStyle = isDark ? 'rgba(255, 30, 56, 0.09)' : 'rgba(220, 20, 48, 0.09)';
  ctx.lineWidth = 1;
  const subStep = size / 8;
  for (let i = 0; i <= 8; i++) {
    const p = i * subStep;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Primary architectural tile border in neon red
  ctx.strokeStyle = isDark ? 'rgba(255, 30, 56, 0.28)' : 'rgba(220, 20, 48, 0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  // Stark white neon corner intersection crosshairs
  ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.72)' : 'rgba(15, 15, 20, 0.65)';
  const cross = 7;
  ctx.fillRect(0, 0, cross, 2);
  ctx.fillRect(0, 0, 2, cross);
  ctx.fillRect(size - cross, 0, cross, 2);
  ctx.fillRect(size - 2, 0, 2, cross);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an engraved quantum processor die texture for the central SAAI CORE
 * in Black, Red, and White Neon.
 */
export function createSiliconDieTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#07070B';
  ctx.fillRect(0, 0, size, size);

  // Outer neon red circuit framing
  ctx.strokeStyle = 'rgba(255, 30, 56, 0.75)';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, size - 48, size - 48);

  // Inner stark white neon framing
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, size - 92, size - 92);

  // Micro-core matrix grid
  ctx.fillStyle = 'rgba(255, 30, 56, 0.16)';
  for (let gx = 0; gx < 6; gx++) {
    for (let gy = 0; gy < 6; gy++) {
      ctx.fillRect(72 + gx * 64, 72 + gy * 64, 48, 48);
      ctx.strokeStyle = 'rgba(255, 30, 56, 0.44)';
      ctx.lineWidth = 1;
      ctx.strokeRect(72 + gx * 64, 72 + gy * 64, 48, 48);
    }
  }

  // Central luminous emblem
  ctx.fillStyle = 'rgba(7, 7, 11, 0.95)';
  ctx.fillRect(156, 206, 200, 100);
  ctx.strokeStyle = '#FF1E38';
  ctx.lineWidth = 3;
  ctx.strokeRect(156, 206, 200, 100);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SAAI CORE', size / 2, size / 2 - 10);

  ctx.fillStyle = '#FF2A42';
  ctx.font = '600 15px monospace';
  ctx.fillText('AI · ML · ENGINE', size / 2, size / 2 + 20);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy || 1);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an engraved CV document surface texture for the Resume station lectern.
 */
export function createCvSheetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#09090D';
  ctx.fillRect(20, 22, 145, 14);

  ctx.fillStyle = '#FF1E38';
  ctx.fillRect(20, 44, 185, 6);

  ctx.fillStyle = '#09090D';
  ctx.fillRect(20, 66, 216, 3);

  for (let row = 0; row < 8; row++) {
    const y = 84 + row * 19;
    ctx.fillStyle = row % 3 === 0 ? '#FF1E38' : '#71717A';
    ctx.fillRect(20, y, row % 3 === 0 ? 110 : 196 - (row % 2) * 28, row % 3 === 0 ? 7 : 5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAnisotropy || 1);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a tileable grayscale brushed-metal bump/roughness map for PBR stations.
 */
export function createBrushedMetalMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const shade = 110 + Math.floor(Math.sin(y * 1.7) * 18 + (y % 5) * 4);
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, size, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a soft radial contact shadow disc texture for grounding 3D stations.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    4,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  grad.addColorStop(0.55, 'rgba(10, 2, 4, 0.36)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a crisp circular neon red/white glow sprite texture for ambient data particles.
 */
export function createRadialGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.35, 'rgba(255, 42, 66, 0.78)');
  grad.addColorStop(1, 'rgba(255, 30, 56, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
