// ---------------- Minimap 2D ----------------

// Configuração do minimap
const minimapConfig = {
  size: 240, // Tamanho do canvas
  scale: 2.5, // Escala (pixels por unidade do mundo 3D)
  padding: 15,
  colors: {
    background: "rgba(10, 10, 20, 0.85)",
    border: "rgba(100, 150, 255, 0.5)",
    sun: "#ffdd66",
    ship: "#00ff88",
    orbit: "rgba(100, 100, 120, 0.3)",
    planets: [
      "#8b7355", // Mercúrio
      "#ffd700", // Vénus
      "#4169e1", // Terra
      "#ff6347", // Marte
      "#daa520", // Saturno
      "#f4a460", // Júpiter
      "#4fd0e7", // Urano
      "#2f4f7f", // Neptuno
    ],
  },
};

// Criar o container do minimap
const minimapContainer = document.createElement("div");
minimapContainer.id = "minimap-container";
minimapContainer.style.cssText = `
  position: fixed;
  bottom: ${minimapConfig.padding}px;
  right: ${minimapConfig.padding}px;
  width: ${minimapConfig.size}px;
  height: ${minimapConfig.size}px;
  overflow: hidden;
  border: 2px solid ${minimapConfig.colors.border};
  box-shadow: 0 0 15px rgba(0, 100, 255, 0.3);
  z-index: 1000;
`;
document.body.appendChild(minimapContainer);

// Criar o canvas
const minimapCanvas = document.createElement("canvas");
minimapCanvas.id = "minimap-canvas";
minimapCanvas.width = minimapConfig.size;
minimapCanvas.height = minimapConfig.size;
minimapCanvas.style.cssText = `
  width: 100%;
  height: 100%;
  display: block;
`;
minimapContainer.appendChild(minimapCanvas);

const ctx = minimapCanvas.getContext("2d");
const center = minimapConfig.size / 2;

// Função para converter coordenadas 3D para 2D do minimap
function worldToMinimap(x, z) {
  return {
    x: center + x * minimapConfig.scale,
    y: center + z * minimapConfig.scale,
  };
}

// Função para desenhar o minimap
function drawMinimap(planetsData, shipPosition, sunPosition) {
  // Limpar canvas (quadrado)
  ctx.fillStyle = minimapConfig.colors.background;
  ctx.fillRect(0, 0, minimapConfig.size, minimapConfig.size);

  // Desenhar órbitas
  ctx.strokeStyle = minimapConfig.colors.orbit;
  ctx.lineWidth = 1;
  planetsData.forEach((planet) => {
    if (planet.inOrbit) {
      const orbitRadius = planet.radius * minimapConfig.scale;
      ctx.beginPath();
      ctx.arc(center, center, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // Desenhar Sol
  const sunPos = worldToMinimap(sunPosition.x, sunPosition.z);
  ctx.fillStyle = minimapConfig.colors.sun;
  ctx.beginPath();
  ctx.arc(sunPos.x, sunPos.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Glow do sol
  const sunGradient = ctx.createRadialGradient(
    sunPos.x,
    sunPos.y,
    3,
    sunPos.x,
    sunPos.y,
    12
  );
  sunGradient.addColorStop(0, "rgba(255, 221, 102, 0.6)");
  sunGradient.addColorStop(1, "rgba(255, 221, 102, 0)");
  ctx.fillStyle = sunGradient;
  ctx.beginPath();
  ctx.arc(sunPos.x, sunPos.y, 12, 0, Math.PI * 2);
  ctx.fill();

  // Desenhar planetas
  planetsData.forEach((planet, index) => {
    const pos = worldToMinimap(planet.position.x, planet.position.z);

    // Verificar se está dentro do minimap
    const distFromCenter = Math.sqrt(
      Math.pow(pos.x - center, 2) + Math.pow(pos.y - center, 2)
    );

    if (distFromCenter < center - 2) {
      // Tamanho baseado no tamanho do planeta
      const planetSize = Math.max(3, planet.size * 8);

      ctx.fillStyle = minimapConfig.colors.planets[index] || "#ffffff";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, planetSize, 0, Math.PI * 2);
      ctx.fill();

      // Indicador se planeta saiu da órbita 
      if (!planet.inOrbit) {
        ctx.strokeStyle = "#ff4444";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, planetSize + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });

  // Desenhar nave (triângulo)
  const shipPos = worldToMinimap(shipPosition.x, shipPosition.z);
  const shipRotation = shipPosition.rotation || 0;

  ctx.save();
  ctx.translate(shipPos.x, shipPos.y);
  ctx.rotate(shipRotation);

  ctx.fillStyle = minimapConfig.colors.ship;
  ctx.beginPath();
  ctx.moveTo(0, 6); // Ponta 
  ctx.lineTo(-4, -4); // Esquerda
  ctx.lineTo(4, -4); // Direita
  ctx.closePath();
  ctx.fill();

  ctx.restore();  
}

// Exportar funções para uso no main.js
window.minimapAPI = {
  draw: drawMinimap,
  config: minimapConfig,
};
