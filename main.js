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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false; // disable manual orbit for gameplay

// ---------------- Lights ----------------
const ambient = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(8, 20, 8);
dir.castShadow = true;
scene.add(dir);

// ---------------- Floor ----------------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.MeshStandardMaterial({ color: 0x161622 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(80, 80, 0x333344, 0x222233));

// ---------------- Solar System ----------------
const solar = new THREE.Group();
solar.position.set(0, 0.01, 0);
scene.add(solar);

// Sun
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2.0, 32, 32),
  new THREE.MeshStandardMaterial({
    emissive: 0xffdd66,
    emissiveIntensity: 2.0,
  })
);
sun.position.set(0, 2.0, 0);
solar.add(sun);

// Sun glow
const sunLight = new THREE.PointLight(0xffdd66, 2.0, 150);
sunLight.position.set(0, 2.0, 0);
scene.add(sunLight);

// Planet specs
const specs = [
  { r: 3, size: 0.2, speed: 0.5, color: 0x8b7355, name: "Mercury" },
  { r: 5, size: 0.25, speed: 0.4, color: 0xffd700, name: "Venus" },
  { r: 7.5, size: 0.3, speed: 0.3, color: 0x4169e1, name: "Earth" },
  { r: 10, size: 0.22, speed: 0.25, color: 0xff6347, name: "Mars" },
  {
    r: 14,
    size: 0.5,
    speed: 0.18,
    color: 0xdaa520,
    name: "Jupiter",
    hasRings: true,
    ringColor: 0xb8a570,
  },
  {
    r: 17.5,
    size: 0.4,
    speed: 0.14,
    color: 0xf4a460,
    name: "Saturn",
    hasRings: true,
    ringColor: 0xd4a574,
  },
  { r: 21, size: 0.28, speed: 0.1, color: 0x4fd0e7, name: "Uranus" },
  { r: 24.5, size: 0.27, speed: 0.08, color: 0x2f4f7f, name: "Neptune" },
];

const planets = [];

for (const s of specs) {
  const pivot = new THREE.Group();
  pivot.position.copy(sun.position);

  // Planet mesh
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(s.size, 20, 20),
    new THREE.MeshStandardMaterial({
      color: s.color,
      metalness: 0.1,
      roughness: 0.8,
    })
  );
  mesh.position.set(s.r, 0.5, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  pivot.add(mesh);

  // Rings (para Saturno e Júpiter)
  if (s.hasRings) {
    const ringGeometry = new THREE.RingGeometry(s.size * 1.8, s.size * 2.8, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: s.ringColor,
      metalness: 0.2,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI * 0.3 + (Math.random() * 0.2 - 0.1);
    ring.position.copy(mesh.position);
    ring.castShadow = true;
    ring.receiveShadow = true;
    pivot.add(ring);
  }

  // Orbit line
  const orbitGeometry = new THREE.BufferGeometry();
  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(
      Math.cos(angle) * s.r + sun.position.x,
      sun.position.y,
      Math.sin(angle) * s.r + sun.position.z
    );
  }
  orbitGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(orbitPoints), 3)
  );
  const orbitLine = new THREE.Line(
    orbitGeometry,
    new THREE.LineBasicMaterial({
      color: 0x444455,
      linewidth: 1,
      transparent: true,
      opacity: 0.3,
    })
  );
  solar.add(orbitLine);

  solar.add(pivot);
  planets.push({
    pivot,
    mesh,
    speed: s.speed,
    radius: s.r,
    rotationSpeed: 0.1 + Math.random() * 0.1,
    size: s.size,
    velocity: new THREE.Vector3(0, 0, 0),
    inOrbit: true,
    orbitSpeed: s.speed,
  });
}

// ---------------- Ship (with "physics") ----------------
const shipRoot = new THREE.Group();
shipRoot.position.set(-10, 0.6, 0);
scene.add(shipRoot);

const mat = new THREE.MeshStandardMaterial({
  color: 0xaaccff,
  metalness: 0.2,
  roughness: 0.5,
});
const fuselage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 3.2), mat);
fuselage.castShadow = true;
shipRoot.add(fuselage);

const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(0.6, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0x102030 })
);
cockpit.position.set(0, 0.35, 0.9);
cockpit.scale.set(1, 0.7, 1);
fuselage.add(cockpit);

// wings - attach with pivot so we can tilt during turns
function makeWing(side) {
  const pivot = new THREE.Group();
  pivot.position.set(side * 1.0, 0, 0);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 1.6), mat);
  wing.position.set(side * 0.9, 0, -0.1);
  wing.castShadow = true;
  pivot.add(wing);
  fuselage.add(pivot);
  return pivot;
}
const leftWing = makeWing(-1);
const rightWing = makeWing(1);

// engine
const engine = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12),
  new THREE.MeshStandardMaterial({ color: 0x222222 })
);
engine.rotation.x = Math.PI / 2;
engine.position.set(0, 0, -1.7);
engine.castShadow = true;
fuselage.add(engine);

const engineLight = new THREE.PointLight(0xff6600, 0.0, 6, 2);
engineLight.position.set(0, 0, -2.0);
fuselage.add(engineLight);

// ----- physics state -----
const phys = {
  velocity: new THREE.Vector3(0, 0, 0),
  acceleration: 0,
  yawVel: 0,
  maxSpeed: 20,
  thrust: 30,
  angularSpeed: Math.PI * 2.5, // rad/s for yaw
  damping: 0.96,
  angularDamping: 0.8,
  boostMultiplier: 2.6,
  boosting: false,
  boostAmount: 1.0, // 0 a 1 (cheio/vazio)
  boostRechargeTime: 10.0, // tempo para recarregar completamente
  boostRechargeRate: 1.0 / 10.0, // quanto recarrega por segundo
};

// input
const input = {
  forward: false,
  back: false,
  left: false,
  right: false,
  boost: false,
};

// controls
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyW") input.forward = true;
  if (e.code === "KeyS") input.back = true;
  if (e.code === "KeyA") input.left = true;
  if (e.code === "KeyD") input.right = true;
  if (e.code === "Space") {
    input.boost = true;
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "KeyW") input.forward = false;
  if (e.code === "KeyS") input.back = false;
  if (e.code === "KeyA") input.left = false;
  if (e.code === "KeyD") input.right = false;
  if (e.code === "Space") {
    input.boost = false;
  }
});

// ---------------- Camera follow (third person) ----------------
const camOffset = new THREE.Vector3(0, 4.0, 10);
function updateCamera(dt) {
  // desired position behind the ship
  const desired = new THREE.Vector3()
    .copy(camOffset)
    .applyQuaternion(shipRoot.quaternion)
    .add(shipRoot.position);
  // lerp camera
  camera.position.lerp(desired, 1 - Math.pow(0.01, dt));
  // look at ship
  const lookAt = new THREE.Vector3()
    .copy(shipRoot.position)
    .add(new THREE.Vector3(0, 1.0, 0));
  camera.lookAt(lookAt);
}

// ---------------- Main loop ----------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.getElapsedTime();

  // planets
  for (const p of planets) {
    if (p.inOrbit) {
      p.pivot.rotation.y += p.speed * dt;
    } else {
      // Planeta saiu da órbita - movimento livre
      p.mesh.position.addScaledVector(p.velocity, dt);
      // Resistência do espaço
      p.velocity.multiplyScalar(0.99);
    }
    // Planet self-rotation
    p.mesh.rotation.y += p.rotationSpeed * dt;

    // Detecção de colisão com a nave
    const planetWorldPos = new THREE.Vector3();
    p.mesh.getWorldPosition(planetWorldPos);
    const distance = shipRoot.position.distanceTo(planetWorldPos);
    const collisionDist = 2.0 + p.size;

    if (distance < collisionDist && p.inOrbit) {
      // Colisão! Planeta sai da órbita
      p.inOrbit = false;

      // Calcular direção do impacto
      const impactDir = new THREE.Vector3()
        .subVectors(planetWorldPos, shipRoot.position)
        .normalize();

      // Aplicar velocidade ao planeta baseado na velocidade da nave
      const shipSpeed = phys.velocity.length();
      p.velocity.copy(impactDir).multiplyScalar(shipSpeed * 0.5 + 3);
    }
  }

  // engine visual
  engine.rotation.z += 25 * dt;

  // physics input -> acceleration & yaw
  let thrust = 0;
  if (input.forward) thrust += phys.thrust;
  if (input.back) thrust -= phys.thrust * 0.6;

  // apply boost
  if (input.boost && phys.boostAmount > 0) {
    phys.boosting = true;
    thrust *= phys.boostMultiplier;
    engineLight.intensity = 2.0;
    phys.boostAmount -= 0.15 * dt; // consome boost
    if (phys.boostAmount <= 0) {
      phys.boostAmount = 0;
      engineLight.intensity = 0.0;
    }
  } else {
    phys.boosting = false;
    engineLight.intensity = 0.0;
    // Recarregar boost
    if (phys.boostAmount < 1.0) {
      phys.boostAmount += phys.boostRechargeRate * dt;
      if (phys.boostAmount > 1.0) phys.boostAmount = 1.0;
    }
  }

  // update velocity (forward axis is -Z in object space)
  const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(
    shipRoot.quaternion
  );
  const accelVec = forwardDir.multiplyScalar(thrust * dt);
  phys.velocity.add(accelVec);

  // yaw control
  let yawInput = 0;
  if (input.left) yawInput += 1;
  if (input.right) yawInput -= 1;
  phys.yawVel += yawInput * phys.angularSpeed * dt;
  // integrate orientation (yaw only for simplicity)
  const yawChange = phys.yawVel * dt;
  const q = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    yawChange
  );
  shipRoot.quaternion.multiply(q);

  // apply damping
  phys.velocity.multiplyScalar(Math.pow(phys.damping, dt * 60));
  phys.yawVel *= Math.pow(phys.angularDamping, dt * 60);

  // clamp speed
  const speed = phys.velocity.length();
  if (speed > phys.maxSpeed * (phys.boosting ? phys.boostMultiplier : 1)) {
    phys.velocity.setLength(
      phys.maxSpeed * (phys.boosting ? phys.boostMultiplier : 1)
    );
  }

  // update position
  shipRoot.position.addScaledVector(phys.velocity, dt);

  // keep y fixed
  shipRoot.position.y = 0.6;

  // tilt wings based on yawVel to give visual banking
  const bank = THREE.MathUtils.clamp(phys.yawVel * 0.25, -0.45, 0.45);
  leftWing.rotation.z = THREE.MathUtils.lerp(leftWing.rotation.z, bank, 0.08);
  rightWing.rotation.z = THREE.MathUtils.lerp(
    rightWing.rotation.z,
    -bank,
    0.08
  );

  // camera follow
  updateCamera(dt);

  // Update boost bar
  const boostPercentage = phys.boostAmount * 100;
  const boostBarFill = document.getElementById("boostBarFill");
  if (boostBarFill) {
    boostBarFill.style.width = boostPercentage + "%";
  }

  renderer.render(scene, camera);
}
animate();

// ---------------- resize ----------------
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
