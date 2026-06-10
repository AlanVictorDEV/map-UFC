export function dijkstra(graph, origem, destino) {
  const vertices = graph.vertices;
  const arestas = graph.arestas;

  const adj = {};

  vertices.forEach((v) => {
    adj[v.id] = [];
  });

  arestas.forEach((a) => {
    const v1 = vertices.find((v) => v.id === a.origem);
    const v2 = vertices.find((v) => v.id === a.destino);

    const peso = Math.hypot(v2.x - v1.x, v2.y - v1.y);

    adj[a.origem].push({
      node: a.destino,
      weight: peso,
    });

    adj[a.destino].push({
      node: a.origem,
      weight: peso,
    });
  });

  const dist = {};
  const prev = {};
  const visited = new Set();

  vertices.forEach((v) => {
    dist[v.id] = Infinity;
  });

  dist[origem] = 0;

  while (visited.size < vertices.length) {
    let atual = null;

    for (const id in dist) {
      if (!visited.has(id) && (atual === null || dist[id] < dist[atual])) {
        atual = id;
      }
    }

    if (atual === destino) break;

    visited.add(atual);

    for (const vizinho of adj[atual]) {
      const novaDist = dist[atual] + vizinho.weight;

      if (novaDist < dist[vizinho.node]) {
        dist[vizinho.node] = novaDist;
        prev[vizinho.node] = atual;
      }
    }
  }

  const caminho = [];

  let atual = destino;

  while (atual) {
    caminho.unshift(atual);
    atual = prev[atual];
  }

  return caminho;
}
