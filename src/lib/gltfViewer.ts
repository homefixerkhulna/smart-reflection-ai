import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface AvatarViewerOptions {
  dracoDecoderPath?: string;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  controls?: boolean;
}

export interface AvatarViewer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  mixer: THREE.AnimationMixer | null;
  model: THREE.Group;
  dispose: () => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setThinking: (v: boolean) => void;
}

export async function createAvatarViewer(
  container: HTMLElement,
  url: string,
  opts: AvatarViewerOptions = {}
): Promise<AvatarViewer> {
  const width = container.clientWidth || 400;
  const height = container.clientHeight || 400;

  // ---- Renderer ----
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // ---- Scene ----
  const scene = new THREE.Scene();

  // ---- Camera ----
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 1.4, 2.5);

  // ---- Lights ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3, 4);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  rimLight.position.set(-2, 2, -3);
  scene.add(rimLight);

  // ---- Controls ----
  let controls: OrbitControls | null = null;
  if (opts.controls) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1;
    controls.maxDistance = 5;
    controls.enablePan = false;
    controls.update();
  }

  // ---- Loader ----
  const loader = new GLTFLoader();
  if (opts.dracoDecoderPath) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(opts.dracoDecoderPath);
    loader.setDRACOLoader(draco);
  }

  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  scene.add(model);

  // Centre model
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.position.y += box.getSize(new THREE.Vector3()).y / 2;

  // ---- Animations ----
  let mixer: THREE.AnimationMixer | null = null;
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    const idle = mixer.clipAction(gltf.animations[0]);
    idle.play();
  }

  // ---- State flags ----
  let _listening = false;
  let _speaking = false;
  let _thinking = false;

  // ---- Breathing / idle animation ----
  const clock = new THREE.Clock();
  let disposed = false;
  let animId = 0;

  const animate = () => {
    if (disposed) return;
    animId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    if (mixer) mixer.update(delta);
    controls?.update();

    // Subtle breathing
    const breathe = 1 + Math.sin(elapsed * 1.5) * 0.008;

    // Listening: gentle scale pulse + green tint
    if (_listening) {
      const listenPulse = 1 + Math.sin(elapsed * 4) * 0.015;
      model.scale.setScalar(listenPulse);
      rimLight.color.setHex(0x44ff88);
      rimLight.intensity = 0.6 + Math.sin(elapsed * 3) * 0.3;
    }
    // Speaking: stronger glow + bounce
    else if (_speaking) {
      const speakBounce = 1 + Math.sin(elapsed * 6) * 0.02;
      model.scale.setScalar(speakBounce);
      rimLight.color.setHex(0x6688ff);
      const pulse = 0.5 + Math.sin(elapsed * 6) * 0.5;
      rimLight.intensity = 0.5 + pulse * 0.8;
      // Subtle head sway when speaking
      model.rotation.y = Math.sin(elapsed * 2) * 0.03;
    }
    // Thinking: rotation + amber glow
    else if (_thinking) {
      model.scale.setScalar(breathe);
      rimLight.color.setHex(0xffaa44);
      rimLight.intensity = 0.5 + Math.sin(elapsed * 2) * 0.3;
      model.rotation.y = Math.sin(elapsed * 0.8) * 0.06;
    }
    // Idle
    else {
      model.scale.setScalar(breathe);
      rimLight.color.setHex(0x8888ff);
      rimLight.intensity = 0.4;
      model.rotation.y *= 0.95;
    }

    renderer.render(scene, camera);
  };
  animate();

  // ---- Resize ----
  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const ro = new ResizeObserver(onResize);
  ro.observe(container);

  return {
    scene,
    camera,
    renderer,
    mixer,
    model,
    setListening: (v) => { _listening = v; },
    setSpeaking: (v) => { _speaking = v; },
    setThinking: (v) => { _thinking = v; },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      scene.traverse((obj) => {
        if ((obj as any).geometry) (obj as any).geometry.dispose();
        if ((obj as any).material) {
          const mat = (obj as any).material;
          if (Array.isArray(mat)) mat.forEach((m: any) => m.dispose());
          else mat.dispose();
        }
      });
    },
  };
}
