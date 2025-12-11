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
camera.position.set(0, 6, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ---------------- Lights ----------------
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(8, 20, 8);
dir.castShadow = true;
scene.add(dir);

// ---------------- Ship - Improved Blocky Design ----------------
const shipRoot = new THREE.Group();
shipRoot.position.set(0, 0, 0);
scene.add(shipRoot);

const shipColors = {
  primary: 0xf25346,
  secondary: 0xd8d0d1,
  accent: 0x68c3c0,
  dark: 0x23190f,
  cockpit: 0x4169e1,
};

const fuselage = new THREE.Group();
shipRoot.add(fuselage);

const addPart = (geom, mat, pos) => {
  const mesh = new THREE.Mesh(geom, mat);
  if (pos) mesh.position.set(...pos);
  mesh.castShadow = mesh.receiveShadow = true;
  fuselage.add(mesh);
};

addPart(new THREE.BoxGeometry(1.0, 0.7, 3.5), new THREE.MeshStandardMaterial({ color: shipColors.primary, metalness: 0.3, roughness: 0.6 }));
addPart(new THREE.BoxGeometry(0.7, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: shipColors.secondary, metalness: 0.5, roughness: 0.4 }), [0, 0, 2.0]);
addPart(new THREE.BoxGeometry(0.8, 0.6, 1.0), new THREE.MeshStandardMaterial({ color: shipColors.primary, metalness: 0.3, roughness: 0.6 }), [0, 0.3, 0.8]);
addPart(new THREE.BoxGeometry(0.6, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: shipColors.cockpit, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.6 }), [0, 0.15, 1.5]);
addPart(new THREE.BoxGeometry(0.3, 0.9, 0.6), new THREE.MeshStandardMaterial({ color: shipColors.primary, metalness: 0.3, roughness: 0.6 }), [0, 0.5, -1.5]);

function makeWing(side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.6, 0, 0);
  
  // Criar geometria triangular para a asa
  const wingGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    // Frente da asa (triângulo)
    0, 0.2, 0,           // 0: topo (junto ao tronco)
    side * 0.8, 0, 0,    // 1: ponta (longe do tronco)
    0, -0.2, 0,          // 2: base
    
    // Trás da asa (triângulo)
    0, 0.2, -2,          // 3
    side * 0.8, 0, -2,   // 4
    0, -0.2, -2,         // 5
    
    // Lateral superior (retângulo)
    0, 0.2, 0,           // 6
    0, 0.2, -2,          // 7
    side * 0.8, 0, -2,   // 8
    side * 0.8, 0, 0,    // 9
    
    // Lateral inferior (retângulo)
    0, -0.2, 0,          // 10
    0, -0.2, -2,         // 11
    side * 0.8, 0, -2,   // 12
    side * 0.8, 0, 0,    // 13
  ]);
  
  const indices = new Uint32Array([
    0, 1, 2,    // Frente
    3, 5, 4,    // Trás (inverter para face correta)
    6, 8, 7,    // Lateral superior
    6, 9, 8,
    10, 11, 12, // Lateral inferior
    10, 12, 13,
  ]);
  
  wingGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  wingGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
  wingGeometry.computeVertexNormals();
  
  const wingMaterial = new THREE.MeshStandardMaterial({ 
    color: shipColors.primary, 
    metalness: 0.3, 
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  
  const wing = new THREE.Mesh(wingGeometry, wingMaterial);
  wing.castShadow = true;
  wing.receiveShadow = true;
  wing.position.set(0, 0, -0.3);
  pivot.add(wing);
  
  fuselage.add(pivot);
  return pivot;
}
const [leftWing, rightWing] = [makeWing(-1), makeWing(1)];

function createEngine(xOffset) {
  const eng = new THREE.Group();
  eng.position.set(xOffset, 0, -1.8);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.8), new THREE.MeshStandardMaterial({ color: shipColors.dark, metalness: 0.7, roughness: 0.3 }));
  housing.castShadow = true;
  eng.add(housing);
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.3), new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.1 }));
  nozzle.position.z = -0.45;
  eng.add(nozzle);
  const prop = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 0.15), new THREE.MeshStandardMaterial({ color: shipColors.dark, metalness: 0.8, roughness: 0.2 }));
    blade.rotation.z = (i * Math.PI) / 2;
    blade.castShadow = true;
    prop.add(blade);
  }
  prop.position.z = -0.5;
  eng.add(prop);
  eng.propeller = prop;
  const light = new THREE.PointLight(0xff6600, 0.0, 8, 2);
  light.position.z = -0.7;
  eng.add(light);
  eng.light = light;
  return eng;
}
const [leftEngine, rightEngine] = [createEngine(-0.6), createEngine(0.6)];
fuselage.add(leftEngine, rightEngine);

// ---------------- OrbitControls para controle de câmera com rato ----------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.copy(shipRoot.position);
controls.minDistance = 5;
controls.maxDistance = 50;

// ---------------- Main loop ----------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  // Rodar hélices dos motores
  leftEngine.propeller.rotation.z += 15 * dt;
  rightEngine.propeller.rotation.z += 15 * dt;

  // Atualizar controles da câmera
  controls.update();

  renderer.render(scene, camera);
}
animate();

// ---------------- resize ----------------
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
