// ==================== MEDIAPIPE HAND TRACKING ====================
// Variáveis globais para controlar a webcam e a deteção de mãos
let video;
let handDetector;
let canvas;
let ctx;
let hands = [];

// Estado da mão
let handX = 0.5, handY = 0.5;  // Posição normalizada 0-1
let isGrabbing = false;
let lastGrabState = false;

/**
 * Configura a webcam
 */
async function setupCamera() {
  video = document.getElementById('video');
  canvas = document.getElementById('handCanvas');
  ctx = canvas.getContext('2d');
  const handStatus = document.getElementById('handDetected');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    });
    video.srcObject = stream;
    
    // Definir dimensões fixas
    video.width = 640;
    video.height = 480;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        canvas.width = 640;
        canvas.height = 480;
        console.log('Video dimensions:', video.videoWidth, video.videoHeight);
        console.log('Canvas dimensions:', canvas.width, canvas.height);
        video.play();
        resolve();
      };
    });
  } catch (err) {
    console.error('Erro ao aceder à webcam:', err);
    if (handStatus) handStatus.textContent = '❌ Câmara não disponível';
    throw err;
  }
}

/**
 * Inicializa o sistema de deteção de mãos usando o MediaPipe
 */
async function initHandDetection() {
  const handStatus = document.getElementById('handDetected');
  
  await setupCamera();
  
  if (handStatus) handStatus.textContent = '⏳ A carregar modelo...';
  
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'tfjs',
    modelType: 'lite',
    maxHands: 1
  };

  console.log('Creating detector with config:', detectorConfig);
  handDetector = await handPoseDetection.createDetector(model, detectorConfig);
  console.log('Detetor de mãos inicializado');
  if (handStatus) handStatus.textContent = '✅ Modelo carregado - Mostra a mão!';
}

/**
 * Loop contínuo de deteção de mãos
 */
async function detectHands() {
  if (handDetector && video.readyState === 4) {
    try {
      hands = await handDetector.estimateHands(video, { flipHorizontal: false });
         if (hands.length > 0) {
        console.log('Mão detetada! Keypoints:', hands[0].keypoints.length);
      }
      drawHands();
    } catch (err) {
      console.error('Erro na deteção:', err);
    }
  }
  requestAnimationFrame(detectHands);
}

/**
 * Desenha as mãos detetadas no canvas
 */
function drawHands() {
  const handStatus = document.getElementById('handDetected');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (hands.length > 0) {
    const hand = hands[0];
    const keypoints = hand.keypoints;

    // Verificar se os dedos estão juntos (gesto de agarrar)
    isGrabbing = verificarDedosJuntos(keypoints);

    // Log do primeiro keypoint para debug
    console.log('Keypoint 0:', keypoints[0]);

    // Desenhar cada ponto da mão
    keypoints.forEach((point) => {
      // Os keypoints já vêm em coordenadas do canvas/vídeo
      const x = point.x;
      const y = point.y;
      const size = 6;

      ctx.fillStyle = isGrabbing ? '#ff4444' : '#00ff88';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Desenhar as linhas que ligam os pontos da mão
    drawConnections(keypoints);

    // Calcular centro da palma (média entre pulso e base do dedo médio)
    const wrist = keypoints[0];
    const middleBase = keypoints[9];
    
    if (wrist && middleBase) {
      const palmX = (wrist.x + middleBase.x) / 2;
      const palmY = (wrist.y + middleBase.y) / 2;
      
      // Normalizar para 0-1 usando o canvas width/height
      handX = palmX / canvas.width;
      handY = palmY / canvas.height;
      
      // Clampar valores entre 0 e 1
      handX = Math.max(0, Math.min(1, handX));
      handY = Math.max(0, Math.min(1, handY));
      
      console.log('Palm:', palmX.toFixed(0), palmY.toFixed(0), '-> HandX:', handX.toFixed(2), 'HandY:', handY.toFixed(2));
    }

    if (handStatus) handStatus.textContent = isGrabbing ? '✊ A agarrar!' : '🖐️ Mão detetada';
  } else {
    if (handStatus) handStatus.textContent = '🖐️ Mostra a mão...';
  }
}

/**
 * Desenha as linhas que ligam os pontos da mão
 */
function drawConnections(keypoints) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Polegar
    [0, 5], [5, 6], [6, 7], [7, 8],       // Indicador
    [0, 9], [9, 10], [10, 11], [11, 12],  // Médio
    [0, 13], [13, 14], [14, 15], [15, 16], // Anelar
    [0, 17], [17, 18], [18, 19], [19, 20], // Mindinho
    [5, 9], [9, 13], [13, 17]              // Ligações da palma
  ];

  ctx.strokeStyle = isGrabbing ? '#ff4444' : '#00ff88';
  ctx.lineWidth = 2;

  connections.forEach(([start, end]) => {
    const a = keypoints[start];
    const b = keypoints[end];
    if (a && b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  });
}

/**
 * Deteta o gesto de pinça (dedos juntos ao polegar)
 */
function verificarDedosJuntos(keypoints) {
  const polegar = keypoints[4];
  const indicador = keypoints[8];
  const medio = keypoints[12];
  const anelar = keypoints[16];
  const mindinho = keypoints[20];

  const pontas = [indicador, medio, anelar, mindinho];

  let dedosProximos = 0;
  pontas.forEach((ponta) => {
    const distancia = Math.sqrt(
      Math.pow(polegar.x - ponta.x, 2) + Math.pow(polegar.y - ponta.y, 2)
    );
    if (distancia <= 60) {
      dedosProximos++;
    }
  });

  return dedosProximos >= 2;
}

/**
 * Inicializa tudo
 */
async function init() {
  console.log('=== INIT HAND TRACKING ===');
  try {
    await initHandDetection();
    console.log('=== STARTING DETECTION LOOP ===');
    detectHands();
  } catch (err) {
    console.error('Erro ao inicializar hand tracking:', err);
  }
}

// Export functions for main.js to use
window.handTracking = {
  init: init,
  loop: () => {}, // O loop já está integrado no detectHands
  getData: () => ({
    detected: hands.length > 0,
    x: handX,
    y: handY,
    grabbing: isGrabbing,
    wasGrabbing: lastGrabState
  }),
  updateLastGrabState: () => { lastGrabState = isGrabbing; }
};
