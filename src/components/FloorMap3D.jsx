import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// ============================================================
// PALETA DE CORES
// ============================================================

const COLORS = {
  background: 0x0d0d1a,

  floor: 0x1b4332,

  edge: 0x46515f,
  edgeRoute: 0xff4757,

  node: 0x4a90d9,
  nodeRoute: 0xff6b81,
  nodeStart: 0x2ecc71,
  nodeEnd: 0xe74c3c,

  stairs: 0xdfe6e9,
  door: 0xffffff,

  metal: 0xc0c0c0,

  ruWall: 0xd9dde1,
  ruWallDark: 0xb8bec5,
  ruRoof: 0x3d4650,
  ruRoofDark: 0x29313a,
  ruGlass: 0x9ed8ff,
  ruDoor: 0x303840,
  ruSign: 0xf4f4f4,
  ruSignText: 0x1d3557,
  ruFloor: 0xc8cdd2,
  ruTable: 0xffffff,
  ruChair: 0x555b61,
  ruCounter: 0x626970,

  cantinaFloor: 0xbfc3c7,
  cantinaFloorBorder: 0x8f9499,
  cantinaCounter: 0x4a4f54,
  cantinaCounterTop: 0x70757a,
  cantinaPlasticWhite: 0xf5f5f5,
  cantinaPlasticWhiteDark: 0xdfe2e5,
  cantinaMetal: 0x70757a,
};

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const CONFIG = {
  camera: {
    fov: 75,
    near: 1,
    far: 3000,
    position: [735, 100, 1200],
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
    size: 8000,
    position: [735, 0, 600],
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

const BASE_GEOMETRIES = {
  unitBox: new THREE.BoxGeometry(1, 1, 1),
  nodeCylinder: new THREE.CylinderGeometry(1, 1.3, 1, 16),
  nodeSphere: new THREE.SphereGeometry(1, 20, 20),
  nodeRing: new THREE.TorusGeometry(1, 0.09, 8, 32),
};

const SHARED_GEOMETRIES = new Set(Object.values(BASE_GEOMETRIES));

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function toVec3(x = 0, y = 0, height = 0) {
  return new THREE.Vector3(x, height, y);
}

function buildVertexMap(vertices = []) {
  return new Map(vertices.map((vertex) => [vertex.id, vertex]));
}

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

function disposeMaterial(material, sharedSet) {
  if (!material) return;

  if (Array.isArray(material)) {
    material.forEach((m) => disposeMaterial(m, sharedSet));
    return;
  }

  if (sharedSet?.has(material)) return;

  material.map?.dispose();
  material.alphaMap?.dispose();
  material.aoMap?.dispose();
  material.bumpMap?.dispose();
  material.normalMap?.dispose();
  material.roughnessMap?.dispose();
  material.metalnessMap?.dispose();

  material.dispose();
}

function disposeScene(scene, sharedMaterials) {
  scene.traverse((object) => {
    if (object.geometry && !SHARED_GEOMETRIES.has(object.geometry)) {
      object.geometry.dispose();
    }

    if (object.material) {
      disposeMaterial(object.material, sharedMaterials);
    }
  });
}

function createMaterials() {
  return {
    edge: new THREE.MeshStandardMaterial({
      color: COLORS.edge,
      roughness: 0.85,
      metalness: 0.05,
    }),

    edgeRoute: new THREE.MeshStandardMaterial({
      color: COLORS.edgeRoute,
      emissive: COLORS.edgeRoute,
      emissiveIntensity: 0.35,
      roughness: 0.7,
      metalness: 0.05,
    }),

    node: new THREE.MeshStandardMaterial({
      color: COLORS.node,
      emissive: COLORS.node,
      emissiveIntensity: 0.08,
      roughness: 0.35,
      metalness: 0.35,
    }),

    nodeRoute: new THREE.MeshStandardMaterial({
      color: COLORS.nodeRoute,
      emissive: COLORS.nodeRoute,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.3,
    }),

    nodeStart: new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.3,
    }),

    nodeEnd: new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.3,
    }),

    floor: new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 1,
      metalness: 0,
    }),

    stairs: new THREE.MeshStandardMaterial({
      color: COLORS.stairs,
      roughness: 0.4,
      metalness: 0.35,
    }),

    door: new THREE.MeshStandardMaterial({
      color: COLORS.door,
      roughness: 0.6,
      metalness: 0.1,
    }),

    endpointStart: new THREE.MeshStandardMaterial({
      color: COLORS.nodeStart,
      emissive: COLORS.nodeStart,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.25,
    }),

    endpointEnd: new THREE.MeshStandardMaterial({
      color: COLORS.nodeEnd,
      emissive: COLORS.nodeEnd,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.25,
    }),

    handle: new THREE.MeshStandardMaterial({
      color: COLORS.metal,
      roughness: 0.15,
      metalness: 1,
    }),
  };
}

let ruMaterialsCache = null;

function getRUMaterials() {
  if (ruMaterialsCache) return ruMaterialsCache;

  ruMaterialsCache = {
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
    glass: new THREE.MeshPhysicalMaterial({
      color: COLORS.ruGlass,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.05,
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
    sign: new THREE.MeshStandardMaterial({
      color: COLORS.ruSign,
      roughness: 0.5,
    }),
  };

  return ruMaterialsCache;
}

let cantinaMaterialsCache = null;

function getCantinaMaterials() {
  if (cantinaMaterialsCache) return cantinaMaterialsCache;

  cantinaMaterialsCache = {
    floor: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaFloor,
      roughness: 0.85,
      metalness: 0.05,
    }),
    floorBorder: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaFloorBorder,
      roughness: 0.8,
      metalness: 0.1,
    }),
    counter: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaCounter,
      roughness: 0.7,
      metalness: 0.15,
    }),
    counterTop: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaCounterTop,
      roughness: 0.45,
      metalness: 0.35,
    }),
    plasticWhite: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaPlasticWhite,
      roughness: 0.55,
    }),
    plasticWhiteDark: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaPlasticWhiteDark,
      roughness: 0.65,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: COLORS.cantinaMetal,
      roughness: 0.45,
      metalness: 0.65,
    }),
  };

  return cantinaMaterialsCache;
}

const SHARED_MATERIALS = new Set();

function registerSharedMaterials() {
  Object.values(getRUMaterials()).forEach((m) => SHARED_MATERIALS.add(m));
  Object.values(getCantinaMaterials()).forEach((m) => SHARED_MATERIALS.add(m));
}

registerSharedMaterials();

function buildChairInstances({
  tables,
  distance = 22,
  angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  seat,
  back,
  legs,
}) {
  const seatGeom = new THREE.BoxGeometry(...seat.size);
  const backGeom = new THREE.BoxGeometry(...back.size);
  const legGeom = new THREE.BoxGeometry(...legs.size);

  const chairCount = tables.length * angles.length;

  const seatMesh = new THREE.InstancedMesh(seatGeom, seat.material, chairCount);
  const backMesh = new THREE.InstancedMesh(backGeom, back.material, chairCount);
  const legMesh = new THREE.InstancedMesh(
    legGeom,
    legs.material,
    chairCount * 2,
  );

  [seatMesh, backMesh, legMesh].forEach((m) => {
    m.castShadow = true;
    m.receiveShadow = true;
  });

  const dummy = new THREE.Object3D();
  const rotationEuler = new THREE.Euler();
  let seatIdx = 0;
  let legIdx = 0;

  tables.forEach(({ x, z }) => {
    angles.forEach((angle) => {
      const rotY = angle + Math.PI;

      rotationEuler.set(0, rotY, 0);

      const chairX = x + Math.sin(angle) * distance;
      const chairZ = z + Math.cos(angle) * distance;

      dummy.position.set(chairX, seat.offsetY, chairZ);
      dummy.rotation.copy(rotationEuler);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      seatMesh.setMatrixAt(seatIdx, dummy.matrix);

      const backLocal = new THREE.Vector3(...back.offset).applyEuler(
        rotationEuler,
      );
      dummy.position.set(
        chairX + backLocal.x,
        back.offset[1],
        chairZ + backLocal.z,
      );
      dummy.rotation.copy(rotationEuler);
      dummy.updateMatrix();
      backMesh.setMatrixAt(seatIdx, dummy.matrix);

      [-1, 1].forEach((sign) => {
        const legLocal = new THREE.Vector3(
          sign * legs.offsetX,
          0,
          0,
        ).applyEuler(rotationEuler);

        dummy.position.set(
          chairX + legLocal.x,
          legs.offsetY,
          chairZ + legLocal.z,
        );
        dummy.rotation.copy(rotationEuler);
        dummy.updateMatrix();
        legMesh.setMatrixAt(legIdx, dummy.matrix);

        legIdx++;
      });

      seatIdx++;
    });
  });

  seatMesh.instanceMatrix.needsUpdate = true;
  backMesh.instanceMatrix.needsUpdate = true;
  legMesh.instanceMatrix.needsUpdate = true;

  return {
    seatMesh,
    backMesh,
    legMesh,
    seatNormalMaterial: seat.material,
    backNormalMaterial: back.material,
    legNormalMaterial: legs.material,
    legsHighlightable: !!legs.highlightable,
  };
}

function createEdge(scene, p1, p2, materials) {
  const direction = new THREE.Vector3().subVectors(p2, p1);
  const horizontalLength = Math.sqrt(direction.x ** 2 + direction.z ** 2);

  if (horizontalLength <= 0) return null;

  const length = horizontalLength + CONFIG.edge.extraLength;
  const angle = Math.atan2(direction.z, direction.x);

  const mesh = new THREE.Mesh(BASE_GEOMETRIES.unitBox, materials.edge);

  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.rotation.y = -angle;

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  scene.add(mesh);

  const update = (isOnRoute) => {
    const width = isOnRoute ? CONFIG.edge.routeWidth : CONFIG.edge.normalWidth;
    const height = isOnRoute
      ? CONFIG.edge.routeHeight
      : CONFIG.edge.normalHeight;

    mesh.scale.set(length, height, width);
    mesh.position.y = height / 2;
    mesh.material = isOnRoute ? materials.edgeRoute : materials.edge;
  };

  update(false);

  return update;
}

function createNode(scene, vertex, materials) {
  const cylinder = new THREE.Mesh(BASE_GEOMETRIES.nodeCylinder, materials.node);
  const sphere = new THREE.Mesh(BASE_GEOMETRIES.nodeSphere, materials.node);
  const ring = new THREE.Mesh(
    BASE_GEOMETRIES.nodeRing,
    new THREE.MeshBasicMaterial({
      color: COLORS.nodeRoute,
      transparent: true,
      opacity: 0.8,
    }),
  );

  cylinder.position.x = vertex.x;
  cylinder.position.z = vertex.y;
  sphere.position.x = vertex.x;
  sphere.position.z = vertex.y;
  ring.position.x = vertex.x;
  ring.position.z = vertex.y;
  ring.rotation.x = Math.PI / 2;
  ring.visible = false;

  cylinder.castShadow = true;
  cylinder.receiveShadow = true;
  sphere.castShadow = true;

  scene.add(cylinder, sphere, ring);

  const update = ({ isOnRoute, isStart, isEnd }) => {
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

    let material = materials.node;
    if (isStart) material = materials.nodeStart;
    else if (isEnd) material = materials.nodeEnd;
    else if (isOnRoute) material = materials.nodeRoute;

    cylinder.scale.set(radius, height, radius);
    cylinder.position.y = height / 2;
    cylinder.material = material;

    const sphereRadius = radius * 1.2;
    sphere.scale.setScalar(sphereRadius);
    sphere.position.y = height + radius * 0.8;
    sphere.material = material;

    const showRing = isOnRoute || isStart || isEnd;
    ring.visible = showRing;

    if (showRing) {
      let ringColor = COLORS.nodeRoute;
      if (isStart) ringColor = COLORS.nodeStart;
      else if (isEnd) ringColor = COLORS.nodeEnd;

      ring.material.color.setHex(ringColor);
      ring.scale.setScalar(radius * 2.1);
      ring.position.y = height + radius * 0.8;
    }
  };

  update({ isOnRoute: false, isStart: false, isEnd: false });

  return update;
}

function createLabel(scene, vertex, text) {
  if (!text) return;

  const label = String(text);

  // ============================================================
  // CONFIGURAÇÃO
  // ============================================================

  const FONT_SIZE = 16;
  const PADDING_X = 8;
  const PADDING_Y = 8;
  const MAX_WIDTH = 180;

  // ============================================================
  // CANVAS
  // ============================================================

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.font = `600 ${FONT_SIZE}px Arial`;

  // ============================================================
  // QUEBRA DE LINHA
  // ============================================================

  const words = label.split(" ");
  const lines = [];

  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (ctx.measureText(testLine).width > MAX_WIDTH && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  // ============================================================
  // TAMANHO DO LABEL
  // ============================================================

  const textWidth = Math.min(
    MAX_WIDTH,
    Math.max(...lines.map((line) => ctx.measureText(line).width)),
  );

  const lineHeight = FONT_SIZE + 6;

  canvas.width = Math.ceil(textWidth + PADDING_X * 2);
  canvas.height = Math.ceil(lines.length * lineHeight + PADDING_Y * 2);

  // Reaplica fonte após alterar o tamanho do canvas
  ctx.font = `600 ${FONT_SIZE}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ============================================================
  // FUNDO
  // ============================================================

  ctx.fillStyle = "rgba(10, 12, 20, 0.78)";

  const radius = 10;

  ctx.beginPath();

  if (ctx.roundRect) {
    ctx.roundRect(2, 2, canvas.width - 4, canvas.height - 4, radius);
  } else {
    ctx.fillRect(2, 2, canvas.width - 4, canvas.height - 4);
  }

  ctx.fill();

  // ============================================================
  // TEXTO
  // ============================================================

  ctx.fillStyle = "#ffffff";

  const centerX = canvas.width / 2;

  lines.forEach((line, index) => {
    const y = PADDING_Y + lineHeight * index + lineHeight / 2;

    ctx.fillText(line, centerX, y);
  });

  // ============================================================
  // TEXTURA
  // ============================================================

  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  // ============================================================
  // MATERIAL
  // ============================================================

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });

  // ============================================================
  // SPRITE
  // ============================================================

  const sprite = new THREE.Sprite(material);

  sprite.position.set(vertex.x, 35, vertex.y);

  // Mantém uma escala visual pequena
  const scale = 0.1;

  sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);

  scene.add(sprite);
}

function createEscada(scene, vertex, materials) {
  const group = new THREE.Group();
  const steps = [];

  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(22, 4, 25),
      materials.stairs,
    );
    step.position.set(-i * 7, 2 + i * 4, 0);
    step.castShadow = true;
    step.receiveShadow = true;
    group.add(step);
    steps.push(step);
  }

  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 18, 1.5, 32),
    new THREE.MeshBasicMaterial({
      color: COLORS.nodeStart,
      transparent: true,
      opacity: 0.3,
    }),
  );
  glow.position.y = 1;
  glow.visible = false;
  group.add(glow);

  group.position.set(vertex.x - 20, 0, vertex.y);

  if (vertex.unidade === "B") {
    group.rotation.y = Math.PI;
    group.position.set(vertex.x + 20, 0, vertex.y);
  }

  scene.add(group);

  const update = ({ isStart, isEnd }) => {
    const material = isStart
      ? materials.endpointStart
      : isEnd
        ? materials.endpointEnd
        : materials.stairs;

    steps.forEach((step) => {
      step.material = material;
    });

    glow.visible = isStart || isEnd;

    if (glow.visible) {
      glow.material.color.setHex(isStart ? COLORS.nodeStart : COLORS.nodeEnd);
    }
  };

  update({ isStart: false, isEnd: false });

  return update;
}

// ============================================================
// PORTA
// ============================================================

function createDoor(scene, vertex, materials) {
  const group = new THREE.Group();

  const door = new THREE.Mesh(new THREE.BoxGeometry(15, 28, 4), materials.door);
  door.position.y = 15;
  door.position.z = 2;
  door.castShadow = true;
  door.receiveShadow = true;
  group.add(door);

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    materials.handle,
  );
  handle.position.set(5, 15, 5);
  handle.castShadow = true;
  group.add(handle);

  group.position.set(vertex.x, 0, vertex.y);

  const offsets = {
    "sala-direita": { rotation: -Math.PI / 2, x: 12, z: 0 },
    "sala-esquerda": { rotation: Math.PI / 2, x: -12, z: 0 },
    "sala-cima": { rotation: 0, x: 0, z: -12 },
    "sala-baixo": { rotation: Math.PI, x: 0, z: 12 },
  };

  const config = offsets[vertex.tipo];

  if (config) {
    group.rotation.y = config.rotation;
    group.position.x += config.x;
    group.position.z += config.z;
  }

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(19, 32, 2),
    new THREE.MeshBasicMaterial({
      color: COLORS.nodeStart,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    }),
  );
  glow.position.set(0, 15, -2.5);
  glow.visible = false;
  group.add(glow);

  scene.add(group);

  const update = ({ isStart, isEnd }) => {
    const material = isStart
      ? materials.endpointStart
      : isEnd
        ? materials.endpointEnd
        : materials.door;

    door.material = material;
    glow.visible = isStart || isEnd;

    if (glow.visible) {
      glow.material.color.setHex(isStart ? COLORS.nodeStart : COLORS.nodeEnd);
    }
  };

  update({ isStart: false, isEnd: false });

  return update;
}

// ============================================================
// RESTAURANTE UNIVERSITÁRIO - RU
// ============================================================

function createRU(scene, vertex, materials) {
  const ru = getRUMaterials();
  const group = new THREE.Group();

  // Peças cuja cor é sobrescrita quando o RU é origem/destino.
  const highlightables = [];
  const track = (mesh, normalMaterial) => {
    highlightables.push({ mesh, normalMaterial });
    return mesh;
  };

  const WIDTH = 220;
  const DEPTH = 150;
  const WALL_HEIGHT = 65;

  const floor = track(
    new THREE.Mesh(new THREE.BoxGeometry(WIDTH, 4, DEPTH), ru.floor),
    ru.floor,
  );
  floor.position.y = 2;
  floor.receiveShadow = true;
  floor.castShadow = true;
  group.add(floor);

  const platform = track(
    new THREE.Mesh(
      new THREE.BoxGeometry(WIDTH + 20, 3, DEPTH + 20),
      ru.wallDark,
    ),
    ru.wallDark,
  );
  platform.position.y = -1;
  platform.receiveShadow = true;
  platform.castShadow = true;
  group.add(platform);

  // Paredes (nunca mudam de cor no destaque, igual ao original)
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH, WALL_HEIGHT, 6),
    ru.wall,
  );
  backWall.position.set(0, WALL_HEIGHT / 2, -DEPTH / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(6, WALL_HEIGHT, DEPTH),
    ru.wall,
  );
  leftWall.position.set(-WIDTH / 2, WALL_HEIGHT / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(6, WALL_HEIGHT, DEPTH),
    ru.wall,
  );
  rightWall.position.set(WIDTH / 2, WALL_HEIGHT / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);

  const frontSideLeft = new THREE.Mesh(
    new THREE.BoxGeometry(65, WALL_HEIGHT, 6),
    ru.wall,
  );
  frontSideLeft.position.set(-77.5, WALL_HEIGHT / 2, DEPTH / 2);
  frontSideLeft.castShadow = true;
  frontSideLeft.receiveShadow = true;
  group.add(frontSideLeft);

  const frontSideRight = new THREE.Mesh(
    new THREE.BoxGeometry(65, WALL_HEIGHT, 6),
    ru.wall,
  );
  frontSideRight.position.set(77.5, WALL_HEIGHT / 2, DEPTH / 2);
  frontSideRight.castShadow = true;
  frontSideRight.receiveShadow = true;
  group.add(frontSideRight);

  const frontTop = new THREE.Mesh(new THREE.BoxGeometry(90, 25, 6), ru.wall);
  frontTop.position.set(0, 52.5, DEPTH / 2);
  frontTop.castShadow = true;
  frontTop.receiveShadow = true;
  group.add(frontTop);

  // Portas de entrada (vidro é destacável)
  function createEntranceDoor(x) {
    const doorGroup = new THREE.Group();

    const frame = new THREE.Mesh(new THREE.BoxGeometry(28, 48, 5), ru.metal);
    frame.position.y = 24;
    doorGroup.add(frame);

    const glassDoor = track(
      new THREE.Mesh(new THREE.BoxGeometry(20, 42, 2), ru.glass),
      ru.glass,
    );
    glassDoor.position.set(0, 22, 3);
    doorGroup.add(glassDoor);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 12, 1.5),
      ru.metal,
    );
    handle.position.set(6, 22, 5);
    doorGroup.add(handle);

    doorGroup.position.set(x, 0, DEPTH / 2 + 3);
    group.add(doorGroup);
  }

  createEntranceDoor(-18);
  createEntranceDoor(18);

  // Janelas frontais
  function createFrontWindow(x, y = 30) {
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(32, 28, 4),
      ru.metal,
    );
    windowFrame.position.set(x, y, DEPTH / 2 + 2);
    group.add(windowFrame);

    const glass = track(
      new THREE.Mesh(new THREE.BoxGeometry(26, 22, 2), ru.glass),
      ru.glass,
    );
    glass.position.set(x, y, DEPTH / 2 + 4);
    group.add(glass);
  }

  createFrontWindow(-105);
  createFrontWindow(105);

  // Janelas laterais
  function createSideWindow(z, side) {
    const glass = track(
      new THREE.Mesh(new THREE.BoxGeometry(3, 28, 30), ru.glass),
      ru.glass,
    );
    glass.position.set(side * (WIDTH / 2 + 3), 32, z);
    group.add(glass);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(5, 32, 34), ru.metal);
    frame.position.set(side * (WIDTH / 2 + 2), 32, z);
    group.add(frame);
  }

  createSideWindow(-40, -1);
  createSideWindow(5, -1);
  createSideWindow(-40, 1);
  createSideWindow(5, 1);

  // Telhado
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 14, 8, DEPTH + 14),
    ru.roof,
  );
  roof.position.y = WALL_HEIGHT + 4;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const roofBorder = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 24, 5, DEPTH + 24),
    ru.roofDark,
  );
  roofBorder.position.y = WALL_HEIGHT - 1;
  roofBorder.castShadow = true;
  roofBorder.receiveShadow = true;
  group.add(roofBorder);

  // Placa "RU"
  const sign = new THREE.Mesh(new THREE.BoxGeometry(65, 20, 3), ru.sign);
  sign.position.set(0, 42, DEPTH / 2 + 7);
  sign.castShadow = true;
  group.add(sign);

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

  // Balcão
  const counter = track(
    new THREE.Mesh(new THREE.BoxGeometry(160, 18, 15), ru.counter),
    ru.counter,
  );
  counter.position.set(0, 11, -45);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const counterTop = track(
    new THREE.Mesh(new THREE.BoxGeometry(165, 3, 20), ru.metal),
    ru.metal,
  );
  counterTop.position.set(0, 21, -45);
  counterTop.castShadow = true;
  group.add(counterTop);

  // Mesas (tampo/perna/base — mantidas como meshes individuais)
  const tablePositions = [
    { x: -65, z: 5 },
    { x: -20, z: 5 },
    { x: 25, z: 5 },
    { x: 70, z: 5 },
    { x: -65, z: 55 },
    { x: -20, z: 55 },
    { x: 25, z: 55 },
    { x: 70, z: 55 },
  ];

  tablePositions.forEach(({ x, z }) => {
    const top = track(
      new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 2.5, 32), ru.table),
      ru.table,
    );
    top.position.set(x, 15, z);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3.5, 15, 16),
      ru.metal,
    );
    leg.position.set(x, 7.5, z);
    leg.castShadow = true;
    group.add(leg);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 2, 24),
      ru.metal,
    );
    base.position.set(x, 1, z);
    base.castShadow = true;
    group.add(base);
  });

  // Cadeiras: instanciadas (32 cadeiras -> 3 draw calls)
  const chairs = buildChairInstances({
    tables: tablePositions,
    distance: 22,
    seat: { size: [8, 2, 8], offsetY: 8, material: ru.chair },
    back: { size: [8, 10, 2], offset: [0, 13, -3], material: ru.chair },
    // Pernas da cadeira usam `normal.metal` diretamente no original
    // (não participam do destaque de origem/destino).
    legs: {
      size: [1.5, 8, 1.5],
      offsetY: 4,
      offsetX: 2.5,
      material: ru.metal,
      highlightable: false,
    },
  });

  group.add(chairs.seatMesh, chairs.backMesh, chairs.legMesh);

  // Luminárias
  function createLamp(x, z) {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 2, 24),
      ru.metal,
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

  // Destaque de origem/destino (glow + luz), criados uma vez e
  // ligados/desligados via `visible`/`intensity` em vez de recriados.
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(WIDTH + 18, 2, DEPTH + 18),
    new THREE.MeshBasicMaterial({
      color: COLORS.nodeStart,
      transparent: true,
      opacity: 0.25,
    }),
  );
  glow.position.y = 5;
  glow.visible = false;
  group.add(glow);

  const endpointLight = new THREE.PointLight(COLORS.nodeStart, 0, 300, 2);
  endpointLight.position.set(0, 45, 0);
  group.add(endpointLight);

  group.position.set(vertex.x - WIDTH / 2, 0, vertex.y);

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  scene.add(group);

  const update = ({ isStart, isEnd }) => {
    const overrideMaterial = isStart
      ? new THREE.MeshStandardMaterial({
          color: COLORS.nodeStart,
          emissive: COLORS.nodeStart,
          emissiveIntensity: 0.45,
          roughness: 0.45,
        })
      : isEnd
        ? new THREE.MeshStandardMaterial({
            color: COLORS.nodeEnd,
            emissive: COLORS.nodeEnd,
            emissiveIntensity: 0.45,
            roughness: 0.45,
          })
        : null;

    highlightables.forEach(({ mesh, normalMaterial }) => {
      mesh.material = overrideMaterial || normalMaterial;
    });

    chairs.seatMesh.material = overrideMaterial || chairs.seatNormalMaterial;
    chairs.backMesh.material = overrideMaterial || chairs.backNormalMaterial;
    if (chairs.legsHighlightable) {
      chairs.legMesh.material = overrideMaterial || chairs.legNormalMaterial;
    }

    glow.visible = isStart || isEnd;
    if (glow.visible)
      glow.material.color.setHex(isStart ? COLORS.nodeStart : COLORS.nodeEnd);

    endpointLight.intensity = isStart || isEnd ? 5 : 0;
    endpointLight.color.setHex(isStart ? COLORS.nodeStart : COLORS.nodeEnd);
  };

  update({ isStart: false, isEnd: false });

  return update;
}

// ============================================================
// CANTINA
// ============================================================

function createCantina(scene, vertex, materials) {
  const c = getCantinaMaterials();
  const group = new THREE.Group();

  const highlightables = [];
  const track = (mesh, normalMaterial) => {
    highlightables.push({ mesh, normalMaterial });
    return mesh;
  };

  const floor = track(
    new THREE.Mesh(new THREE.BoxGeometry(120, 4, 80), c.floor),
    c.floor,
  );
  floor.position.set(0, 2, 2);
  floor.receiveShadow = true;
  floor.castShadow = true;
  group.add(floor);

  const floorBorder = track(
    new THREE.Mesh(new THREE.BoxGeometry(124, 2, 84), c.floorBorder),
    c.floorBorder,
  );
  floorBorder.position.y = 0;
  floorBorder.receiveShadow = true;
  floorBorder.castShadow = true;
  group.add(floorBorder);

  const counter = track(
    new THREE.Mesh(new THREE.BoxGeometry(100, 18, 12), c.counter),
    c.counter,
  );
  counter.position.set(0, 11, -25);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  const counterTop = track(
    new THREE.Mesh(new THREE.BoxGeometry(104, 3, 15), c.counterTop),
    c.counterTop,
  );
  counterTop.position.set(0, 21.5, -25);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  group.add(counterTop);

  const tablePositions = [
    { x: -30, z: 10 },
    { x: 30, z: 10 },
  ];

  tablePositions.forEach(({ x, z }) => {
    const top = track(
      new THREE.Mesh(new THREE.BoxGeometry(18, 2.5, 18), c.plasticWhite),
      c.plasticWhite,
    );
    top.position.set(x, 12, z);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    const underside = track(
      new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), c.plasticWhiteDark),
      c.plasticWhiteDark,
    );
    underside.position.set(x, 10.5, z);
    underside.castShadow = true;
    underside.receiveShadow = true;
    group.add(underside);

    const leg = track(
      new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), c.metal),
      c.metal,
    );
    leg.position.set(x, 6, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);

    const base = track(
      new THREE.Mesh(new THREE.BoxGeometry(12, 1.5, 12), c.metal),
      c.metal,
    );
    base.position.set(x, 0.75, z);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);
  });

  // Cadeiras instanciadas (2 mesas x 4 cadeiras = 8, ainda vale a pena
  // pela consistência e por já termos o helper pronto)
  const chairs = buildChairInstances({
    tables: tablePositions,
    distance: 13,
    angles: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
    seat: { size: [8, 2.5, 8], offsetY: 8, material: c.plasticWhite },
    back: { size: [8, 8, 2], offset: [0, 13, -3], material: c.plasticWhite },
    legs: {
      size: [1.5, 8, 1.5],
      offsetY: 4,
      offsetX: 2.5,
      material: c.metal,
      highlightable: true,
    },
  });

  group.add(chairs.seatMesh, chairs.backMesh, chairs.legMesh);

  const glowStart = new THREE.PointLight(COLORS.nodeStart, 0, 180, 2);
  glowStart.position.set(0, 45, 0);
  group.add(glowStart);

  const centerGlow = new THREE.PointLight(COLORS.nodeStart, 0, 100, 2);
  centerGlow.position.set(0, 15, 0);
  group.add(centerGlow);

  group.position.set(vertex.x - 50, 0, vertex.y);
  group.rotation.y = Math.PI / 2;

  group.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  scene.add(group);

  const update = ({ isStart, isEnd }) => {
    const overrideMaterial = isStart
      ? new THREE.MeshStandardMaterial({
          color: COLORS.nodeStart,
          emissive: COLORS.nodeStart,
          emissiveIntensity: 0.45,
          roughness: 0.4,
        })
      : isEnd
        ? new THREE.MeshStandardMaterial({
            color: COLORS.nodeEnd,
            emissive: COLORS.nodeEnd,
            emissiveIntensity: 0.45,
            roughness: 0.4,
          })
        : null;

    highlightables.forEach(({ mesh, normalMaterial }) => {
      mesh.material = overrideMaterial || normalMaterial;
    });

    chairs.seatMesh.material = overrideMaterial || chairs.seatNormalMaterial;
    chairs.backMesh.material = overrideMaterial || chairs.backNormalMaterial;
    if (chairs.legsHighlightable) {
      chairs.legMesh.material = overrideMaterial || chairs.legNormalMaterial;
    }

    const glowColor = isStart ? COLORS.nodeStart : COLORS.nodeEnd;
    const intensity = isStart || isEnd ? 1 : 0;

    glowStart.intensity = intensity * 3.5;
    glowStart.color.setHex(glowColor);
    centerGlow.intensity = intensity * 2;
    centerGlow.color.setHex(glowColor);
  };

  update({ isStart: false, isEnd: false });

  return update;
}

// ============================================================
// ILUMINAÇÃO / CHÃO
// ============================================================

function setupLights(scene) {
  const ambient = new THREE.HemisphereLight(0xffffff, 0x18202b, 1.4);
  scene.add(ambient);

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

  const fill = new THREE.PointLight(0x4a90d9, 1.2, 1500);
  fill.position.set(300, 300, 300);
  scene.add(fill);
}

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

  // sceneRef guarda tudo o que o efeito de rota precisa acessar sem
  // reconstruir a cena: handlers de nós/arestas, o mapa de vértices e
  // o frame da animação de câmera (para poder cancelá-lo).
  const sceneRef = useRef(null);

  // ==========================================================
  // EFEITO 1 — construção estática da cena
  //
  // Roda apenas quando `graph` ou `showLabels` mudam. NÃO depende de
  // `rota`: recalcular um caminho não recria mais o WebGL inteiro.
  // ==========================================================

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    if (
      !graph ||
      !Array.isArray(graph.vertices) ||
      !Array.isArray(graph.arestas)
    ) {
      console.warn("FloorMap3D: grafo inválido.");
      return undefined;
    }

    const width = Math.max(mount.clientWidth, 1);
    const height = Math.max(mount.clientHeight, 1);

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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 1800, 3500);

    const camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      width / height,
      CONFIG.camera.near,
      CONFIG.camera.far,
    );
    camera.position.set(...CONFIG.camera.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(735, 0, 600);
    controls.enableDamping = true;
    controls.dampingFactor = CONFIG.controls.dampingFactor;
    controls.minDistance = CONFIG.controls.minDistance;
    controls.maxDistance = CONFIG.controls.maxDistance;
    controls.maxPolarAngle = CONFIG.controls.maxPolarAngle;
    controls.screenSpacePanning = false;
    controls.zoomSpeed = CONFIG.controls.zoomSpeed;
    controls.rotateSpeed = CONFIG.controls.rotateSpeed;
    controls.panSpeed = CONFIG.controls.panSpeed;

    const materials = createMaterials();

    setupLights(scene);
    createFloor(scene, materials);

    const vertexMap = buildVertexMap(graph.vertices);

    const edgeHandlers = new Map();
    graph.arestas.forEach((edge) => {
      const origem = vertexMap.get(edge.origem);
      const destino = vertexMap.get(edge.destino);
      if (!origem || !destino) return;

      const update = createEdge(
        scene,
        toVec3(origem.x, origem.y),
        toVec3(destino.x, destino.y),
        materials,
      );
      if (update) edgeHandlers.set(`${edge.origem}-${edge.destino}`, update);
    });

    const vertexHandlers = new Map();
    graph.vertices.forEach((vertex) => {
      if (vertex.tipo === "cruzamento") return;

      let update = null;

      if (vertex.tipo === "RU") {
        update = createRU(scene, vertex, materials);
      } else if (vertex.tipo?.startsWith("cantina")) {
        update = createCantina(scene, vertex, materials);
      } else if (vertex.tipo?.startsWith("sala-")) {
        update = createDoor(scene, vertex, materials);
      } else if (vertex.tipo === "escada") {
        update = createEscada(scene, vertex, materials);
      } else {
        update = createNode(scene, vertex, materials);
      }

      // LABEL PARA TODOS OS VÉRTICES
      if (showLabels && vertex.tipo !== "escada") {
        createLabel(scene, vertex, vertex.nome ?? vertex.label ?? vertex.id);
      }

      if (update) {
        vertexHandlers.set(vertex.id, update);
      }
    });

    let animationFrame;
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width: newWidth, height: newHeight } = entry.contentRect;
      if (newWidth <= 0 || newHeight <= 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight, false);
    });

    resizeObserver.observe(mount);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      vertexMap,
      edgeHandlers,
      vertexHandlers,
      materials,
      cameraAnimFrame: 0,
    };

    return () => {
      cancelAnimationFrame(animationFrame);
      cancelAnimationFrame(sceneRef.current?.cameraAnimFrame ?? 0);
      resizeObserver.disconnect();
      controls.dispose();

      disposeScene(scene, SHARED_MATERIALS);

      Object.values(materials).forEach((material) => material?.dispose?.());

      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
    };
  }, [graph, showLabels]);

  // ==========================================================
  // EFEITO 2 — atualização da rota
  //
  // Roda a cada mudança de `rota`. Não toca em geometrias, materiais
  // "pesados" ou no renderer — apenas alterna escala/cor/visibilidade
  // dos handlers já criados, e anima a câmera.
  // ==========================================================

  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return undefined;

    const { camera, controls, vertexMap, edgeHandlers, vertexHandlers } = ctx;

    const routeSet = buildRouteSet(rota);
    const routeVertices = new Set(rota);
    const startId = rota.length > 0 ? rota[0] : null;
    const endId = rota.length > 0 ? rota[rota.length - 1] : null;

    vertexHandlers.forEach((update, id) => {
      update({
        isOnRoute: routeVertices.has(id),
        isStart: id === startId,
        isEnd: id === endId,
      });
    });

    edgeHandlers.forEach((update, key) => {
      update(routeSet.has(key));
    });

    // Cancela qualquer animação de câmera anterior antes de iniciar
    // outra — no original esse frame nunca era cancelado.
    cancelAnimationFrame(ctx.cameraAnimFrame);

    if (rota.length >= 2) {
      const origem = vertexMap.get(rota[0]);
      const destino = vertexMap.get(rota[rota.length - 1]);
      const proximo = vertexMap.get(rota[1]);

      if (origem && destino && proximo) {
        const origemPos = toVec3(origem.x, origem.y);
        const proximoPos = toVec3(proximo.x, proximo.y);
        const destinoPos = toVec3(destino.x, destino.y);

        // ========================================================
        // CENTRO ENTRE ORIGEM E DESTINO
        // ========================================================

        const centroRota = origemPos
          .clone()
          .add(destinoPos)
          .multiplyScalar(0.5);

        centroRota.y = 25;

        // ========================================================
        // DIREÇÃO INICIAL DA ROTA
        // ========================================================

        const direcao = new THREE.Vector3()
          .subVectors(proximoPos, origemPos)
          .normalize();

        // ========================================================
        // DISTÂNCIA DA ROTA
        // ========================================================

        const distanciaRota = origemPos.distanceTo(destinoPos);

        const distanciaCamera = THREE.MathUtils.clamp(
          distanciaRota * 0.9,
          250,
          1200,
        );

        // ========================================================
        // CÂMERA FINAL — VISÃO DA ROTA
        // ========================================================

        const cameraFinal = centroRota
          .clone()
          .sub(direcao.clone().multiplyScalar(distanciaCamera));

        cameraFinal.y = Math.max(180, distanciaCamera * 0.45);

        // ========================================================
        // TARGET FINAL — MEIO DA ROTA
        // ========================================================

        const targetFinal = centroRota.clone();

        // ========================================================
        // CÂMERA NO DESTINO
        // ========================================================

        const cameraDestino = destinoPos
          .clone()
          .add(direcao.clone().multiplyScalar(160));

        cameraDestino.y = 140;

        // ========================================================
        // TARGET NO DESTINO
        // ========================================================

        const targetDestino = destinoPos.clone();
        targetDestino.y = 25;

        // ========================================================
        // ANIMAÇÃO
        // ========================================================

        cancelAnimationFrame(ctx.cameraAnimFrame);

        const inicioCamera = camera.position.clone();
        const inicioTarget = controls.target.clone();

        const duracaoFoco = 900;
        const duracaoRota = 1200;
        const pausaDestino = 1200;

        const inicio = performance.now();

        const easeInOutCubic = (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animarCamera = (agora) => {
          const tempo = agora - inicio;

          // ======================================================
          // FASE 1 — DESTINO
          // ======================================================

          if (tempo < duracaoFoco) {
            const progresso = tempo / duracaoFoco;

            const t = easeInOutCubic(progresso);

            camera.position.lerpVectors(inicioCamera, cameraDestino, t);

            controls.target.lerpVectors(inicioTarget, targetDestino, t);

            controls.update();

            ctx.cameraAnimFrame = requestAnimationFrame(animarCamera);

            return;
          }

          // ======================================================
          // PEQUENA PAUSA NO DESTINO
          // ======================================================

          if (tempo < duracaoFoco + pausaDestino) {
            camera.position.copy(cameraDestino);
            controls.target.copy(targetDestino);

            controls.update();

            ctx.cameraAnimFrame = requestAnimationFrame(animarCamera);

            return;
          }

          // ======================================================
          // FASE 2 — ABRE PARA A ROTA
          // ======================================================

          const tempoRota = tempo - duracaoFoco - pausaDestino;

          const progresso = Math.min(tempoRota / duracaoRota, 1);

          const t = easeInOutCubic(progresso);

          camera.position.lerpVectors(cameraDestino, cameraFinal, t);

          controls.target.lerpVectors(targetDestino, targetFinal, t);

          controls.update();

          if (progresso < 1) {
            ctx.cameraAnimFrame = requestAnimationFrame(animarCamera);
          }
        };

        ctx.cameraAnimFrame = requestAnimationFrame(animarCamera);
      }
    }

    return () => {
      cancelAnimationFrame(ctx.cameraAnimFrame);
    };
  }, [rota]);

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
