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
camera.position.set(0, 20, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ---------------- Lights ----------------
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(8, 20, 8);
dir.castShadow = true;
scene.add(dir);

// ---------------- Solar System ----------------
const solar = new THREE.Group();
solar.position.set(0, 0.01, 0);
scene.add(solar);

// Sun - blocky style
const sun = new THREE.Group();
sun.position.set(0, 2.0, 0);
sun.add(new THREE.Mesh(
  new THREE.BoxGeometry(2.5, 2.5, 2.5),
  new THREE.MeshStandardMaterial({ emissive: 0xffdd66, emissiveIntensity: 2.0, color: 0xffdd66 })
));
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  const flare = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 1.2),
    new THREE.MeshStandardMaterial({ emissive: 0xff9944, emissiveIntensity: 1.5, color: 0xff9944 })
  );
  flare.position.set(Math.cos(angle) * 1.8, 0, Math.sin(angle) * 1.8);
  flare.rotation.y = angle;
  sun.add(flare);
}
solar.add(sun);

// Sun glow
const sunLight = new THREE.PointLight(0xffdd66, 2.0, 150);
sunLight.position.set(0, 2.0, 0);
scene.add(sunLight);

// Planet specs
const specs = [
  { r: 3, size: 0.2, speed: 0.5, color: 0x8b7355 },
  { r: 5, size: 0.25, speed: 0.4, color: 0xffd700 },
  { r: 7.5, size: 0.3, speed: 0.3, color: 0x4169e1 },
  { r: 10, size: 0.22, speed: 0.25, color: 0xff6347 },
  { r: 14, size: 0.5, speed: 0.18, color: 0xdaa520, hasRings: true, ringColor: 0xb8a570 },
  { r: 17.5, size: 0.4, speed: 0.14, color: 0xf4a460, hasRings: true, ringColor: 0xd4a574 },
  { r: 21, size: 0.28, speed: 0.1, color: 0x4fd0e7 },
  { r: 24.5, size: 0.27, speed: 0.08, color: 0x2f4f7f },
];

// Function to create blocky planet
function createBlockyPlanet(spec) {
  const planetGroup = new THREE.Group();

  // Main planet core (cube)
  const coreSize = spec.size * 2;
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(coreSize, coreSize, coreSize),
    new THREE.MeshStandardMaterial({
      color: spec.color,
      metalness: 0.1,
      roughness: 0.8,
    })
  );
  core.castShadow = true;
  core.receiveShadow = true;
  planetGroup.add(core);

  // Add random cubic details to planets
  const nDetails = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < nDetails; i++) {
    const detail = new THREE.Mesh(
      new THREE.BoxGeometry(
        coreSize * (0.2 + Math.random() * 0.3),
        coreSize * (0.2 + Math.random() * 0.3),
        coreSize * (0.2 + Math.random() * 0.3)
      ),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(spec.color).offsetHSL(
          0,
          0,
          -0.1 + Math.random() * 0.2
        ),
        metalness: 0.2,
        roughness: 0.7,
      })
    );

    // Random position on planet surface
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    const dist = coreSize * 0.5;
    detail.position.set(
      Math.cos(angle1) * Math.cos(angle2) * dist,
      Math.sin(angle2) * dist,
      Math.sin(angle1) * Math.cos(angle2) * dist
    );
    detail.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    detail.castShadow = true;
    detail.receiveShadow = true;
    planetGroup.add(detail);
  }

  return planetGroup;
}

for (const s of specs) {
  // Planet mesh - blocky version (estático, sem pivot de rotação)
  const mesh = createBlockyPlanet(s);
  mesh.position.set(s.r, 2.0, 0);
  solar.add(mesh);

  if (s.hasRings) {
    const ringHolder = new THREE.Group();
    ringHolder.position.copy(mesh.position);
    ringHolder.rotation.x = Math.PI * 0.3 + (Math.random() * 0.2 - 0.1);
    const [segs, inner, outer] = [48, s.size * 3.6, s.size * 5.6];
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const radius = inner + (outer - inner) * (layer / 2) + Math.random() * (outer - inner) / 2;
        const size = 0.08 + Math.random() * 0.12;
        const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.3, size), new THREE.MeshStandardMaterial({ color: s.ringColor, metalness: 0.2, roughness: 0.6 }));
        cube.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        cube.rotation.y = angle;
        cube.castShadow = cube.receiveShadow = true;
        ringHolder.add(cube);
      }
    }
    solar.add(ringHolder);
  }

  // Desenhar órbita
  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(Math.cos(angle) * s.r, 2.0, Math.sin(angle) * s.r);
  }
  const orbitGeom = new THREE.BufferGeometry();
  orbitGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(orbitPoints), 3));
  solar.add(new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({ color: 0x6688aa, transparent: true, opacity: 0.5 })));
}

// ---------------- OrbitControls para controle de câmera com rato ----------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0);
controls.minDistance = 10;
controls.maxDistance = 100;

// ---------------- Main loop ----------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  // Rotação suave do sol
  sun.rotation.y += 0.1 * dt;

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
