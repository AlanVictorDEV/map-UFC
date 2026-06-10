import Vertex from "./Vertex";

export default function GraphLayer({ graph, rota = [] }) {
  const getVertex = (id) => graph.vertices.find((v) => v.id === id);

  const pontosRota = rota

    .map((id) => {
      const v = getVertex(id);

      if (!v) {
        console.error("Vértice não encontrado:", id);
        return null;
      }

      return `${v.x},${v.y}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {graph.arestas.map((a, i) => {
        const origem = getVertex(a.origem);
        const destino = getVertex(a.destino);

        if (!origem || !destino) {
          console.error("Aresta inválida:", a);
          return null;
        }

        return (
          <line
            key={i}
            x1={origem.x}
            y1={origem.y}
            x2={destino.x}
            y2={destino.y}
            stroke="#ccc"
            strokeWidth="3"
          />
        );
      })}

      {/* Vértices */}
      {graph.vertices.map((v) => (
        <Vertex key={v.id} vertex={v} />
      ))}

      {/* Rota */}
      {rota.length > 1 && (
        <polyline
          points={pontosRota}
          stroke="red"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </>
  );
}
