import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type PetType, getPetStage } from '../lib/petSystem';

interface PetCanvas3DProps {
  petType?: PetType;
  level: number;
  isInteracting?: boolean;
  onPetClick?: () => void;
  mode?: 'lobby' | 'ingame';
}

/**
 * Sintetizador Web Audio de sonidos cartoon tiernos:
 * - Zorro: Chirrido alegre "yip / boing"
 * - Gato: Maullido tierno y dulce "*miau*"
 */
function playMascotSound(type: PetType) {
  try {
    const isMuted = localStorage.getItem('memorize_sound_muted') === 'true';
    if (isMuted) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'cat') {
      // Maullido tierno de gatito (miau)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } else {
      // Chirrido juguetón de zorro
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(460, now);
      osc1.frequency.exponentialRampToValueAtTime(920, now + 0.06);
      osc1.frequency.exponentialRampToValueAtTime(1380, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(230, now);
      osc2.frequency.exponentialRampToValueAtTime(690, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.22);
      osc2.stop(now + 0.22);
    }
  } catch {
    // Audio protegido
  }
}

export function PetCanvas3D({
  petType = 'fox',
  level,
  isInteracting,
  onPetClick,
  mode = 'lobby',
}: PetCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerJumpRef = useRef<(() => void) | null>(null);
  const stage = getPetStage(level);

  useEffect(() => {
    if (isInteracting && triggerJumpRef.current) {
      triggerJumpRef.current();
    }
  }, [isInteracting]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isIngame = mode === 'ingame';

    // 1. Escena, Cámara y Renderer 3D
    const width = container.clientWidth || (isIngame ? 260 : 380);
    const height = container.clientHeight || (isIngame ? 208 : 340);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    if (isIngame) {
      // En partida: encuadre completo de cuerpo entero (orejas a pedestal)
      camera.position.set(0, 0.22, 4.45);
      camera.lookAt(0, 0.22, 0);
    } else {
      // En el Lobby: encuadre original, elegante y centrado en el pedestal
      camera.position.set(0, 0.35, 4.3);
      camera.lookAt(0, 0.20, 0);
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    container.appendChild(renderer.domElement);

    // 2. Colores temáticos dinámicos
    const isCat = petType === 'cat';
    const primaryThemeColor = isCat ? 0xa78bfa : 0xff7a00;
    const accentThemeColor = isCat ? 0x00ffb4 : 0x00f0ff;

    // 3. Iluminación Cinematográfica Estilizada (Estilo Pixar)
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 0.95);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff0e4, 1.55);
    keyLight.position.set(3.5, 4.5, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(accentThemeColor, 3.2, 10);
    rimLight.position.set(-3.2, 2.4, -2.5);
    scene.add(rimLight);

    const warmBounce = new THREE.PointLight(primaryThemeColor, 2.2, 8);
    warmBounce.position.set(2.8, -0.4, 2.0);
    scene.add(warmBounce);

    const underLight = new THREE.PointLight(accentThemeColor, 1.8, 6);
    underLight.position.set(0, -1.2, 1);
    scene.add(underLight);

    // 4. Pedestal Holográfico
    const pedestalGroup = new THREE.Group();
    scene.add(pedestalGroup);

    // Sombra suave proyectada en el suelo
    const shadowGeo = new THREE.PlaneGeometry(2.4, 1.4);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const sCtx = canvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(5, 10, 22, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(canvas);

    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.02, 0);
    pedestalGroup.add(shadowMesh);

    // Anillos concéntricos giratorios
    const ringGeo1 = new THREE.TorusGeometry(1.5, 0.016, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: primaryThemeColor,
      transparent: true,
      opacity: 0.75,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.y = -1.03;
    pedestalGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.15, 0.012, 16, 48);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: accentThemeColor,
      transparent: true,
      opacity: 0.85,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.y = -1.03;
    pedestalGroup.add(ring2);

    const discGeo = new THREE.CylinderGeometry(1.4, 1.5, 0.08, 36);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      metalness: 0.8,
      roughness: 0.2,
      emissive: primaryThemeColor,
      emissiveIntensity: 0.15,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.y = -1.08;
    disc.receiveShadow = true;
    pedestalGroup.add(disc);

    // 5. MASTER GROUP DEL PERSONAJE ANIMADO
    const mascotMasterGroup = new THREE.Group();
    scene.add(mascotMasterGroup);

    // Materiales comunes de alta calidad visual
    const mainFurMat = new THREE.MeshStandardMaterial({
      color: isCat ? 0x8b6de8 : 0xff6b1a, // Violeta cósmico suave para gato, Naranja dorado para zorro
      roughness: 0.35,
      metalness: 0.04,
      emissive: isCat ? 0x4a2e9e : 0xff3800,
      emissiveIntensity: stage >= 3 ? 0.25 : stage >= 2 ? 0.15 : 0.06,
    });

    const creamFurMat = new THREE.MeshStandardMaterial({
      color: 0xfffaf4,
      roughness: 0.42,
      metalness: 0.02,
    });

    const darkAccentMat = new THREE.MeshStandardMaterial({
      color: 0x161c2c,
      roughness: 0.2,
      metalness: 0.1,
    });

    const pinkAccentMat = new THREE.MeshStandardMaterial({
      color: 0xff8aa5, // Rosa suave para naricita de gato y huellitas
      roughness: 0.4,
    });

    const innerEarMat = new THREE.MeshStandardMaterial({
      color: isCat ? 0xffb2c4 : 0xffc4b8,
      roughness: 0.5,
    });

    const eyeIrisMat = new THREE.MeshBasicMaterial({
      color: isCat ? 0x00ffb4 : 0x00f0ff, // Ojos verde esmeralda / menta para gato, cian para zorro
    });

    const eyePupilMat = new THREE.MeshBasicMaterial({
      color: 0x050912,
    });

    const eyeGlintMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    // ── TORSO / CUERPO TIERNO ──
    const bodyGroup = new THREE.Group();
    mascotMasterGroup.add(bodyGroup);

    const torsoGeo = new THREE.SphereGeometry(isCat ? 0.66 : 0.68, 32, 28);
    torsoGeo.scale(isCat ? 0.95 : 0.9, 1.1, 0.88);
    const torso = new THREE.Mesh(torsoGeo, mainFurMat);
    torso.position.set(0, -0.22, 0);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Pechera blanca suave
    const chestGeo = new THREE.SphereGeometry(0.5, 24, 20);
    chestGeo.scale(0.72, 0.95, 0.58);
    const chest = new THREE.Mesh(chestGeo, creamFurMat);
    chest.position.set(0, -0.24, 0.32);
    bodyGroup.add(chest);

    // Patitas delanteras tiernas
    const pawGeo = new THREE.SphereGeometry(0.14, 18, 18);
    pawGeo.scale(0.9, 0.68, 1.3);

    const pawLeft = new THREE.Mesh(pawGeo, creamFurMat);
    pawLeft.position.set(-0.28, -0.84, 0.42);
    bodyGroup.add(pawLeft);

    const pawRight = new THREE.Mesh(pawGeo, creamFurMat);
    pawRight.position.set(0.28, -0.84, 0.42);
    bodyGroup.add(pawRight);

    // Huellitas rosaditas si es gatito (Cute toe beans)
    if (isCat) {
      const beanGeo = new THREE.SphereGeometry(0.045, 12, 12);
      beanGeo.scale(1.2, 0.4, 0.9);
      const beanL = new THREE.Mesh(beanGeo, pinkAccentMat);
      beanL.position.set(-0.28, -0.86, 0.52);
      bodyGroup.add(beanL);

      const beanR = new THREE.Mesh(beanGeo, pinkAccentMat);
      beanR.position.set(0.28, -0.86, 0.52);
      bodyGroup.add(beanR);
    }

    // ── CABEZA ADORABLE ──
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.65, 0.12);
    mascotMasterGroup.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.58, 32, 32);
    headGeo.scale(isCat ? 1.16 : 1.12, isCat ? 0.96 : 0.98, 0.96);
    const head = new THREE.Mesh(headGeo, mainFurMat);
    head.castShadow = true;
    headGroup.add(head);

    // ── MEJILLAS SUTILES (Pómulos reducidos y estilizados) ──
    // Se elimina el exceso de volumen blanco en los pómulos para un rostro mucho más tierno y estilizado
    const cheekGeo = new THREE.SphereGeometry(0.10, 14, 14);
    cheekGeo.scale(0.7, 0.45, 0.35);

    if (!isCat) {
      // En el zorro: mechones de pelaje muy sutiles y delicados pegados a la mandíbula
      const cheekL = new THREE.Mesh(cheekGeo, creamFurMat);
      cheekL.position.set(-0.36, -0.18, 0.22);
      cheekL.rotation.z = 0.25;
      headGroup.add(cheekL);

      const cheekR = new THREE.Mesh(cheekGeo, creamFurMat);
      cheekR.position.set(0.36, -0.18, 0.22);
      cheekR.rotation.z = -0.25;
      headGroup.add(cheekR);
    }

    // ── RUBOR TIERNO BAJO LOS OJOS (Pastel Anime Blush) ──
    const blushMat = new THREE.MeshBasicMaterial({
      color: isCat ? 0xff7098 : 0xff5544,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
    });
    const blushGeo = new THREE.SphereGeometry(0.08, 14, 14);
    blushGeo.scale(1.25, 0.55, 0.15);

    const blushL = new THREE.Mesh(blushGeo, blushMat);
    const blushR = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.27, -0.04, 0.51);
    blushR.position.set(0.27, -0.04, 0.51);
    headGroup.add(blushL);
    headGroup.add(blushR);

    // ── HOCICO TIERNO Y ESTILIZADO ──
    if (isCat) {
      // Hocico compacto y dulce de gatito (:3)
      const muzzleLGeo = new THREE.SphereGeometry(0.095, 16, 16);
      muzzleLGeo.scale(1.0, 0.8, 0.7);
      const muzzleL = new THREE.Mesh(muzzleLGeo, creamFurMat);
      muzzleL.position.set(-0.075, -0.14, 0.50);
      headGroup.add(muzzleL);

      const muzzleRGeo = new THREE.SphereGeometry(0.095, 16, 16);
      muzzleRGeo.scale(1.0, 0.8, 0.7);
      const muzzleR = new THREE.Mesh(muzzleRGeo, creamFurMat);
      muzzleR.position.set(0.075, -0.14, 0.50);
      headGroup.add(muzzleR);

      // Naricita diminuta de botón rosa
      const catNoseGeo = new THREE.ConeGeometry(0.042, 0.055, 16);
      catNoseGeo.rotateZ(Math.PI);
      catNoseGeo.scale(1.1, 1, 0.7);
      const catNose = new THREE.Mesh(catNoseGeo, pinkAccentMat);
      catNose.position.set(0, -0.09, 0.56);
      headGroup.add(catNose);

      // Bigotes finos y elegantes de gato (3 a cada lado)
      const whiskerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      for (let w = 0; w < 3; w++) {
        const angle = (w - 1) * 0.12;
        const whiskerGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.26, 8);
        whiskerGeo.rotateZ(Math.PI / 2 + angle);

        const wL = new THREE.Mesh(whiskerGeo, whiskerMat);
        wL.position.set(-0.22, -0.14 + (w - 1) * 0.03, 0.51);
        headGroup.add(wL);

        const wR = new THREE.Mesh(whiskerGeo, whiskerMat);
        wR.position.set(0.22, -0.14 + (w - 1) * 0.03, 0.51);
        headGroup.add(wR);
      }
    } else {
      // Hocico fino y delicado de zorro (sin bultos laterales excesivos)
      const snoutGeo = new THREE.ConeGeometry(0.21, 0.40, 20);
      snoutGeo.rotateX(Math.PI / 2);
      const snout = new THREE.Mesh(snoutGeo, creamFurMat);
      snout.position.set(0, -0.11, 0.51);
      headGroup.add(snout);

      // Nariz redondita negra brillante
      const noseGeo = new THREE.SphereGeometry(0.055, 16, 16);
      noseGeo.scale(1.1, 0.85, 0.9);
      const nose = new THREE.Mesh(noseGeo, darkAccentMat);
      nose.position.set(0, -0.10, 0.73);
      headGroup.add(nose);
    }

    // ── OJOS EXPRESIVOS BRILLANTES (Estilo Pixar) ──
    const eyeGroupL = new THREE.Group();
    const eyeGroupR = new THREE.Group();
    eyeGroupL.position.set(-0.25, 0.08, 0.48);
    eyeGroupR.position.set(0.25, 0.08, 0.48);
    headGroup.add(eyeGroupL);
    headGroup.add(eyeGroupR);

    const eyeGeo = new THREE.SphereGeometry(0.12, 20, 20);
    eyeGeo.scale(0.85, 1.15, 0.45);

    const eyeWhiteL = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const eyeWhiteR = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eyeWhiteL.rotation.y = -0.18;
    eyeWhiteR.rotation.y = 0.18;
    eyeGroupL.add(eyeWhiteL);
    eyeGroupR.add(eyeWhiteR);

    // Iris luminoso
    const irisGeo = new THREE.SphereGeometry(0.08, 16, 16);
    irisGeo.scale(0.85, 1.05, 0.25);
    const irisL = new THREE.Mesh(irisGeo, eyeIrisMat);
    const irisR = new THREE.Mesh(irisGeo, eyeIrisMat);
    irisL.position.set(0, 0, 0.035);
    irisR.position.set(0, 0, 0.035);
    eyeGroupL.add(irisL);
    eyeGroupR.add(irisR);

    // Pupila
    const pupilGeo = new THREE.SphereGeometry(0.045, 14, 14);
    pupilGeo.scale(isCat ? 0.7 : 0.9, 1.0, 0.2); // Pupila rasgada sutil si es gato
    const pupilL = new THREE.Mesh(pupilGeo, eyePupilMat);
    const pupilR = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupilL.position.set(0, 0, 0.05);
    pupilR.position.set(0, 0, 0.05);
    eyeGroupL.add(pupilL);
    eyeGroupR.add(pupilR);

    // Destellos especulares dobles (Glints)
    const glintMainGeo = new THREE.SphereGeometry(0.026, 12, 12);
    const glintL1 = new THREE.Mesh(glintMainGeo, eyeGlintMat);
    const glintR1 = new THREE.Mesh(glintMainGeo, eyeGlintMat);
    glintL1.position.set(0.02, 0.03, 0.065);
    glintR1.position.set(0.02, 0.03, 0.065);
    eyeGroupL.add(glintL1);
    eyeGroupR.add(glintR1);

    const glintSmallGeo = new THREE.SphereGeometry(0.013, 10, 10);
    const glintL2 = new THREE.Mesh(glintSmallGeo, eyeGlintMat);
    const glintR2 = new THREE.Mesh(glintSmallGeo, eyeGlintMat);
    glintL2.position.set(-0.018, -0.025, 0.065);
    glintR2.position.set(-0.018, -0.025, 0.065);
    eyeGroupL.add(glintL2);
    eyeGroupR.add(glintR2);

    // Delineado superior sutil (Anime Lashes para mirada tierna y viva)
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x161d2d });
    const lashGeo = new THREE.TorusGeometry(0.095, 0.012, 6, 16, Math.PI * 0.65);
    const lashL = new THREE.Mesh(lashGeo, lashMat);
    lashL.position.set(0, 0.095, 0.05);
    lashL.rotation.z = -0.15;
    eyeGroupL.add(lashL);

    const lashR = new THREE.Mesh(lashGeo, lashMat);
    lashR.position.set(0, 0.095, 0.05);
    lashR.rotation.z = -0.15;
    lashR.rotation.y = Math.PI;
    eyeGroupR.add(lashR);

    // Párpados animados
    const eyelidMat = new THREE.MeshStandardMaterial({
      color: isCat ? 0x7656d0 : 0xdd5910,
      roughness: 0.35,
    });
    const eyelidGeo = new THREE.SphereGeometry(0.125, 16, 16);
    eyelidGeo.scale(0.9, 1.2, 0.5);

    const eyelidL = new THREE.Mesh(eyelidGeo, eyelidMat);
    const eyelidR = new THREE.Mesh(eyelidGeo, eyelidMat);
    eyelidL.position.set(0, 0.12, 0.01);
    eyelidR.position.set(0, 0.12, 0.01);
    eyelidL.scale.y = 0;
    eyelidR.scale.y = 0;
    eyeGroupL.add(eyelidL);
    eyeGroupR.add(eyelidR);

    // ── OREJAS EXPRESIVAS ──
    const earGroupL = new THREE.Group();
    const earGroupR = new THREE.Group();
    headGroup.add(earGroupL);
    headGroup.add(earGroupR);

    if (isCat) {
      // Orejitas triangulares de gato
      const catEarGeo = new THREE.ConeGeometry(0.24, 0.44, 4);
      catEarGeo.rotateY(Math.PI / 4);

      const earMeshL = new THREE.Mesh(catEarGeo, mainFurMat);
      earMeshL.position.set(-0.35, 0.46, 0.02);
      earMeshL.rotation.z = 0.38;
      earMeshL.rotation.x = -0.1;
      earGroupL.add(earMeshL);

      const earMeshR = new THREE.Mesh(catEarGeo, mainFurMat);
      earMeshR.position.set(0.35, 0.46, 0.02);
      earMeshR.rotation.z = -0.38;
      earMeshR.rotation.x = -0.1;
      earGroupR.add(earMeshR);

      // Interior de oreja rosado
      const innerCatEarGeo = new THREE.ConeGeometry(0.16, 0.32, 4);
      innerCatEarGeo.rotateY(Math.PI / 4);

      const inL = new THREE.Mesh(innerCatEarGeo, innerEarMat);
      inL.position.set(-0.34, 0.45, 0.06);
      inL.rotation.z = 0.38;
      inL.rotation.x = -0.1;
      earGroupL.add(inL);

      const inR = new THREE.Mesh(innerCatEarGeo, innerEarMat);
      inR.position.set(0.34, 0.45, 0.06);
      inR.rotation.z = -0.38;
      inR.rotation.x = -0.1;
      earGroupR.add(inR);
    } else {
      // Orejas de zorro largas con puntas oscuras
      const earOuterGeo = new THREE.ConeGeometry(0.24, 0.62, 16);
      earOuterGeo.scale(1, 1, 0.45);

      const earMeshL = new THREE.Mesh(earOuterGeo, mainFurMat);
      earMeshL.position.set(-0.38, 0.56, -0.04);
      earMeshL.rotation.z = 0.28;
      earMeshL.rotation.y = 0.15;
      earGroupL.add(earMeshL);

      const earMeshR = new THREE.Mesh(earOuterGeo, mainFurMat);
      earMeshR.position.set(0.38, 0.56, -0.04);
      earMeshR.rotation.z = -0.28;
      earMeshR.rotation.y = -0.15;
      earGroupR.add(earMeshR);

      // Interior rosadito
      const earInnerGeo = new THREE.ConeGeometry(0.16, 0.44, 14);
      earInnerGeo.scale(0.85, 1, 0.2);

      const innerL = new THREE.Mesh(earInnerGeo, innerEarMat);
      innerL.position.set(-0.36, 0.52, 0.01);
      innerL.rotation.z = 0.28;
      earGroupL.add(innerL);

      const innerR = new THREE.Mesh(earInnerGeo, innerEarMat);
      innerR.position.set(0.36, 0.52, 0.01);
      innerR.rotation.z = -0.28;
      earGroupR.add(innerR);

      // Puntas oscuras
      const earTipGeo = new THREE.ConeGeometry(0.13, 0.22, 14);
      earTipGeo.scale(1, 1, 0.45);

      const tipL = new THREE.Mesh(earTipGeo, darkAccentMat);
      tipL.position.set(-0.42, 0.76, -0.04);
      tipL.rotation.z = 0.28;
      earGroupL.add(tipL);

      const tipR = new THREE.Mesh(earTipGeo, darkAccentMat);
      tipR.position.set(0.42, 0.76, -0.04);
      tipR.rotation.z = -0.28;
      earGroupR.add(tipR);
    }

    // ── COLA ANIMADA ESPECÍFICA (GATO O ZORRO) ──
    interface TailRig {
      root: THREE.Group;
      j1: THREE.Group;
      j2: THREE.Group;
      j3: THREE.Group;
      baseAngleY: number;
      baseAngleZ: number;
    }
    const tailRigs: TailRig[] = [];
    const tailCount = stage >= 3 ? 3 : stage >= 2 ? 2 : 1;

    for (let t = 0; t < tailCount; t++) {
      const tailRoot = new THREE.Group();
      tailRoot.position.set(0, -0.46, -0.22);

      let baseAngleY = isCat ? -0.25 : 0.25;
      let baseAngleZ = isCat ? -0.32 : 0.32;

      if (tailCount === 2) {
        baseAngleY = t === 0 ? 0.35 : -0.35;
        baseAngleZ = t === 0 ? 0.38 : -0.38;
      } else if (tailCount === 3) {
        baseAngleY = (t - 1) * 0.45;
        baseAngleZ = (t - 1) * 0.42;
      }

      tailRoot.rotation.y = baseAngleY;
      tailRoot.rotation.z = baseAngleZ;

      if (isCat) {
        // Cola elegante y esbelta de gato que se arquea como signo de interrogación
        const j0 = new THREE.Group();
        j0.rotation.x = -0.4;
        const g0 = new THREE.CapsuleGeometry(0.11, 0.26, 8, 16);
        g0.translate(0, 0.13, 0);
        const m0 = new THREE.Mesh(g0, mainFurMat);
        j0.add(m0);
        tailRoot.add(j0);

        const j1 = new THREE.Group();
        j1.position.set(0, 0.24, 0);
        j1.rotation.x = 0.32;
        const g1 = new THREE.CapsuleGeometry(0.12, 0.28, 8, 16);
        g1.translate(0, 0.14, 0);
        const m1 = new THREE.Mesh(g1, mainFurMat);
        j1.add(m1);
        j0.add(j1);

        const j2 = new THREE.Group();
        j2.position.set(0, 0.26, 0);
        j2.rotation.x = 0.35;
        const g2 = new THREE.CapsuleGeometry(0.12, 0.28, 8, 16);
        g2.translate(0, 0.14, 0);
        const m2 = new THREE.Mesh(g2, mainFurMat);
        j2.add(m2);
        j1.add(j2);

        // Punta curvada blanca de gatito
        const j3 = new THREE.Group();
        j3.position.set(0, 0.26, 0);
        j3.rotation.x = 0.3;
        const g3 = new THREE.CapsuleGeometry(0.11, 0.24, 8, 16);
        g3.translate(0, 0.12, 0);
        const m3 = new THREE.Mesh(g3, creamFurMat);
        j3.add(m3);
        j2.add(j3);

        mascotMasterGroup.add(tailRoot);
        tailRigs.push({ root: tailRoot, j1, j2, j3, baseAngleY, baseAngleZ });
      } else {
        // Cola esponjosa y majestuosa de zorro
        const j0 = new THREE.Group();
        j0.rotation.x = -0.32;
        const g0 = new THREE.CapsuleGeometry(0.18, 0.24, 10, 20);
        g0.translate(0, 0.12, 0);
        const m0 = new THREE.Mesh(g0, mainFurMat);
        m0.castShadow = true;
        j0.add(m0);
        tailRoot.add(j0);

        const j1 = new THREE.Group();
        j1.position.set(0, 0.22, 0);
        j1.rotation.x = 0.24;
        j1.rotation.z = 0.1;
        const g1 = new THREE.CapsuleGeometry(0.28, 0.28, 10, 22);
        g1.translate(0, 0.14, 0);
        const m1 = new THREE.Mesh(g1, mainFurMat);
        m1.castShadow = true;
        j1.add(m1);
        j0.add(j1);

        const j2 = new THREE.Group();
        j2.position.set(0, 0.26, 0);
        j2.rotation.x = 0.22;
        j2.rotation.z = 0.08;
        const g2 = new THREE.CapsuleGeometry(0.36, 0.32, 12, 24);
        g2.scale(1.1, 1.0, 1.1);
        g2.translate(0, 0.16, 0);
        const m2 = new THREE.Mesh(g2, mainFurMat);
        m2.castShadow = true;
        j2.add(m2);
        j1.add(j2);

        const j3 = new THREE.Group();
        j3.position.set(0, 0.28, 0);
        j3.rotation.x = 0.18;

        const g3 = new THREE.CapsuleGeometry(0.26, 0.28, 12, 22);
        g3.translate(0, 0.14, 0);
        const m3 = new THREE.Mesh(g3, creamFurMat);
        m3.castShadow = true;
        j3.add(m3);

        const tipFluffGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const tipFluff = new THREE.Mesh(tipFluffGeo, creamFurMat);
        tipFluff.position.set(0, 0.32, 0);
        tipFluff.scale.set(0.9, 1.15, 0.9);
        j3.add(tipFluff);

        j2.add(j3);

        mascotMasterGroup.add(tailRoot);
        tailRigs.push({ root: tailRoot, j1, j2, j3, baseAngleY, baseAngleZ });
      }
    }

    // ── ACCESORIOS DE FASE EVOLUTIVA ──
    let auroraRing: THREE.Mesh | null = null;
    if (stage >= 2) {
      // Pedestal de aura rúnica flotante bajo los pies (evita atravesar el cuerpo del personaje)
      const auroraGeo = new THREE.TorusGeometry(0.95, 0.016, 12, 48);
      const auroraMat = new THREE.MeshBasicMaterial({
        color: accentThemeColor,
        transparent: true,
        opacity: 0.75,
      });
      auroraRing = new THREE.Mesh(auroraGeo, auroraMat);
      auroraRing.position.set(0, -0.42, 0);
      auroraRing.rotation.x = Math.PI / 2;
      mascotMasterGroup.add(auroraRing);
    }

    let celestialCrown: THREE.Mesh | null = null;
    const celestialOrbs: THREE.Mesh[] = [];
    if (stage >= 3) {
      const crownGeo = new THREE.TorusGeometry(0.48, 0.024, 8, 28);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffbb00,
        emissiveIntensity: 0.9,
        wireframe: true,
      });
      celestialCrown = new THREE.Mesh(crownGeo, crownMat);
      celestialCrown.rotation.x = Math.PI / 2.2;
      celestialCrown.position.set(0, 0.65, 0);
      headGroup.add(celestialCrown);

      for (let o = 0; o < 3; o++) {
        const orbGeo = new THREE.SphereGeometry(0.05, 14, 14);
        const orbMat = new THREE.MeshStandardMaterial({
          color: accentThemeColor,
          emissive: accentThemeColor,
          emissiveIntensity: 1.4,
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);
        scene.add(orb);
        celestialOrbs.push(orb);
      }
    }

    // 6. Partículas Mágicas Flotantes
    const particleCount = 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      particlePos[p * 3] = (Math.random() - 0.5) * 3.4;
      particlePos[p * 3 + 1] = Math.random() * 2.6 - 1.0;
      particlePos[p * 3 + 2] = (Math.random() - 0.5) * 2.2;
      particleSpeeds[p] = 0.007 + Math.random() * 0.008;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: accentThemeColor,
      size: 0.045,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Seguimiento Parallax del Ratón Suave y Controlado (sin giros descontrolados)
    let targetRotY = 0;
    let targetRotX = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Normalizar suavemente respecto a la pantalla
      const maxDistX = Math.max(340, window.innerWidth * 0.45);
      const maxDistY = Math.max(340, window.innerHeight * 0.45);

      const normX = Math.max(-1, Math.min(1, dx / maxDistX));
      const normY = Math.max(-1, Math.min(1, dy / maxDistY));

      // Límite de giro estrictamente seguro y natural:
      // Rotación Y (mirar a los lados): máximo ~15 grados (0.26 rad)
      // Rotación X (mirar arriba/abajo): máximo ~10 grados (0.17 rad)
      targetRotY = normX * 0.26;
      targetRotX = normY * 0.17;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 8. Bucle Principal de Animación Fluida a 60 FPS
    let animId: number;
    const clock = new THREE.Clock();
    let jumpTime = 0;

    let nextBlinkTime = 2.0;
    let blinkPhase = 0;
    let nextEarTwitch = 3.5;
    let earTwitchPhase = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      ring1.rotation.z = elapsed * 0.4;
      ring2.rotation.z = -elapsed * 0.6;
      warmBounce.intensity = 2.2 + Math.sin(elapsed * 6) * 0.2;

      // ── Respiración Tierna y Rítmica ──
      const breath = Math.sin(elapsed * 2.6);
      const breathScaleY = 1 + breath * 0.026;
      const breathScaleX = 1 - breath * 0.014;
      torso.scale.set((isCat ? 0.95 : 0.9) * breathScaleX, 1.1 * breathScaleY, 0.88);
      torso.position.y = -0.22 + breath * 0.012;

      headGroup.position.y = 0.65 + breath * 0.018;

      // Seguimiento de cabeza controlado (sin giros excesivos)
      const safeTargetY = Math.max(-0.28, Math.min(0.28, targetRotY));
      const safeTargetX = Math.max(-0.18, Math.min(0.18, targetRotX));

      headGroup.rotation.y += (safeTargetY - headGroup.rotation.y) * 0.06;
      headGroup.rotation.x += (safeTargetX - headGroup.rotation.x) * 0.06;

      mascotMasterGroup.rotation.y += (safeTargetY * 0.25 - mascotMasterGroup.rotation.y) * 0.04;

      // Parpadeo tierno (Blink)
      if (elapsed > nextBlinkTime) {
        blinkPhase = 0.15;
        nextBlinkTime = elapsed + 3.0 + Math.random() * 4.0;
      }

      if (blinkPhase > 0) {
        blinkPhase -= 0.018;
        const blinkAmount = Math.sin((blinkPhase / 0.15) * Math.PI);
        eyelidL.scale.y = blinkAmount * 1.0;
        eyelidR.scale.y = blinkAmount * 1.0;
      } else {
        eyelidL.scale.y = 0;
        eyelidR.scale.y = 0;
      }

      // Alertas y movimiento de orejitas
      if (elapsed > nextEarTwitch) {
        earTwitchPhase = 0.24;
        nextEarTwitch = elapsed + 3.5 + Math.random() * 4.5;
      }

      let twitchL = Math.sin(elapsed * 3.5) * 0.04;
      let twitchR = -Math.sin(elapsed * 3.5 + 0.5) * 0.04;

      if (earTwitchPhase > 0) {
        earTwitchPhase -= 0.016;
        const fastTwitch = Math.sin((0.24 - earTwitchPhase) * Math.PI * 12) * 0.08;
        twitchL += fastTwitch;
        twitchR += fastTwitch * 0.5;
      }

      earGroupL.rotation.z = twitchL;
      earGroupR.rotation.z = twitchR;

      // Ondulación natural de la cola
      tailRigs.forEach((tail, idx) => {
        const waveTime = elapsed * (isCat ? 2.4 : 2.0) + idx * 0.9;

        tail.root.rotation.z = tail.baseAngleZ + Math.sin(waveTime) * (isCat ? 0.15 : 0.12);
        tail.root.rotation.y = tail.baseAngleY + Math.cos(waveTime * 0.8) * 0.08;
        tail.root.rotation.x = -0.15 + Math.sin(waveTime * 0.9) * 0.06;

        tail.j1.rotation.z = 0.1 + Math.sin(waveTime - 0.4) * 0.08;
        tail.j1.rotation.x = 0.22 + Math.cos(waveTime - 0.4) * 0.05;

        tail.j2.rotation.z = 0.08 + Math.sin(waveTime - 0.8) * 0.1;
        tail.j2.rotation.x = 0.2 + Math.cos(waveTime - 0.8) * 0.05;

        tail.j3.rotation.z = 0.06 + Math.sin(waveTime - 1.2) * 0.12;
        tail.j3.rotation.x = 0.16 + Math.cos(waveTime - 1.2) * 0.06;
      });

      // Salto e interacción feliz al hacer clic
      if (jumpTime > 0) {
        jumpTime -= 0.035;
        const jumpProgress = Math.sin((1 - jumpTime) * Math.PI);
        mascotMasterGroup.position.y = jumpProgress * 0.45;
        mascotMasterGroup.rotation.y += 0.18;
        shadowMesh.scale.set(1 - jumpProgress * 0.4, 1 - jumpProgress * 0.4, 1);
        shadowMat.opacity = Math.max(0.25, 0.8 - jumpProgress * 0.5);
      } else {
        mascotMasterGroup.position.y = Math.sin(elapsed * 2.6) * 0.03;
        shadowMesh.scale.set(1 + breath * 0.04, 1 + breath * 0.04, 1);
        shadowMat.opacity = 0.8 - breath * 0.04;
      }

      // Efectos de Fase Evolutiva
      if (auroraRing) {
        auroraRing.rotation.x = Math.PI / 2;
        auroraRing.rotation.z = elapsed * 0.4;
        auroraRing.position.y = -0.42 + Math.sin(elapsed * 2) * 0.02;
      }

      if (celestialCrown) {
        celestialCrown.rotation.z = elapsed * 0.5;
      }

      celestialOrbs.forEach((orb, idx) => {
        const angle = elapsed * 1.5 + (idx * Math.PI * 2) / 3;
        const radius = 1.3;
        orb.position.set(
          Math.cos(angle) * radius,
          0.1 + Math.sin(elapsed * 2 + idx) * 0.25,
          Math.sin(angle) * (radius * 0.6)
        );
      });

      // Movimiento de partículas
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeeds[i];
        positions[i * 3] += Math.sin(elapsed * 1.5 + i) * 0.002;
        if (positions[i * 3 + 1] > 1.8) {
          positions[i * 3 + 1] = -1.0;
          positions[i * 3] = (Math.random() - 0.5) * 3.4;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Interacción al hacer clic
    const handleCanvasClick = () => {
      jumpTime = 1.0;
      playMascotSound(petType);
      if (onPetClick) onPetClick();
    };

    triggerJumpRef.current = handleCanvasClick;
    renderer.domElement.addEventListener('click', handleCanvasClick);

    // 10. ResizeObserver
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 11. Limpieza
    return () => {
      triggerJumpRef.current = null;
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('click', handleCanvasClick);
      resizeObserver.disconnect();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTexture.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      discGeo.dispose();
      discMat.dispose();
      torsoGeo.dispose();
      chestGeo.dispose();
      pawGeo.dispose();
      headGeo.dispose();
      cheekGeo.dispose();
      blushGeo.dispose();
      lashGeo.dispose();
      eyeGeo.dispose();
      irisGeo.dispose();
      pupilGeo.dispose();
      glintMainGeo.dispose();
      glintSmallGeo.dispose();
      eyelidGeo.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      celestialOrbs.forEach((orb) => {
        orb.geometry.dispose();
        (orb.material as THREE.Material).dispose();
      });
    };
  }, [petType, stage, onPetClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-pointer select-none flex items-center justify-center group"
      title={`Haz clic para interactuar con tu ${petType === 'cat' ? 'Gatito' : 'Zorro'} 3D`}
    />
  );
}
