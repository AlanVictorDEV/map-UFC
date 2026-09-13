import { useState } from "react";
import "./App.css";
import graph from "./data/graph.json";
import FloorMap3D from "./components/FloorMap3D";
import { dijkstra } from "./algorithms/dijkstra";

function App() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [rota, setRota] = useState([]);

  // Apenas locais que podem ser escolhidos pelo usuário.
  // Vértices do tipo "cruzamento" continuam no grafo,
  // mas não aparecem como origem/destino.
  const locaisDisponiveis = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  function calcularRota() {
    if (!origem || !destino) return;

    const resultado = dijkstra(graph, origem, destino);
    setRota(resultado);
  }

  return (
    <div className="app">
      <div className="control-panel">
        {/* ORIGEM */}
        <select
          className="select-field"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
        >
          <option value="">Origem</option>

          {locaisDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        {/* DESTINO */}
        <select
          className="select-field"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        >
          <option value="">Destino</option>

          {locaisDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <button
          className="route-button"
          onClick={calcularRota}
          disabled={!origem || !destino}
        >
          Buscar Rota
        </button>
      </div>

      <FloorMap3D graph={graph} rota={rota} />
    </div>
  );
}

export default App;
