import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// ─── Paleta de cores ──────────────────────────────────────────────────────────
const COLORS = {
  floor: 0x1a1a2e,
  edge: 0x2d4a7a,
  edgeHighlight: 0xff4757,
  nodeDefault: 0x4a90d9,
  nodeOnRoute: 0xff6b81,
  nodeStart: 0x2ecc71,
  nodeEnd: 0xe74c3c,
  routeGlow: 0xff4757,
  background: 0x0d0d1a,
  fog: 0x0d0d1a,
};

// ─── Funções auxiliares (fora do componente para não recriar a cada render) ───

/** Converte coordenadas SVG → Three.js Vector3 */
const toVec3 = (x, y, height = 0) => new THREE.Vector3(x, height, y);

/** Cria e configura um Mesh adicionando-o à cena; retorna o mesh para posterior dispose */
function addMesh(scene, geometry, material, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  if (options.position) mesh.position.copy(options.position);
  if (options.rotation) mesh.rotation.copy(options.rotation);
  if (options.castShadow) mesh.castShadow = true;
  if (options.receiveShadow) mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/** Cria um Set com pares de arestas que fazem parte da rota */
function buildRouteSet(rota = []) {
  const set = new Set();
  for (let i = 0; i < rota.length - 1; i++) {
    set.add(`${rota[i]}-${rota[i + 1]}`);
    set.add(`${rota[i + 1]}-${rota[i]}`);
  }
  return set;
}

/** Cria a aresta (corredor) entre dois vértices */
function createEdge(scene, p1, p2, isOnRoute) {
  const length = p1.distanceTo(p2);
  const width = isOnRoute ? 30 : 20;
  const geo = new THREE.BoxGeometry(length, 2, width);
  const mat = new THREE.MeshStandardMaterial({
    color: isOnRoute ? 0xff4444 : 0x404040,
    roughness: 0.9,
    metalness: 0.05,
  });

  const mid = p1.clone().add(p2).multiplyScalar(0.5);
  const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

  const mesh = addMesh(scene, geo, mat, {
    position: mid,
    castShadow: true,
    receiveShadow: true,
  });
  mesh.rotation.y = -angle;

  if (isOnRoute) {
    const glowGeo = new THREE.BoxGeometry(length, 0.5, width + 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff5555,
      transparent: true,
      opacity: 0.25,
    });
    const glow = addMesh(scene, glowGeo, glowMat, { position: mid.clone() });
    glow.position.y += 1.5;
    glow.rotation.y = -angle;
  }
}

/** Cria o grupo da cantina */
function createCantina(scene, v) {
  const group = new THREE.Group();

  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c0,
    roughness: 0.9,
  });
  const balcaoMat = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.7,
  });
  const assentoMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
  const pernasMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

  // Piso
  const floor = new THREE.Mesh(new THREE.BoxGeometry(120, 4, 80), floorMat);
  floor.position.y = 2;
  group.add(floor);

  // Balcão
  const balcao = new THREE.Mesh(new THREE.BoxGeometry(100, 18, 12), balcaoMat);
  balcao.position.set(0, 11, -25);
  group.add(balcao);

  const criarCadeira = (x, z) => {
    const cadeira = new THREE.Group();
    const assento = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 8), assentoMat);
    assento.position.y = 8;
    cadeira.add(assento);
    const encosto = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 2), assentoMat);
    encosto.position.set(0, 13, -3);
    cadeira.add(encosto);
    cadeira.position.set(x, 0, z);
    return cadeira;
  };

  const criarMesa = (x, z) => {
    const mesa = new THREE.Group();
    const tampo = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), mesaMat);
    tampo.position.y = 12;
    mesa.add(tampo);
    const perna = new THREE.Mesh(new THREE.BoxGeometry(2, 12, 2), pernasMat);
    perna.position.y = 6;
    mesa.add(perna);
    mesa.position.set(x, 0, z);
    for (const [cx, cz] of [
      [0, -12],
      [0, 12],
      [-12, 0],
      [12, 0],
    ]) {
      mesa.add(criarCadeira(cx, cz));
    }
    return mesa;
  };

  for (const [mx, mz] of [
    [-30, 10],
    [30, 10],
    [-30, 40],
    [30, 40],
  ]) {
    group.add(criarMesa(mx, mz));
  }

  group.position.set(v.x - 50, -3, v.y);
  group.rotation.y = Math.PI / 2;
  scene.add(group);
}

/** Cria porta de sala */
function createDoor(scene, v) {
  const group = new THREE.Group();
  const doorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0.1,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 1,
    roughness: 0.15,
  });

  const door = new THREE.Mesh(new THREE.BoxGeometry(15, 28, 4), doorMat);
  door.position.y = 15;
  group.add(door);

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    handleMat,
  );
  handle.position.set(5, 15, 3);
  group.add(handle);

  group.position.set(v.x, 0, v.y);

  const offsets = {
    "sala-direita": { ry: -Math.PI / 2, dx: 12, dz: 0 },
    "sala-esquerda": { ry: Math.PI / 2, dx: -12, dz: 0 },
    "sala-cima": { ry: 0, dx: 0, dz: -12 },
    "sala-baixo": { ry: Math.PI, dx: 0, dz: 12 },
  };

  const cfg = offsets[v.type];
  if (cfg) {
    group.rotation.y = cfg.ry;
    group.position.x += cfg.dx;
    group.position.z += cfg.dz;
  }

  scene.add(group);
}

/** Cria escada */
function createEscada(scene, v, isOnRoute) {
  const group = new THREE.Group();
  const stairMat = new THREE.MeshStandardMaterial({
    color: 0xdfe6e9,
    metalness: 0.4,
    roughness: 0.4,
    emissive: isOnRoute ? 0xff6b81 : 0x000000,
    emissiveIntensity: isOnRoute ? 0.3 : 0,
  });

  for (let i = 0; i < 6; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 25), stairMat);
    step.position.set(-i * 7, 2 + i * 4, 0);
    group.add(step);
  }

  if (isOnRoute) {
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(18, 18, 2, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff6b81,
        transparent: true,
        opacity: 0.35,
      }),
    );
    glow.position.set(0, 1, 0);
    group.add(glow);
  }

  group.position.set(v.x - 20, 0, v.y);
  scene.add(group);
}

/** Cria nó genérico (cilindro + esfera + anel opcional) */
function createNode(scene, v, color, isOnRoute, isStart, isEnd) {
  const height = isStart || isEnd ? 40 : isOnRoute ? 28 : 18;
  const radius = isStart || isEnd ? 12 : isOnRoute ? 9 : 7;

  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: isOnRoute ? 0.3 : 0.05,
    metalness: 0.4,
    roughness: 0.3,
  });

  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 1.3, height, 12),
    mat,
  );
  cyl.position.set(v.x, height / 2, v.y);
  cyl.castShadow = true;
  scene.add(cyl);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.2, 16, 16),
    mat,
  );
  sphere.position.set(v.x, height + radius * 0.8, v.y);
  sphere.castShadow = true;
  scene.add(sphere);

  if (isOnRoute) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 2.2, 2, 8, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    );
    ring.position.set(v.x, height + radius * 0.8, v.y);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
  }
}

/** Cria label flutuante de texto usando CanvasTexture */
function createLabel(scene, v, text) {
  if (!text) return;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.roundRect(4, 4, 248, 56, 8);
  ctx.fill();

  ctx.fillStyle = "#e0e8ff";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(v.x, 60, v.y);
  sprite.scale.set(80, 20, 1);
  scene.add(sprite);
}

// ─── Configuração de luzes ────────────────────────────────────────────────────

function setupLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(300, 600, 400);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  Object.assign(dir.shadow.camera, {
    near: 1,
    far: 2000,
    left: -600,
    right: 600,
    top: 600,
    bottom: -600,
  });
  scene.add(dir);

  const fill = new THREE.PointLight(0x4a90d9, 0.5, 1200);
  fill.position.set(800, 300, 200);
  scene.add(fill);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FloorMap3D({ graph, rota = [], showLabels = true }) {
  const mountRef = useRef(null);

  // Recalcula apenas quando `rota` muda
  const rotaSet = useMemo(() => buildRouteSet(rota), [rota]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);

    // Câmera
    const camera = new THREE.PerspectiveCamera(70, W / H, 1, 3000);
    camera.position.set(500, 700, 900);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(500, 0, 500);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minDistance = 200;
    controls.maxDistance = 1500;

    // Luzes
    setupLights(scene);

    // Chão
    const floorMesh = addMesh(
      scene,
      new THREE.PlaneGeometry(15000, 15000),
      new THREE.MeshStandardMaterial({
        color: 0x2e7d32,
        roughness: 1,
        metalness: 0,
      }),
      { receiveShadow: true },
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(500, -2, 600);

    // Helper para buscar vértice pelo ID
    const getVertex = (id) => graph.vertices.find((v) => v.id === id);

    // Arestas
    graph.arestas.forEach((a) => {
      const origem = getVertex(a.origem);
      const destino = getVertex(a.destino);
      if (!origem || !destino) return;

      const isOnRoute = rotaSet.has(`${a.origem}-${a.destino}`);
      createEdge(
        scene,
        toVec3(origem.x, origem.y),
        toVec3(destino.x, destino.y),
        isOnRoute,
      );
    });

    // Vértices
    graph.vertices.forEach((v) => {
      const isStart = rota[0] === v.id;
      const isEnd = rota[rota.length - 1] === v.id;
      const isOnRoute = rota.includes(v.id);

      // Tipos invisíveis
      if (v.type === "cruzamento") return;

      if (v.type?.startsWith("cantina")) {
        createCantina(scene, v);
        return;
      }

      if (v.type?.startsWith("sala-")) {
        createDoor(scene, v);
        return;
      }

      if (v.type === "escada") {
        createEscada(scene, v, isOnRoute);
      } else {
        const color = isStart
          ? COLORS.nodeStart
          : isEnd
            ? COLORS.nodeEnd
            : isOnRoute
              ? COLORS.nodeOnRoute
              : COLORS.nodeDefault;

        createNode(scene, v, color, isOnRoute, isStart, isEnd);
      }

      // Labels opcionais
      if (showLabels) {
        const label = v.nome || v.label || v.id;
        createLabel(scene, v, label);
      }
    });

    // Loop de animação
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize responsivo
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(mount);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      controls.dispose();

      // Dispose de todos os objetos da cena para evitar memory leak
      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              m.map?.dispose();
              m.dispose();
            });
          } else {
            obj.material?.map?.dispose();
            obj.material?.dispose();
          }
        }
        if (obj.isSprite) {
          obj.material?.map?.dispose();
          obj.material?.dispose();
        }
      });

      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [graph, rota, rotaSet, showLabels]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1, // Fica no fundo
        overflow: "hidden",
        cursor: "grab",
      }}
      onMouseDown={(e) => (e.currentTarget.style.cursor = "grabbing")}
      onMouseUp={(e) => (e.currentTarget.style.cursor = "grab")}
      onMouseLeave={(e) => (e.currentTarget.style.cursor = "grab")}
    />
  );
}
