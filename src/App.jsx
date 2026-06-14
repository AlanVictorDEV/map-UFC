import { useState } from "react";
import "./App.css";
import graph from "./data/graph.json";
import FloorMap3D from "./components/FloorMap3D";
import { dijkstra } from "./algorithms/dijkstra";

function App() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [rota, setRota] = useState([]);

  function calcularRota() {
    if (!origem || !destino) return;

    const resultado = dijkstra(graph, origem, destino);
    setRota(resultado);
  }

  return (
    <div className="app">
      <div className="control-panel">
        <select
          className="select-field"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
        >
          <option value=""> Origem</option>
          {graph.vertices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <select
          className="select-field"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        >
          <option value="">Destino</option>
          {graph.vertices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <button className="route-button" onClick={calcularRota}>
          Buscar Rota
        </button>
      </div>

      <FloorMap3D graph={graph} rota={rota} />
    </div>
  );
}

export default App;
