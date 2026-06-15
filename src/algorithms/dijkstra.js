// Algoritmo de Dijkstra para encontrar o menor caminho
// entre um vértice de origem e um vértice de destino
export function dijkstra(graph, origem, destino) {
  // Obtém os vértices e arestas do grafo
  const vertices = graph.vertices;
  const arestas = graph.arestas;

  // Lista de adjacência
  // Cada vértice armazenará seus vizinhos
  const adj = {};

  // Inicializa a lista de adjacência vazia
  vertices.forEach((v) => {
    adj[v.id] = [];
  });

  // Percorre todas as arestas
  arestas.forEach((a) => {
    // Busca os vértices conectados pela aresta
    const v1 = vertices.find((v) => v.id === a.origem);
    const v2 = vertices.find((v) => v.id === a.destino);

    // Calcula a distância euclidiana entre os pontos
    // Essa distância será usada como peso da aresta
    const peso = Math.hypot(v2.x - v1.x, v2.y - v1.y);

    // Como o grafo é não direcionado,
    // adiciona a ligação nos dois sentidos

    adj[a.origem].push({
      node: a.destino,
      weight: peso,
    });

    adj[a.destino].push({
      node: a.origem,
      weight: peso,
    });
  });

  // Distância mínima conhecida até cada vértice
  const dist = {};

  // Guarda o vértice anterior no caminho ótimo
  const prev = {};

  // Conjunto de vértices já processados
  const visited = new Set();

  // Inicializa todas as distâncias como infinito
  vertices.forEach((v) => {
    dist[v.id] = Infinity;
  });

  // A distância da origem para ela mesma é zero
  dist[origem] = 0;

  // Enquanto ainda existirem vértices não visitados
  while (visited.size < vertices.length) {
    let atual = null;

    // Procura o vértice não visitado
    // com menor distância conhecida
    for (const id in dist) {
      if (!visited.has(id) && (atual === null || dist[id] < dist[atual])) {
        atual = id;
      }
    }

    // Se chegou ao destino,
    // não precisa continuar
    if (atual === destino) break;

    // Marca o vértice como visitado
    visited.add(atual);

    // Relaxamento das arestas
    for (const vizinho of adj[atual]) {
      const novaDist = dist[atual] + vizinho.weight;

      // Se encontrou um caminho melhor,
      // atualiza a distância
      if (novaDist < dist[vizinho.node]) {
        dist[vizinho.node] = novaDist;

        // Guarda quem levou até esse vértice
        prev[vizinho.node] = atual;
      }
    }
  }

  // Reconstrução do caminho final
  const caminho = [];

  let atual = destino;

  while (atual) {
    caminho.unshift(atual);
    atual = prev[atual];
  }

  return caminho;
}
