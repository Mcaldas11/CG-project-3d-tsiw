import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ---------------- Scene / Camera / Renderer ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b12);

const camera = new THREE.PerspectiveCamera(
  60,
  innerWidth / innerHeight,
  0.1,
  2000
);
camera.position.set(0, 30, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ---------------- Lights ----------------
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(50, 50, 50);
dir.castShadow = true;
dir.shadow.mapSize.width = 2048;
dir.shadow.mapSize.height = 2048;
scene.add(dir);

// ---------------- Floor / Terreno ----------------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x2a4d3c, roughness: 0.7, metalness: 0.1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.castShadow = true;
scene.add(floor);

// Grid para visualização
scene.add(new THREE.GridHelper(200, 40, 0x4a7d6c, 0x2a4d3c));

// OrbitControls para controle de câmera com rato
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0);
controls.minDistance = 10;
controls.maxDistance = 200;

// Main loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  controls.update();

  renderer.render(scene, camera);
}
animate();

// Resize listener
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
