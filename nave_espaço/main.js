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

const planets = [];

for (const s of specs) {
  const pivot = new THREE.Group();
  pivot.position.copy(sun.position);

  // Planet mesh - blocky version
  const mesh = createBlockyPlanet(s);
  mesh.position.set(s.r, 0.5, 0);
  pivot.add(mesh);

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
    pivot.add(ringHolder);
  }

  const orbitPoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    orbitPoints.push(Math.cos(angle) * s.r, sun.position.y, Math.sin(angle) * s.r);
  }
  const orbitGeom = new THREE.BufferGeometry();
  orbitGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(orbitPoints), 3));
  solar.add(new THREE.Line(orbitGeom, new THREE.LineBasicMaterial({ color: 0x444455, transparent: true, opacity: 0.3 })));

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

// ---------------- Ship - Improved Blocky Design ----------------
const shipRoot = new THREE.Group();
shipRoot.position.set(0, 0, 0);
shipRoot.rotation.y = Math.PI; // Rotaciona a nave para ficar de costas para a câmara
scene.add(shipRoot);

const shipColors = {
  primary: 0xf25346,
  secondary: 0xd8d0d1,
  accent: 0x68c3c0,
  dark: 0x23190f,
  cockpit: 0x4169e1,
};

const fuselage = new THREE.Group();
fuselage.rotation.y = Math.PI; // Inverte a fuselagem para que as hélices fiquem para trás
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

// ---------------- Bounding Boxes para Colisões ----------------
const shipBoundingBox = new THREE.Box3();
const planetBoundingBox = new THREE.Box3();

const phys = { velocity: new THREE.Vector3(0, 0, 0), acceleration: 0, yawVel: 0, maxSpeed: 20, thrust: 30, angularSpeed: Math.PI * 2.5, damping: 0.96, angularDamping: 0.8, boostMultiplier: 2.6, boosting: false, boostAmount: 1.0, boostRechargeRate: 0.1 };
const input = { forward: false, back: false, left: false, right: false, boost: false };

const keys = { KeyW: 'forward', KeyS: 'back', KeyA: 'left', KeyD: 'right', ShiftLeft: 'boost', ShiftRight: 'boost' };
window.addEventListener("keydown", (e) => { if (keys[e.code]) input[keys[e.code]] = true; });
window.addEventListener("keyup", (e) => { if (keys[e.code]) input[keys[e.code]] = false; });

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

    // Obter posição mundial do planeta
    const planetWorldPos = new THREE.Vector3();
    p.mesh.getWorldPosition(planetWorldPos);
    
    // Criar BoundingBox do planeta nas coordenadas mundiais
    // Tamanho maior para garantir colisão (tamanho visual + margem)
    const planetSize = p.size * 4 + 1.5;
    planetBoundingBox.setFromCenterAndSize(
      planetWorldPos,
      new THREE.Vector3(planetSize, planetSize, planetSize)
    );
    
    // Atualizar BoundingBox da nave (coordenadas mundiais)
    shipBoundingBox.setFromObject(shipRoot);

    // Detecção de colisão usando BoundingBox
    if (shipBoundingBox.intersectsBox(planetBoundingBox) && p.inOrbit) {
      // Colisão = Planeta sai da órbita
      p.inOrbit = false;
      
      const impactDir = new THREE.Vector3()
        .subVectors(planetWorldPos, shipRoot.position)
        .normalize();

      const shipSpeed = phys.velocity.length();
      p.velocity.copy(impactDir).multiplyScalar(shipSpeed * 0.5 + 3);
      
      console.log("Colisão detetada com planeta!");
    }
  }

  // engine visual - rotate propellers
  leftEngine.propeller.rotation.z += 25 * dt;
  rightEngine.propeller.rotation.z += 25 * dt;

  // Sun rotation
  sun.rotation.y += 0.05 * dt;

  // physics input -> acceleration & yaw
  let thrust = 0;
  if (input.forward) thrust += phys.thrust;
  if (input.back) thrust -= phys.thrust * 0.6;

  // apply boost
  if (input.boost && phys.boostAmount > 0) {
    phys.boosting = true;
    thrust *= phys.boostMultiplier;
    leftEngine.light.intensity = 2.0;
    rightEngine.light.intensity = 2.0;
    phys.boostAmount -= 0.15 * dt; // consome boost
    if (phys.boostAmount <= 0) {
      phys.boostAmount = 0;
      leftEngine.light.intensity = 0.0;
      rightEngine.light.intensity = 0.0;
    }
  } else {
    phys.boosting = false;
    leftEngine.light.intensity = 0.0;
    rightEngine.light.intensity = 0.0;
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

  // yaw control movimento de rotação de um objeto (como um carro, avião ou barco) em torno do seu eixo vertical 
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