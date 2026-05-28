import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const wolfContainer = document.getElementById('wolfContainer');

let mouseX = 0;
let mouseY = 0;
let model;
let head;
let mixer;
let isVisible = true;
let animationId;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  antialias: !prefersReducedMotion,
  alpha: true,
  powerPreference: 'high-performance',
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = !prefersReducedMotion;
controls.autoRotateSpeed = 0.35;

wolfContainer.appendChild(renderer.domElement);
camera.position.set(1, 1, 2.2);

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.HemisphereLight(0x9ee8ff, 0x1a3c5e, 1.2);
scene.add(fillLight);

const loader = new GLTFLoader();
loader.load(
  '/Wolf.glb',
  (gltf) => {
    model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.scale.setScalar(window.innerWidth < 760 ? 1.08 : 1);
    scene.add(model);

    head = model.getObjectByName('Head');
    mixer = new THREE.AnimationMixer(model);

    const [firstAnimation] = gltf.animations;
    const preferredAnimation = gltf.animations[3] || firstAnimation;
    if (preferredAnimation && !prefersReducedMotion) {
      mixer.clipAction(preferredAnimation).play();
    }
  },
  undefined,
  (error) => {
    console.error('Impossible de charger le loup 3D.', error);
  }
);

const target = new THREE.Object3D();
scene.add(target);

const clock = new THREE.Clock();

function resizeRenderer() {
  const { clientWidth, clientHeight } = wolfContainer;
  if (!clientWidth || !clientHeight) return;

  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);

  if (model) {
    model.scale.setScalar(clientWidth < 520 ? 1.12 : 1);
  }
}

function animate() {
  if (!isVisible) {
    animationId = undefined;
    return;
  }

  animationId = requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (mixer && !prefersReducedMotion) {
    mixer.update(delta);
  }

  target.position.set(mouseX * 2, 1 + mouseY * 2, 5);
  if (head && !prefersReducedMotion) {
    head.lookAt(target.position);
    head.rotateX(-Math.PI / 2);
    head.rotateZ(Math.PI);
  }

  controls.update();
  renderer.render(scene, camera);
}

function startAnimation() {
  if (!animationId) {
    clock.getDelta();
    animate();
  }
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(wolfContainer);
resizeRenderer();
startAnimation();

const visibilityObserver = new IntersectionObserver(([entry]) => {
  isVisible = entry.isIntersecting;
  if (isVisible) startAnimation();
}, { threshold: 0.08 });
visibilityObserver.observe(wolfContainer);

window.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  const [touch] = event.touches;
  if (!touch) return;
  mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });
