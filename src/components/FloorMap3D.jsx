import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// ============================================================
// PALETA DE CORES
// ============================================================

const COLORS = {
  background: 0x0d0d1a,

  // Chão
  floor: 0x1b4332,

  // Arestas
  edge: 0x46515f,
  edgeRoute: 0xff4757,

  // Nós
  node: 0x4a90d9,
  nodeRoute: 0xff6b81,
  nodeStart: 0x2ecc71,
  nodeEnd: 0xe74c3c,

  // Escadas
  stairs: 0xdfe6e9,

  // Portas
  door: 0xffffff,

  // Cantina
  cantinaFloor: 0xd8d0c0,
  cantinaCounter: 0x5d4037,
  cantinaChair: 0x444444,
  cantinaTable: 0x8d6e63,
  cantinaLeg: 0x555555,

  // Metais
  metal: 0xc0c0c0,

  // Restaurante Universitário
  ruWall: 0xd9dde1,
  ruWallDark: 0xb8bec5,
  ruRoof: 0x3d4650,
  ruRoofDark: 0x29313a,
  ruWindow: 0x6fa8dc,
  ruGlass: 0x9ed8ff,
  ruDoor: 0x303840,
  ruSign: 0xf4f4f4,
  ruSignText: 0x1d3557,
  ruFloor: 0xc8cdd2,
  ruTable: 0xffffff,
  ruChair: 0x555b61,
  ruCounter: 0x626970,
};

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const CONFIG = {
  camera: {
    fov: 55,
    near: 1,
    far: 3000,
    position: [500, 700, 900],
  },

  controls: {
    minDistance: 120,
    maxDistance: 1800,
    maxPolarAngle: Math.PI / 2 - 0.03,
    dampingFactor: 0.06,
    zoomSpeed: 0.8,
    rotateSpeed: 0.6,
    panSpeed: 0.7,
  },

  renderer: {
    maxPixelRatio: 2,
  },

  floor: {
    size: 5000,
    position: [500, 0, 600],
  },

  edge: {
    normalWidth: 16,
    routeWidth: 17,

    normalHeight: 2,
    routeHeight: 3,

    extraLength: 17,
  },

  node: {
    normalHeight: 18,
    routeHeight: 28,
    endpointHeight: 40,
    normalRadius: 7,
    routeRadius: 9,
    endpointRadius: 12,
  },
};

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Converte coordenadas do grafo/SVG
 * para coordenadas do Three.js.
 *
 * No mapa:
 *
 * x → X
 * y → Z
 * height → Y
 */
function toVec3(x = 0, y = 0, height = 0) {
  return new THREE.Vector3(x, height, y);
}

/**
 * Cria um Map para acessar vértices
 * diretamente pelo ID.
 *
 * Antes:
 *
 * vertices.find(...)
 *
 * Agora:
 *
 * vertexMap.get(id)
 */
function buildVertexMap(vertices = []) {
  return new Map(vertices.map((vertex) => [vertex.id, vertex]));
}

/**
 * Cria um Set contendo as conexões
 * que pertencem à rota.
 */
function buildRouteSet(route = []) {
  const set = new Set();

  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i];
    const to = route[i + 1];

    set.add(`${from}-${to}`);
    set.add(`${to}-${from}`);
  }

  return set;
}

/**
 * Libera um material e suas texturas.
 */
function disposeMaterial(material) {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  material.map?.dispose();
  material.alphaMap?.dispose();
  material.aoMap?.dispose();
  material.bumpMap?.dispose();
  material.normalMap?.dispose();
  material.roughnessMap?.dispose();
  material.metalnessMap?.dispose();

  material.dispose();
}

/**
 * Libera todos os recursos da cena.
 */
function disposeScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {
      disposeMaterial(object.material);
    }
  });
}

// ============================================================
// MATERIAIS
// ============================================================

function createMaterials() {
  return {
    // --------------------------------------------------------
    // Aresta normal
    // --------------------------------------------------------

    edge: new THREE.MeshStandardMaterial({
      color: COLORS.edge,
      roughness: 0.85,
      metalness: 0.05,
    }),

    // --------------------------------------------------------
    // Aresta pertencente ao caminho
    // --------------------------------------------------------

    edgeRoute: new THREE.MeshStandardMaterial({
      color: COLORS.edgeRoute,
      emissive: COLORS.edgeRoute,
      emissiveIntensity: 0.35,
      roughness: 0.7,
      metalness: 0.05,
    }),

    // --------------------------------------------------------
    // Nó normal
    // --------------------------------------------------------

    node: new THREE.MeshStandardMaterial({
      color: COLORS.node,
      emissive: COLORS.node,
      emissiveIntensity: 0.08,
      roughness: 0.35,
      metalness: 0.35,
    }),

    // --------------------------------------------------------
    // Nó que está no caminho
    // --------------------------------------------------------

    nodeRoute: new THREE.MeshStandardMaterial({
      color: COLORS.nodeRoute,
      emissive: COLORS.nodeRoute,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.3,
    }),

    // --------------------------------------------------------
    // Origem
    // --------------------------------------------------------

    nodeStart: new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.3,
    }),

    // --------------------------------------------------------
    // Destino
    // --------------------------------------------------------

    nodeEnd: new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.3,
    }),

    // --------------------------------------------------------
    // Chão
    // --------------------------------------------------------

    floor: new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 1,
      metalness: 0,
    }),

    // --------------------------------------------------------
    // Escada normal
    // --------------------------------------------------------

    stairs: new THREE.MeshStandardMaterial({
      color: COLORS.stairs,
      roughness: 0.4,
      metalness: 0.35,
    }),

    // --------------------------------------------------------
    // Porta normal
    // --------------------------------------------------------

    door: new THREE.MeshStandardMaterial({
      color: COLORS.door,
      roughness: 0.6,
      metalness: 0.1,
    }),

    // --------------------------------------------------------
    // Porta/escada de origem
    // --------------------------------------------------------

    endpointStart: new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.25,
    }),

    // --------------------------------------------------------
    // Porta/escada de destino
    // --------------------------------------------------------

    endpointEnd: new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.25,
    }),

    // --------------------------------------------------------
    // Cantina
    // --------------------------------------------------------

    cantinaFloor: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaFloor,
      roughness: 0.9,
    }),

    cantinaCounter: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaCounter,
      roughness: 0.7,
    }),

    cantinaChair: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaChair,
      roughness: 0.8,
    }),

    cantinaTable: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaTable,
      roughness: 0.75,
    }),

    cantinaLeg: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaLeg,
      roughness: 0.35,
      metalness: 0.8,
    }),

    // --------------------------------------------------------
    // Maçaneta
    // --------------------------------------------------------

    handle: new THREE.MeshStandardMaterial({
      color: COLORS.metal,
      roughness: 0.15,
      metalness: 1,
    }),
  };
}

// ============================================================
// ARESTA
// ============================================================

function createEdge(scene, p1, p2, isOnRoute, materials) {
  const direction = new THREE.Vector3().subVectors(p2, p1);

  const horizontalLength = Math.sqrt(direction.x ** 2 + direction.z ** 2);

  if (horizontalLength <= 0) {
    return;
  }

  const length = horizontalLength + CONFIG.edge.extraLength;

  const width = isOnRoute ? CONFIG.edge.routeWidth : CONFIG.edge.normalWidth;

  const height = isOnRoute ? CONFIG.edge.routeHeight : CONFIG.edge.normalHeight;

  const geometry = new THREE.BoxGeometry(length, height, width);

  const material = isOnRoute ? materials.edgeRoute : materials.edge;

  const mesh = new THREE.Mesh(geometry, material);

  // Centro da aresta
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);

  // Rotação horizontal
  const angle = Math.atan2(direction.z, direction.x);

  mesh.rotation.y = -angle;

  // Elevação
  mesh.position.y = height / 2;

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);
}

// ============================================================
// NÓ GENÉRICO
// ============================================================

function createNode(scene, vertex, isOnRoute, isStart, isEnd, materials) {
  const height =
    isStart || isEnd
      ? CONFIG.node.endpointHeight
      : isOnRoute
        ? CONFIG.node.routeHeight
        : CONFIG.node.normalHeight;

  const radius =
    isStart || isEnd
      ? CONFIG.node.endpointRadius
      : isOnRoute
        ? CONFIG.node.routeRadius
        : CONFIG.node.normalRadius;

  // ----------------------------------------------------------
  // Material
  // ----------------------------------------------------------

  let material = materials.node;

  if (isStart) {
    material = materials.nodeStart;
  } else if (isEnd) {
    material = materials.nodeEnd;
  } else if (isOnRoute) {
    material = materials.nodeRoute;
  }

  // ----------------------------------------------------------
  // Corpo
  // ----------------------------------------------------------

  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.3, height, 16),
    material,
  );

  cylinder.position.set(vertex.x, height / 2, vertex.y);

  cylinder.castShadow = true;
  cylinder.receiveShadow = true;

  scene.add(cylinder);

  // ----------------------------------------------------------
  // Esfera superior
  // ----------------------------------------------------------

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.2, 20, 20),
    material,
  );

  sphere.position.set(vertex.x, height + radius * 0.8, vertex.y);

  sphere.castShadow = true;

  scene.add(sphere);

  // ----------------------------------------------------------
  // Anel
  //
  // Somente para elementos que estão
  // realmente destacados na rota.
  // ----------------------------------------------------------

  if (isOnRoute || isStart || isEnd) {
    let ringColor = COLORS.nodeRoute;

    if (isStart) {
      ringColor = COLORS.nodeStart;
    } else if (isEnd) {
      ringColor = COLORS.nodeEnd;
    }

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 2.1, 1.8, 8, 32),
      new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.8,
      }),
    );

    ring.position.set(vertex.x, height + radius * 0.8, vertex.y);

    ring.rotation.x = Math.PI / 2;

    scene.add(ring);
  }
}

// ============================================================
// LABEL
// ============================================================

function createLabel(scene, vertex, text) {
  if (!text) return;

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // ----------------------------------------------------------
  // Fundo
  // ----------------------------------------------------------

  ctx.fillStyle = "rgba(10, 12, 20, 0.85)";

  if (ctx.roundRect) {
    ctx.beginPath();

    ctx.roundRect(8, 8, 496, 112, 18);

    ctx.fill();
  } else {
    ctx.fillRect(8, 8, 496, 112);
  }

  // ----------------------------------------------------------
  // Texto
  // ----------------------------------------------------------

  ctx.fillStyle = "#ffffff";

  ctx.font = "bold 34px Arial";

  ctx.textAlign = "center";

  ctx.textBaseline = "middle";

  const maxWidth = 450;

  let label = String(text);

  while (ctx.measureText(label).width > maxWidth && label.length > 5) {
    label = label.slice(0, -4) + "...";
  }

  ctx.fillText(label, 256, 64);

  // ----------------------------------------------------------
  // Textura
  // ----------------------------------------------------------

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;

  texture.needsUpdate = true;

  // ----------------------------------------------------------
  // Sprite
  // ----------------------------------------------------------

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);

  sprite.position.set(vertex.x, 65, vertex.y);

  sprite.scale.set(100, 25, 1);

  scene.add(sprite);
}

// ============================================================
// ESCADA
// ============================================================

/**
 * IMPORTANTE:
 *
 * isStart/isEnd são usados aqui.
 *
 * NÃO usamos isOnRoute.
 *
 * Portanto:
 *
 * escada no meio do caminho
 * → normal
 *
 * escada como origem
 * → verde
 *
 * escada como destino
 * → vermelho
 */
function createEscada(scene, vertex, isStart, isEnd, materials) {
  const group = new THREE.Group();

  // ----------------------------------------------------------
  // Material
  // ----------------------------------------------------------

  let stairMaterial = materials.stairs;

  if (isStart) {
    stairMaterial = materials.endpointStart;
  } else if (isEnd) {
    stairMaterial = materials.endpointEnd;
  }

  // ----------------------------------------------------------
  // Degraus
  // ----------------------------------------------------------

  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(22, 4, 25),
      stairMaterial,
    );

    step.position.set(-i * 7, 2 + i * 4, 0);

    step.castShadow = true;
    step.receiveShadow = true;

    group.add(step);
  }

  // ----------------------------------------------------------
  // Glow SOMENTE quando é origem/destino
  // ----------------------------------------------------------

  if (isStart || isEnd) {
    const glowColor = isStart ? COLORS.nodeStart : COLORS.nodeEnd;

    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 18, 1.5, 32),
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.3,
      }),
    );

    glow.position.y = 1;

    group.add(glow);
  }

  // ----------------------------------------------------------
  // Posição
  // ----------------------------------------------------------

  group.position.set(vertex.x - 20, 0, vertex.y);

  // ----------------------------------------------------------
  // ORIENTAÇÃO
  // ----------------------------------------------------------
  //
  // Unidade B:
  // → vira a escada para a esquerda
  //
  // Demais unidades:
  // → mantém orientação atual
  // ----------------------------------------------------------

  if (vertex.unidade === "B") {
    group.rotation.y = Math.PI;
    group.position.set(vertex.x - -20, 0, vertex.y);
  }

  scene.add(group);
}

// ============================================================
// PORTA
// ============================================================

/**
 * Porta segue a mesma regra da escada:
 *
 * No caminho:
 * → normal
 *
 * Origem:
 * → verde
 *
 * Destino:
 * → vermelho
 */
function createDoor(scene, vertex, isStart, isEnd, materials) {
  const group = new THREE.Group();

  // ----------------------------------------------------------
  // Material da porta
  // ----------------------------------------------------------

  let doorMaterial = materials.door;

  if (isStart) {
    doorMaterial = materials.endpointStart;
  } else if (isEnd) {
    doorMaterial = materials.endpointEnd;
  }

  // ----------------------------------------------------------
  // Porta
  // ----------------------------------------------------------

  const door = new THREE.Mesh(new THREE.BoxGeometry(15, 28, 4), doorMaterial);

  door.position.y = 15;
  door.position.z = 2;

  door.castShadow = true;
  door.receiveShadow = true;

  group.add(door);

  // ----------------------------------------------------------
  // Maçaneta
  // ----------------------------------------------------------

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    materials.handle,
  );

  handle.position.set(5, 15, 5);

  handle.castShadow = true;

  group.add(handle);

  // ----------------------------------------------------------
  // Posição inicial
  // ----------------------------------------------------------

  group.position.set(vertex.x, 0, vertex.y);

  // ----------------------------------------------------------
  // Orientação da porta
  // ----------------------------------------------------------

  const offsets = {
    "sala-direita": {
      rotation: -Math.PI / 2,
      x: 12,
      z: 0,
    },

    "sala-esquerda": {
      rotation: Math.PI / 2,
      x: -12,
      z: 0,
    },

    "sala-cima": {
      rotation: 0,
      x: 0,
      z: -12,
    },

    "sala-baixo": {
      rotation: Math.PI,
      x: 0,
      z: 12,
    },
  };

  const config = offsets[vertex.tipo];

  if (config) {
    group.rotation.y = config.rotation;

    group.position.x += config.x;

    group.position.z += config.z;
  }

  // ----------------------------------------------------------
  // Glow da porta
  // ----------------------------------------------------------

  if (isStart || isEnd) {
    const glowColor = isStart ? COLORS.nodeStart : COLORS.nodeEnd;

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(19, 32, 2),
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      }),
    );

    glow.position.set(0, 15, -2.5);

    group.add(glow);
  }

  scene.add(group);
}
// ============================================================
// RESTAURANTE UNIVERSITÁRIO - RU
// ============================================================

function createRU(scene, vertex, isStart, isEnd) {
  const group = new THREE.Group();

  // ==========================================================
  // MATERIAIS
  // ==========================================================

  const normal = {
    wall: new THREE.MeshStandardMaterial({
      color: COLORS.ruWall,
      roughness: 0.8,
      metalness: 0.05,
    }),

    wallDark: new THREE.MeshStandardMaterial({
      color: COLORS.ruWallDark,
      roughness: 0.8,
      metalness: 0.05,
    }),

    roof: new THREE.MeshStandardMaterial({
      color: COLORS.ruRoof,
      roughness: 0.65,
      metalness: 0.15,
    }),

    roofDark: new THREE.MeshStandardMaterial({
      color: COLORS.ruRoofDark,
      roughness: 0.7,
      metalness: 0.15,
    }),

    window: new THREE.MeshStandardMaterial({
      color: COLORS.ruWindow,
      roughness: 0.2,
      metalness: 0.15,
    }),

    glass: new THREE.MeshPhysicalMaterial({
      color: COLORS.ruGlass,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.05,
    }),

    door: new THREE.MeshStandardMaterial({
      color: COLORS.ruDoor,
      roughness: 0.35,
      metalness: 0.4,
    }),

    floor: new THREE.MeshStandardMaterial({
      color: COLORS.ruFloor,
      roughness: 0.9,
    }),

    table: new THREE.MeshStandardMaterial({
      color: COLORS.ruTable,
      roughness: 0.55,
    }),

    chair: new THREE.MeshStandardMaterial({
      color: COLORS.ruChair,
      roughness: 0.7,
    }),

    counter: new THREE.MeshStandardMaterial({
      color: COLORS.ruCounter,
      roughness: 0.6,
      metalness: 0.15,
    }),

    metal: new THREE.MeshStandardMaterial({
      color: 0x70777e,
      roughness: 0.3,
      metalness: 0.8,
    }),
  };

  // ==========================================================
  // MATERIAL DE DESTAQUE
  // ==========================================================

  let endpointMaterial = null;

  if (isStart) {
    endpointMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.45,
      roughness: 0.45,
      metalness: 0.05,
    });
  }

  if (isEnd) {
    endpointMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.45,
      roughness: 0.45,
      metalness: 0.05,
    });
  }

  const getMaterial = (material) => {
    return endpointMaterial || material;
  };

  // ==========================================================
  // DIMENSÕES DO PRÉDIO
  // ==========================================================

  const WIDTH = 220;
  const DEPTH = 150;

  const WALL_HEIGHT = 65;

  // ==========================================================
  // PISO
  // ==========================================================

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, 4, DEPTH),
    getMaterial(normal.floor),
  );

  floor.position.y = 2;

  floor.receiveShadow = true;
  floor.castShadow = true;

  group.add(floor);

  // ==========================================================
  // PLATAFORMA / CALÇADA
  // ==========================================================

  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 20, 3, DEPTH + 20),
    getMaterial(normal.wallDark),
  );

  platform.position.y = -1;

  platform.receiveShadow = true;
  platform.castShadow = true;

  group.add(platform);

  // ==========================================================
  // PAREDE TRASEIRA
  // ==========================================================

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, WALL_HEIGHT, 6),
    getMaterial(normal.wall),
  );

  backWall.position.set(0, WALL_HEIGHT / 2, -DEPTH / 2);

  backWall.castShadow = true;
  backWall.receiveShadow = true;

  group.add(backWall);

  // ==========================================================
  // PAREDE ESQUERDA
  // ==========================================================

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(6, WALL_HEIGHT, DEPTH),
    getMaterial(normal.wall),
  );

  leftWall.position.set(-WIDTH / 2, WALL_HEIGHT / 2, 0);

  leftWall.castShadow = true;
  leftWall.receiveShadow = true;

  group.add(leftWall);

  // ==========================================================
  // PAREDE DIREITA
  // ==========================================================

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(6, WALL_HEIGHT, DEPTH),
    getMaterial(normal.wall),
  );

  rightWall.position.set(WIDTH / 2, WALL_HEIGHT / 2, 0);

  rightWall.castShadow = true;
  rightWall.receiveShadow = true;

  group.add(rightWall);

  // ==========================================================
  // FACHADA FRONTAL
  // ==========================================================
  //
  // Deixamos espaços para portas e janelas.
  //

  const frontSideLeft = new THREE.Mesh(
    new THREE.BoxGeometry(65, WALL_HEIGHT, 6),
    getMaterial(normal.wall),
  );

  frontSideLeft.position.set(-77.5, WALL_HEIGHT / 2, DEPTH / 2);

  frontSideLeft.castShadow = true;
  frontSideLeft.receiveShadow = true;

  group.add(frontSideLeft);

  const frontSideRight = new THREE.Mesh(
    new THREE.BoxGeometry(65, WALL_HEIGHT, 6),
    getMaterial(normal.wall),
  );

  frontSideRight.position.set(77.5, WALL_HEIGHT / 2, DEPTH / 2);

  frontSideRight.castShadow = true;
  frontSideRight.receiveShadow = true;

  group.add(frontSideRight);

  // ==========================================================
  // PARTE SUPERIOR DA FACHADA
  // ==========================================================

  const frontTop = new THREE.Mesh(
    new THREE.BoxGeometry(90, 25, 6),
    getMaterial(normal.wall),
  );

  frontTop.position.set(0, 52.5, DEPTH / 2);

  frontTop.castShadow = true;
  frontTop.receiveShadow = true;

  group.add(frontTop);

  // ==========================================================
  // PORTA PRINCIPAL - ESQUERDA
  // ==========================================================

  function createEntranceDoor(x) {
    const doorGroup = new THREE.Group();

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(28, 48, 5),
      normal.metal,
    );

    frame.position.y = 24;

    doorGroup.add(frame);

    const glassDoor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 42, 2),
      endpointMaterial || normal.glass,
    );

    glassDoor.position.set(0, 22, 3);

    doorGroup.add(glassDoor);

    // puxador
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 1.5),
      normal.metal,
    );

    handle.position.set(6, 22, 5);

    doorGroup.add(handle);

    doorGroup.position.set(x, 0, DEPTH / 2 + 3);

    group.add(doorGroup);
  }

  createEntranceDoor(-18);
  createEntranceDoor(18);

  // ==========================================================
  // JANELAS FRONTAIS
  // ==========================================================

  function createFrontWindow(x, y = 30) {
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(32, 28, 4),
      normal.metal,
    );

    windowFrame.position.set(x, y, DEPTH / 2 + 2);

    group.add(windowFrame);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(26, 22, 2),
      endpointMaterial || normal.glass,
    );

    glass.position.set(x, y, DEPTH / 2 + 4);

    group.add(glass);
  }

  createFrontWindow(-105);
  createFrontWindow(105);

  // ==========================================================
  // JANELAS LATERAIS
  // ==========================================================

  function createSideWindow(z, side) {
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(3, 28, 30),
      endpointMaterial || normal.glass,
    );

    glass.position.set(side * (WIDTH / 2 + 3), 32, z);

    group.add(glass);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(5, 32, 34),
      normal.metal,
    );

    frame.position.set(side * (WIDTH / 2 + 2), 32, z);

    group.add(frame);
  }

  createSideWindow(-40, -1);
  createSideWindow(5, -1);
  createSideWindow(-40, 1);
  createSideWindow(5, 1);

  // ==========================================================
  // TELHADO
  // ==========================================================

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 14, 8, DEPTH + 14),
    normal.roof,
  );

  roof.position.y = WALL_HEIGHT + 4;

  roof.castShadow = true;
  roof.receiveShadow = true;

  group.add(roof);

  // ==========================================================
  // BEIRAL
  // ==========================================================

  const roofBorder = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 24, 5, DEPTH + 24),
    normal.roofDark,
  );

  roofBorder.position.y = WALL_HEIGHT - 1;

  roofBorder.castShadow = true;
  roofBorder.receiveShadow = true;

  group.add(roofBorder);

  // ==========================================================
  // PLACA "RU"
  // ==========================================================

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(65, 20, 3),
    normal.ruSign ||
      new THREE.MeshStandardMaterial({
        color: COLORS.ruSign,
        roughness: 0.5,
      }),
  );

  sign.position.set(0, 42, DEPTH / 2 + 7);

  sign.castShadow = true;

  group.add(sign);

  // ==========================================================
  // TEXTO DA PLACA
  // ==========================================================

  const canvas = document.createElement("canvas");

  canvas.width = 512;
  canvas.height = 128;

  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = "#f4f4f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1d3557";

    ctx.font = "bold 82px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("RU", 256, 64);
  }

  if (ctx) {
    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(55, 14),
      labelMaterial,
    );

    label.position.set(0, 42, DEPTH / 2 + 9);

    group.add(label);
  }

  // ==========================================================
  // INTERIOR
  // ==========================================================

  // ----------------------------------------------------------
  // BALCÃO DE DISTRIBUIÇÃO
  // ----------------------------------------------------------

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(160, 18, 15),
    getMaterial(normal.counter),
  );

  counter.position.set(0, 11, -45);

  counter.castShadow = true;
  counter.receiveShadow = true;

  group.add(counter);

  // ----------------------------------------------------------
  // TAMPO DO BALCÃO
  // ----------------------------------------------------------

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(165, 3, 20),
    getMaterial(normal.metal),
  );

  counterTop.position.set(0, 21, -45);

  counterTop.castShadow = true;

  group.add(counterTop);

  // ==========================================================
  // MESAS
  // ==========================================================

  function createTable(x, z) {
    const tableGroup = new THREE.Group();

    // tampo
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(13, 13, 2.5, 32),
      getMaterial(normal.table),
    );

    top.position.y = 15;

    top.castShadow = true;
    top.receiveShadow = true;

    tableGroup.add(top);

    // pé
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3.5, 15, 16),
      normal.metal,
    );

    leg.position.y = 7.5;

    leg.castShadow = true;

    tableGroup.add(leg);

    // base
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 2, 24),
      normal.metal,
    );

    base.position.y = 1;

    base.castShadow = true;

    tableGroup.add(base);

    // --------------------------------------------------------
    // CADEIRAS
    // --------------------------------------------------------

    function chair(angle) {
      const chairGroup = new THREE.Group();

      const seat = new THREE.Mesh(
        new THREE.BoxGeometry(8, 2, 8),
        getMaterial(normal.chair),
      );

      seat.position.y = 8;

      chairGroup.add(seat);

      const back = new THREE.Mesh(
        new THREE.BoxGeometry(8, 10, 2),
        getMaterial(normal.chair),
      );

      back.position.set(0, 13, -3);

      chairGroup.add(back);

      const leg1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 8, 1.5),
        normal.metal,
      );

      leg1.position.set(-2.5, 4, 0);

      chairGroup.add(leg1);

      const leg2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 8, 1.5),
        normal.metal,
      );

      leg2.position.set(2.5, 4, 0);

      chairGroup.add(leg2);

      const distance = 22;

      chairGroup.position.set(
        Math.sin(angle) * distance,
        0,
        Math.cos(angle) * distance,
      );

      chairGroup.rotation.y = angle + Math.PI;

      tableGroup.add(chairGroup);
    }

    chair(0);
    chair(Math.PI / 2);
    chair(Math.PI);
    chair((Math.PI * 3) / 2);

    tableGroup.position.set(x, 0, z);

    return tableGroup;
  }

  // ==========================================================
  // ORGANIZAÇÃO DAS MESAS
  // ==========================================================

  const tables = [
    [-65, 5],
    [-20, 5],
    [25, 5],
    [70, 5],

    [-65, 55],
    [-20, 55],
    [25, 55],
    [70, 55],
  ];

  tables.forEach(([x, z]) => {
    group.add(createTable(x, z));
  });

  // ==========================================================
  // LUMINÁRIAS
  // ==========================================================

  function createLamp(x, z) {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 2, 24),
      normal.metal,
    );

    lamp.position.set(x, 61, z);

    group.add(lamp);

    const light = new THREE.PointLight(0xfff3cf, 1.8, 100, 2);

    light.position.set(x, 57, z);

    group.add(light);
  }

  createLamp(-60, 30);
  createLamp(0, 30);
  createLamp(60, 30);

  // ==========================================================
  // DESTAQUE QUANDO É ORIGEM/DESTINO
  // ==========================================================

  if (isStart || isEnd) {
    const glowColor = isStart ? COLORS.nodeStart : COLORS.nodeEnd;

    // --------------------------------------------------------
    // Base luminosa
    // --------------------------------------------------------

    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(WIDTH + 18, 2, DEPTH + 18),
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.25,
      }),
    );

    glow.position.y = 5;

    group.add(glow);

    // --------------------------------------------------------
    // Luz externa
    // --------------------------------------------------------

    const pointLight = new THREE.PointLight(glowColor, 5, 300, 2);

    pointLight.position.set(0, 45, 0);

    group.add(pointLight);
  }

  // ==========================================================
  // POSIÇÃO DO RU
  // ==========================================================

  group.position.set(vertex.x - WIDTH / 2, 0, vertex.y);

  // ==========================================================
  // SOMBRAS
  // ==========================================================

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  // ==========================================================
  // ADICIONA À CENA
  // ==========================================================

  scene.add(group);
}
// ============================================================
// CANTINA
// ============================================================

function createCantina(scene, vertex, isStart, isEnd, materials) {
  const group = new THREE.Group();

  // ==========================================================
  // DESTAQUE DA CANTINA
  // ==========================================================

  let endpointMaterial = null;

  if (isStart) {
    endpointMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.1,
    });
  } else if (isEnd) {
    endpointMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.45,
      roughness: 0.4,
      metalness: 0.1,
    });
  }

  // ==========================================================
  // MATERIAIS NORMAIS
  // ==========================================================

  const cantinaMaterials = {
    // --------------------------------------------------------
    // Piso
    // --------------------------------------------------------

    floor: new THREE.MeshStandardMaterial({
      color: 0xbfc3c7,
      roughness: 0.85,
      metalness: 0.05,
    }),

    // --------------------------------------------------------
    // Borda do piso
    // --------------------------------------------------------

    floorBorder: new THREE.MeshStandardMaterial({
      color: 0x8f9499,
      roughness: 0.8,
      metalness: 0.1,
    }),

    // --------------------------------------------------------
    // Balcão
    // --------------------------------------------------------

    counter: new THREE.MeshStandardMaterial({
      color: 0x4a4f54,
      roughness: 0.7,
      metalness: 0.15,
    }),

    // --------------------------------------------------------
    // Plástico branco
    // --------------------------------------------------------

    plasticWhite: new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.55,
      metalness: 0,
    }),

    // --------------------------------------------------------
    // Branco escuro
    // --------------------------------------------------------

    plasticWhiteDark: new THREE.MeshStandardMaterial({
      color: 0xdfe2e5,
      roughness: 0.65,
      metalness: 0,
    }),

    // --------------------------------------------------------
    // Metal
    // --------------------------------------------------------

    metal: new THREE.MeshStandardMaterial({
      color: 0x70757a,
      roughness: 0.45,
      metalness: 0.65,
    }),

    // --------------------------------------------------------
    // Tampo do balcão
    // --------------------------------------------------------

    counterTop: new THREE.MeshStandardMaterial({
      color: 0x70757a,
      roughness: 0.45,
      metalness: 0.35,
    }),
  };

  // ==========================================================
  // FUNÇÃO PARA ESCOLHER O MATERIAL
  // ==========================================================

  /**
   * Se a cantina for origem ou destino,
   * todos os elementos recebem a mesma cor.
   *
   * Caso contrário, mantém a aparência normal.
   */
  const getMaterial = (normalMaterial) => {
    return endpointMaterial || normalMaterial;
  };

  // ==========================================================
  // PISO
  // ==========================================================

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(120, 4, 80),
    getMaterial(cantinaMaterials.floor),
  );

  floor.position.y = 2;
  floor.position.z = 2;

  floor.receiveShadow = true;
  floor.castShadow = true;

  group.add(floor);

  // ==========================================================
  // BORDA DO PISO
  // ==========================================================

  const floorBorder = new THREE.Mesh(
    new THREE.BoxGeometry(124, 2, 84),
    getMaterial(cantinaMaterials.floorBorder),
  );

  floorBorder.position.y = 0;

  floorBorder.receiveShadow = true;
  floorBorder.castShadow = true;

  group.add(floorBorder);

  // ==========================================================
  // BALCÃO
  // ==========================================================

  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(100, 18, 12),
    getMaterial(cantinaMaterials.counter),
  );

  counter.position.set(0, 11, -25);

  counter.castShadow = true;
  counter.receiveShadow = true;

  group.add(counter);

  // ==========================================================
  // TAMPO DO BALCÃO
  // ==========================================================

  const counterTop = new THREE.Mesh(
    new THREE.BoxGeometry(104, 3, 15),
    getMaterial(cantinaMaterials.counterTop),
  );

  counterTop.position.set(0, 21.5, -25);

  counterTop.castShadow = true;
  counterTop.receiveShadow = true;

  group.add(counterTop);

  // ==========================================================
  // CADEIRA
  // ==========================================================

  function createChair(x, z) {
    const chair = new THREE.Group();

    // --------------------------------------------------------
    // Assento
    // --------------------------------------------------------

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(8, 2.5, 8),
      getMaterial(cantinaMaterials.plasticWhite),
    );

    seat.position.y = 8;

    seat.castShadow = true;
    seat.receiveShadow = true;

    chair.add(seat);

    // --------------------------------------------------------
    // Encosto
    // --------------------------------------------------------

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(8, 8, 2),
      getMaterial(cantinaMaterials.plasticWhite),
    );

    back.position.set(0, 13, -3);

    back.castShadow = true;
    back.receiveShadow = true;

    chair.add(back);

    // --------------------------------------------------------
    // Perna esquerda
    // --------------------------------------------------------

    const legLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 8, 1.5),
      getMaterial(cantinaMaterials.metal),
    );

    legLeft.position.set(-2.5, 4, 0);

    legLeft.castShadow = true;
    legLeft.receiveShadow = true;

    chair.add(legLeft);

    // --------------------------------------------------------
    // Perna direita
    // --------------------------------------------------------

    const legRight = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 8, 1.5),
      getMaterial(cantinaMaterials.metal),
    );

    legRight.position.set(2.5, 4, 0);

    legRight.castShadow = true;
    legRight.receiveShadow = true;

    chair.add(legRight);

    // --------------------------------------------------------
    // Posição
    // --------------------------------------------------------

    chair.position.set(x, 0, z);

    return chair;
  }

  // ==========================================================
  // MESA
  // ==========================================================

  function createTable(x, z) {
    const table = new THREE.Group();

    // --------------------------------------------------------
    // TAMPO
    // --------------------------------------------------------

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2.5, 18),
      getMaterial(cantinaMaterials.plasticWhite),
    );

    top.position.y = 12;

    top.castShadow = true;
    top.receiveShadow = true;

    table.add(top);

    // --------------------------------------------------------
    // PARTE INFERIOR DO TAMPO
    // --------------------------------------------------------

    const underside = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 16),
      getMaterial(cantinaMaterials.plasticWhiteDark),
    );

    underside.position.y = 10.5;

    underside.castShadow = true;
    underside.receiveShadow = true;

    table.add(underside);

    // --------------------------------------------------------
    // PERNA CENTRAL
    // --------------------------------------------------------

    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(3, 12, 3),
      getMaterial(cantinaMaterials.metal),
    );

    leg.position.y = 6;

    leg.castShadow = true;
    leg.receiveShadow = true;

    table.add(leg);

    // --------------------------------------------------------
    // BASE
    // --------------------------------------------------------

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.5, 12),
      getMaterial(cantinaMaterials.metal),
    );

    base.position.y = 0.75;

    base.castShadow = true;
    base.receiveShadow = true;

    table.add(base);

    // --------------------------------------------------------
    // CADEIRAS
    // --------------------------------------------------------

    const chairs = [
      [0, -13],
      [0, 13],
      [-13, 0],
      [13, 0],
    ];

    chairs.forEach(([cx, cz]) => {
      table.add(createChair(cx, cz));
    });

    // --------------------------------------------------------
    // Posição
    // --------------------------------------------------------

    table.position.set(x, 0, z);

    return table;
  }

  // ==========================================================
  // DUAS MESAS
  // ==========================================================

  const tables = [
    [-30, 10],
    [30, 10],
  ];

  tables.forEach(([x, z]) => {
    group.add(createTable(x, z));
  });

  // ==========================================================
  // ILUMINAÇÃO DA CANTINA
  // ==========================================================

  if (isStart || isEnd) {
    const glowColor = isStart ? COLORS.nodeStart : COLORS.nodeEnd;

    // --------------------------------------------------------
    // Luz interna
    // --------------------------------------------------------

    const glow = new THREE.PointLight(glowColor, 3.5, 180, 2);

    glow.position.set(0, 45, 0);

    group.add(glow);

    // --------------------------------------------------------
    // Luz adicional no centro
    // --------------------------------------------------------

    const centerGlow = new THREE.PointLight(glowColor, 2, 100, 2);

    centerGlow.position.set(0, 15, 0);

    group.add(centerGlow);
  }

  // ==========================================================
  // POSIÇÃO DA CANTINA
  // ==========================================================

  group.position.set(vertex.x - 50, 0, vertex.y);

  group.rotation.y = Math.PI / 2;

  // ==========================================================
  // SOMBRAS
  // ==========================================================

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  // ==========================================================
  // ADICIONA À CENA
  // ==========================================================

  scene.add(group);
}

// ============================================================
// ILUMINAÇÃO
// ============================================================

function setupLights(scene) {
  // ----------------------------------------------------------
  // Luz ambiente
  // ----------------------------------------------------------

  const ambient = new THREE.HemisphereLight(0xffffff, 0x18202b, 1.4);

  scene.add(ambient);

  // ----------------------------------------------------------
  // Luz principal
  // ----------------------------------------------------------

  const directional = new THREE.DirectionalLight(0xffffff, 2);

  directional.position.set(300, 600, 400);

  directional.castShadow = true;

  directional.shadow.mapSize.set(2048, 2048);

  directional.shadow.camera.near = 1;
  directional.shadow.camera.far = 2500;

  directional.shadow.camera.left = -1000;
  directional.shadow.camera.right = 1000;

  directional.shadow.camera.top = 1000;
  directional.shadow.camera.bottom = -1000;

  directional.shadow.bias = -0.0001;

  scene.add(directional);

  // ----------------------------------------------------------
  // Luz de preenchimento
  // ----------------------------------------------------------

  const fill = new THREE.PointLight(0x4a90d9, 1.2, 1500);

  fill.position.set(300, 300, 300);

  scene.add(fill);
}

// ============================================================
// CHÃO
// ============================================================

function createFloor(scene, materials) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(CONFIG.floor.size, CONFIG.floor.size),
    materials.floor,
  );

  floor.rotation.x = -Math.PI / 2;

  floor.position.set(...CONFIG.floor.position);

  floor.receiveShadow = true;

  scene.add(floor);
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function FloorMap3D({ graph, rota = [], showLabels = true }) {
  const mountRef = useRef(null);

  // ==========================================================
  // DADOS DERIVADOS
  // ==========================================================

  /**
   * Mapa dos vértices.
   */
  const vertexMap = useMemo(
    () => buildVertexMap(graph?.vertices ?? []),
    [graph?.vertices],
  );

  /**
   * Conexões pertencentes ao caminho.
   *
   * Exemplo:
   *
   * A → B → C
   *
   * gera:
   *
   * A-B
   * B-A
   * B-C
   * C-B
   */
  const routeSet = useMemo(() => buildRouteSet(rota), [rota]);

  /**
   * Vértices que aparecem na rota.
   *
   * Isso continua sendo utilizado
   * para os nós comuns.
   *
   * NÃO será usado para decidir
   * se escadas/portas ficam vermelhas.
   */
  const routeVertices = useMemo(() => new Set(rota), [rota]);

  // ==========================================================
  // THREE.JS
  // ==========================================================

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    // --------------------------------------------------------
    // Validação do grafo
    // --------------------------------------------------------

    if (
      !graph ||
      !Array.isArray(graph.vertices) ||
      !Array.isArray(graph.arestas)
    ) {
      console.warn("FloorMap3D: grafo inválido.");

      return;
    }

    // --------------------------------------------------------
    // Dimensões
    // --------------------------------------------------------

    const width = Math.max(mount.clientWidth, 1);

    const height = Math.max(mount.clientHeight, 1);

    // ========================================================
    // RENDERER
    // ========================================================

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, CONFIG.renderer.maxPixelRatio),
    );

    renderer.setSize(width, height);

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    renderer.toneMappingExposure = 1.15;

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // ========================================================
    // CENA
    // ========================================================

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(COLORS.background);

    scene.fog = new THREE.Fog(COLORS.background, 1800, 3500);

    // ========================================================
    // CÂMERA
    // ========================================================

    const camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      width / height,
      CONFIG.camera.near,
      CONFIG.camera.far,
    );

    camera.position.set(...CONFIG.camera.position);

    // ========================================================
    // CONTROLES
    // ========================================================

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.target.set(500, 0, 500);

    controls.enableDamping = true;

    controls.dampingFactor = CONFIG.controls.dampingFactor;

    controls.minDistance = CONFIG.controls.minDistance;

    controls.maxDistance = CONFIG.controls.maxDistance;

    controls.maxPolarAngle = CONFIG.controls.maxPolarAngle;

    controls.screenSpacePanning = false;

    controls.zoomSpeed = CONFIG.controls.zoomSpeed;

    controls.rotateSpeed = CONFIG.controls.rotateSpeed;

    controls.panSpeed = CONFIG.controls.panSpeed;

    const posicionarCameraSuavemente = () => {
      if (!rota || rota.length < 2) return;

      const origem = vertexMap.get(rota[0]);
      const destino = vertexMap.get(rota[rota.length - 1]);
      const proximo = vertexMap.get(rota[1]);

      if (!origem || !destino || !proximo) return;

      const origemPos = toVec3(origem.x, origem.y);
      const proximoPos = toVec3(proximo.x, proximo.y);
      const destinoPos = toVec3(destino.x, destino.y);

      // Direção inicial da rota
      const direcao = new THREE.Vector3()
        .subVectors(proximoPos, origemPos)
        .normalize();

      // ==========================================
      // CÂMERA COMEÇA ATRÁS DA ORIGEM
      // ==========================================

      const distanciaAtras = 180;

      const destinoCamera = origemPos
        .clone()
        .sub(direcao.clone().multiplyScalar(distanciaAtras));

      destinoCamera.y = 180;

      // ==========================================
      // CENTRO DA CÂMERA = DESTINO
      // ==========================================

      const destinoTarget = destinoPos.clone();

      destinoTarget.y = 25;

      // ==========================================
      // ESTADO ATUAL
      // ==========================================

      const inicioCamera = camera.position.clone();
      const inicioTarget = controls.target.clone();

      // ==========================================
      // ANIMAÇÃO
      // ==========================================

      const duracao = 1600;
      const inicio = performance.now();

      const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      let cameraAnimationFrame;

      const animarCamera = (agora) => {
        const progresso = Math.min((agora - inicio) / duracao, 1);

        const suavizado = easeInOutCubic(progresso);

        camera.position.lerpVectors(inicioCamera, destinoCamera, suavizado);

        controls.target.lerpVectors(inicioTarget, destinoTarget, suavizado);

        controls.update();

        if (progresso < 1) {
          cameraAnimationFrame = requestAnimationFrame(animarCamera);
        }
      };

      cameraAnimationFrame = requestAnimationFrame(animarCamera);

      return () => {
        cancelAnimationFrame(cameraAnimationFrame);
      };
    };

    // ========================================================
    // MATERIAIS
    // ========================================================

    const materials = createMaterials();

    // ========================================================
    // LUZES
    // ========================================================

    setupLights(scene);

    // ========================================================
    // CHÃO
    // ========================================================

    createFloor(scene, materials);

    // ========================================================
    // ARESTAS
    // ========================================================

    graph.arestas.forEach((edge) => {
      const origem = vertexMap.get(edge.origem);

      const destino = vertexMap.get(edge.destino);

      // Aresta inválida
      if (!origem || !destino) {
        return;
      }

      const isOnRoute = routeSet.has(`${edge.origem}-${edge.destino}`);

      createEdge(
        scene,

        toVec3(origem.x, origem.y),

        toVec3(destino.x, destino.y),

        isOnRoute,

        materials,
      );
    });

    // ========================================================
    // VÉRTICES
    // ========================================================

    graph.vertices.forEach((vertex) => {
      // ----------------------------------------------------
      // Cruzamentos
      //
      // Não possuem representação visual.
      // ----------------------------------------------------

      if (vertex.tipo === "cruzamento") {
        return;
      }

      // ----------------------------------------------------
      // ORIGEM
      // ----------------------------------------------------

      const isStart = rota.length > 0 && rota[0] === vertex.id;

      // ----------------------------------------------------
      // DESTINO
      // ----------------------------------------------------

      const isEnd = rota.length > 0 && rota[rota.length - 1] === vertex.id;

      // ----------------------------------------------------
      // VÉRTICE PERTENCE À ROTA
      //
      // Usado somente para nós comuns.
      // ----------------------------------------------------

      const isOnRoute = routeVertices.has(vertex.id);

      // ====================================================
      // CANTINA
      // ====================================================
      // ====================================================
      // RESTAURANTE UNIVERSITÁRIO
      // ====================================================

      if (vertex.tipo === "RU") {
        createRU(scene, vertex, isStart, isEnd);

        return;
      }
      if (vertex.tipo?.startsWith("cantina")) {
        createCantina(scene, vertex, isStart, isEnd, materials);

        return;
      }

      // ====================================================
      // PORTA / SALA
      // ====================================================

      if (vertex.tipo?.startsWith("sala-")) {
        /**
         * IMPORTANTE:
         *
         * Não passamos isOnRoute.
         *
         * A porta só recebe destaque
         * quando é origem ou destino.
         */

        createDoor(scene, vertex, isStart, isEnd, materials);

        return;
      }

      // ====================================================
      // ESCADA
      // ====================================================

      if (vertex.tipo === "escada") {
        /**
         * IMPORTANTE:
         *
         * A escada NÃO usa isOnRoute.
         *
         * Assim ela não fica vermelha
         * simplesmente por aparecer no
         * caminho calculado pelo Dijkstra.
         */

        createEscada(scene, vertex, isStart, isEnd, materials);

        return;
      }

      // ====================================================
      // NÓ NORMAL
      // ====================================================

      createNode(scene, vertex, isOnRoute, isStart, isEnd, materials);

      // ====================================================
      // LABEL
      // ====================================================

      if (showLabels) {
        const label = vertex.nome ?? vertex.label ?? vertex.id;

        createLabel(scene, vertex, label);
      }
    });

    // ========================================================
    // ANIMAÇÃO
    // ========================================================

    let animationFrame;

    const animate = () => {
      animationFrame = requestAnimationFrame(animate);

      controls.update();

      renderer.render(scene, camera);
    };

    if (rota.length >= 2) {
      posicionarCameraSuavemente();
    }

    animate();

    // ========================================================
    // RESIZE
    // ========================================================

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const { width: newWidth, height: newHeight } = entry.contentRect;

      if (newWidth <= 0 || newHeight <= 0) {
        return;
      }

      camera.aspect = newWidth / newHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, newHeight, false);
    });

    resizeObserver.observe(mount);

    // ========================================================
    // CLEANUP
    // ========================================================

    return () => {
      cancelAnimationFrame(animationFrame);

      resizeObserver.disconnect();

      controls.dispose();

      disposeScene(scene);

      // Os materiais são compartilhados
      // entre diversos objetos.
      Object.values(materials).forEach((material) => {
        material?.dispose?.();
      });

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [graph, rota, routeSet, routeVertices, showLabels, vertexMap]);

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",

        inset: 0,

        width: "100vw",
        height: "100vh",

        overflow: "hidden",

        zIndex: 1,

        cursor: "grab",

        touchAction: "none",

        background: "#0d0d1a",
      }}
      onPointerDown={(event) => {
        event.currentTarget.style.cursor = "grabbing";
      }}
      onPointerUp={(event) => {
        event.currentTarget.style.cursor = "grab";
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.cursor = "grab";
      }}
    />
  );
}
