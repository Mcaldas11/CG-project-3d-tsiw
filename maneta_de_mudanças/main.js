import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555555);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 10, 0.1);  // Visão de cima

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 2, 0);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(5, 10, 5);
mainLight.castShadow = true;
scene.add(mainLight);

// Console base
const consoleGroup = new THREE.Group();
scene.add(consoleGroup);

const addBox = (w, h, d, color, y, metalness = 0.5) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, metalness, roughness: 1 - metalness })
  );
  mesh.position.y = y;
  mesh.castShadow = true;
  consoleGroup.add(mesh);
  return mesh;
};

addBox(4, 0.3, 3, 0x1a1a1a, 0.15, 0.7);      // Base
addBox(3.5, 0.15, 2.5, 0x2a2a2a, 0.38, 0.1); // Leather
addBox(2.8, 0.08, 2.2, 0xcccccc, 0.5, 0.9);  // Gate plate

// Gear positions: R-1-3-5 / 2-4-6
const gearPos = {
  'N': { x: 0.6, z: 0 }, 'R': { x: -0.9, z: -0.5 },
  '1': { x: 0, z: -0.5 }, '2': { x: 0, z: 0.5 },
  '3': { x: 0.6, z: -0.5 }, '4': { x: 0.6, z: 0.5 },
  '5': { x: 1.2, z: -0.5 }, '6': { x: 1.2, z: 0.5 }
};

// Gate grooves
const grooveMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const addGroove = (w, d, x, z) => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), grooveMat);
  g.position.set(x, 0.52, z);
  consoleGroup.add(g);
};
addGroove(0.6, 0.15, -0.45, -0.5);  // R connector
addGroove(0.15, 0.6, -0.9, -0.2);   // R vertical
addGroove(0.15, 1.15, 0, 0);        // 1-2
addGroove(0.15, 1.15, 0.6, 0);      // 3-4
addGroove(0.15, 1.15, 1.2, 0);      // 5-6
addGroove(1.5, 0.15, 0.6, 0);       // Center horizontal

// Lever
const leverGroup = new THREE.Group();
leverGroup.position.y = 0.5;
consoleGroup.add(leverGroup);

const addCylinder = (rTop, rBot, h, color, y) => {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, 16),
    new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5 })
  );
  mesh.position.y = y;
  mesh.castShadow = true;
  leverGroup.add(mesh);
  return mesh;
};

addCylinder(0.08, 0.1, 3, 0x888888, 1.5);    // Shaft
addCylinder(0.25, 0.2, 0.3, 0x2a2a2a, 2.85); // Knob base

const knob = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
knob.position.y = 3.2;
leverGroup.add(knob);

// ==================== 3D HAND MODEL ====================
const handGroup = new THREE.Group();
handGroup.visible = false;
consoleGroup.add(handGroup);

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8beac, roughness: 0.8 });

// Palm - posição relativa ao knob (Y ~3.7 desde a base)
const palm = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.15, 0.6),
  skinMat
);
palm.position.y = 3.3;
handGroup.add(palm);

// Fingers
const fingerData = [
  { x: -0.18, z: -0.35, len: 0.35 },  // Index
  { x: -0.06, z: -0.38, len: 0.4 },   // Middle
  { x: 0.06, z: -0.36, len: 0.35 },   // Ring
  { x: 0.18, z: -0.32, len: 0.3 },    // Pinky
];

const fingers = [];
for (const fd of fingerData) {
  const finger = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.04, fd.len, 4, 8),
    skinMat
  );
  finger.position.set(fd.x, 3.3, fd.z);
  finger.rotation.x = -Math.PI / 3;
  handGroup.add(finger);
  fingers.push(finger);
}

// Thumb
const thumb = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.05, 0.25, 4, 8),
  skinMat
);
thumb.position.set(-0.32, 3.25, -0.1);
thumb.rotation.z = Math.PI / 3;
thumb.rotation.x = -Math.PI / 6;
handGroup.add(thumb);

// Wrist/arm hint
const wrist = new THREE.Mesh(
  new THREE.CylinderGeometry(0.12, 0.15, 0.4, 8),
  skinMat
);
wrist.position.set(0, 3.3, 0.4);
wrist.rotation.x = Math.PI / 2.5;
handGroup.add(wrist);

// Function to update hand grip
function updateHandGrip(grabbing) {
  const gripAngle = grabbing ? -Math.PI / 1.8 : -Math.PI / 3;
  for (const finger of fingers) {
    finger.rotation.x = gripAngle;
  }
  thumb.rotation.z = grabbing ? Math.PI / 2.5 : Math.PI / 3;
}

// State
let currentGear = 'N', targetPos = { x: 0.6, z: 0 };
let waypoints = [], wpIndex = 0, animating = false;

// Set initial lever position to Neutral
leverGroup.position.x = 0.6;
leverGroup.position.z = 0;

const gearDisplay = document.getElementById('currentGear');

// Path calculation
const getLane = g => ({ 'R': -0.9, '1': 0, '2': 0, '3': 0.6, '4': 0.6, '5': 1.2, '6': 1.2, 'N': 0.6 }[g] || 0);

function calcPath(from, to) {
  if (from === to || !gearPos[from] || !gearPos[to]) return [];
  
  const path = [];
  const fromLane = getLane(from), toLane = getLane(to);
  
  // To Neutral
  if (to === 'N') {
    if (from === 'R') {
      // R -> go right to 1 position -> down to center -> to N
      path.push({ x: 0, z: -0.5 });  // Move right along top to lane 1
      path.push({ x: 0, z: 0 });      // Down to center
    } else {
      path.push({ x: fromLane, z: 0 });
    }
    path.push(gearPos.N);
    return path;
  }
  
  // From Neutral
  if (from === 'N') {
    if (to === 'R') {
      // N -> go to lane 1 center -> up to 1 position -> left to R
      path.push({ x: 0, z: 0 });      // Go to lane 1 center
      path.push({ x: 0, z: -0.5 });   // Up to top
      path.push(gearPos.R);           // Left to R
      return path;
    }
    return [{ x: toLane, z: 0 }, gearPos[to]];
  }
  
  // From R
  if (from === 'R') {
    // R -> right to 1 -> down to center -> navigate
    path.push({ x: 0, z: -0.5 });     // Move right along top to lane 1
    path.push({ x: 0, z: 0 });        // Down to center
    if (toLane !== 0) path.push({ x: toLane, z: 0 });
    path.push(gearPos[to]);
    return path;
  }
  
  // To R
  if (to === 'R') {
    // Go to center -> go to lane 1 center -> up to 1 top -> left to R
    if (fromLane !== 0) path.push({ x: fromLane, z: 0 });
    path.push({ x: 0, z: 0 });        // Lane 1 center
    path.push({ x: 0, z: -0.5 });     // Up to top
    path.push(gearPos.R);             // Left to R
    return path;
  }
  
  // Same lane
  if (fromLane === toLane) return [gearPos[to]];
  
  // Different lanes
  return [{ x: fromLane, z: 0 }, { x: toLane, z: 0 }, gearPos[to]];
}

// Shift gear
function shiftTo(gear) {
  if (!gearPos[gear] || gear === currentGear || animating) return;
  
  waypoints = calcPath(currentGear, gear);
  if (waypoints.length) {
    wpIndex = 0;
    targetPos = { ...waypoints[0] };
    animating = true;
  }
  
  currentGear = gear;
  gearDisplay.textContent = gear;
  gearDisplay.className = gear === 'N' ? 'gear-neutral' : gear === 'R' ? 'gear-reverse' : 'gear-forward';
}

// Input
window.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if ('123456'.includes(k) || k === 'R' || k === 'N') {
    e.preventDefault();
    shiftTo(k);
  }
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  
  // ==================== ANIMAÇÕES EM LOOP ====================
  
  //  Vibração do motor (idle) - tremor subtil constante
  const idleVibration = Math.sin(elapsed * 35) * 0.003;
  const idleVibrationZ = Math.cos(elapsed * 28) * 0.002;
  leverGroup.position.y = 0.5 + idleVibration;
  
  //  Rotação lenta do pomo (efeito decorativo)
  knob.rotation.y += 0.008;
  
  //  Leve oscilação da alavanca quando parada (motor idle)
  if (!animating) {
    leverGroup.rotation.x += Math.sin(elapsed * 25) * 0.0003;
    leverGroup.rotation.z += Math.cos(elapsed * 20) * 0.0002;
  }
  
  // ==================== FIM ANIMAÇÕES EM LOOP ====================
  
  // Move lever
  const dx = targetPos.x - leverGroup.position.x;
  const dz = targetPos.z - leverGroup.position.z;
  leverGroup.position.x += dx * 12 * dt;
  leverGroup.position.z += dz * 12 * dt;
  leverGroup.rotation.x = -leverGroup.position.z * 0.15 + Math.sin(elapsed * 25) * 0.002;
  leverGroup.rotation.z = leverGroup.position.x * 0.15 + Math.cos(elapsed * 20) * 0.002;
  
  // Waypoint check
  if (animating && Math.hypot(dx, dz) < 0.05) {
    if (++wpIndex < waypoints.length) targetPos = { ...waypoints[wpIndex] };
    else animating = false;
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ==================== HAND CONTROL (uses ml5.js) ====================
function getNearestGear(x, z) {
  let nearest = 'N';
  let minDist = Infinity;
  
  for (const [gear, pos] of Object.entries(gearPos)) {
    const dist = Math.hypot(x - pos.x, z - pos.z);
    if (dist < minDist) {
      minDist = dist;
      nearest = gear;
    }
  }
  
  return minDist < 0.4 ? nearest : null;
}

function updateHandControl() {
  const hand = window.handTracking.getData();
  
  // DEBUG: Log hand data
  console.log('Hand data:', hand.detected, hand.x, hand.y);
  
  if (!hand.detected) {
    handGroup.visible = false;
    return;
  }
  
  handGroup.visible = true;
  
  // Verificar se valores são válidos
  if (isNaN(hand.x) || isNaN(hand.y)) {
    console.log('NaN detected!');
    return;
  }
  
  // Map hand position to lever range (clamped values)
  // Inverter X: mão esquerda = manete esquerda
  // Inverter Y: mão cima = manete cima (para trás)
  const leverX = 1.2 - hand.x * 2.1;  // Range: 1.2 to -0.9 (invertido)
  const leverZ = -0.5 + hand.y * 1.0;  // Range: -0.5 to 0.5 (invertido)
  
  console.log('Lever target:', leverX, leverZ);
  
  if (!animating && !isNaN(leverX) && !isNaN(leverZ)) {
    // Smooth movement
    targetPos.x += (leverX - targetPos.x) * 0.15;
    targetPos.z += (leverZ - targetPos.z) * 0.15;
    
    // Clamp to valid gear area
    targetPos.x = Math.max(-0.9, Math.min(1.2, targetPos.x));
    targetPos.z = Math.max(-0.5, Math.min(0.5, targetPos.z));
  }
  
  // Update 3D hand position to follow lever
  handGroup.position.x = leverGroup.position.x;
  handGroup.position.z = leverGroup.position.z;
  updateHandGrip(hand.grabbing);
  
  // Detect gear on release
  if (hand.wasGrabbing && !hand.grabbing) {
    const nearGear = getNearestGear(leverGroup.position.x, leverGroup.position.z);
    if (nearGear && nearGear !== currentGear) {
      currentGear = nearGear;
      targetPos = { ...gearPos[nearGear] };
      gearDisplay.textContent = nearGear;
      gearDisplay.className = nearGear === 'N' ? 'gear-neutral' : nearGear === 'R' ? 'gear-reverse' : 'gear-forward';
    }
  }
  
  window.handTracking.updateLastGrabState();
}

// Main loop with hand control
function mainLoop() {
  requestAnimationFrame(mainLoop);
  updateHandControl();
}

// Start
window.handTracking.init();
window.handTracking.loop();
mainLoop();

shiftTo('N');
animate();
