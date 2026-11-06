import { useState, useEffect } from "react";
import "./App.css";
import graph from "./data/graph.json";
import FloorMap3D from "./components/FloorMap3D";
import QRCodeLabels from "./components/QRCodeLabels";
import { dijkstra } from "./algorithms/dijkstra";

function App() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [rota, setRota] = useState([]);
  const gerarQR =
    new URLSearchParams(window.location.search).get("gerar-qrcodes") === "1";

  if (gerarQR) {
    return <QRCodeLabels />;
  }

  // Locais disponíveis para origem e destino.
  const locaisDisponiveis = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  // Identifica a origem através do QR Code.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const origemQR = params.get("origem");

    const localValido = locaisDisponiveis.some(
      (local) => local.id === origemQR,
    );

    if (localValido) {
      setOrigem(origemQR);
    }
  }, []);

  function calcularRota() {
    if (!origem || !destino || origem === destino) return;

    const resultado = dijkstra(graph, origem, destino);
    setRota(resultado);
  }

  return (
    <div className="app">
      <div className="control-panel">
        {/* ORIGEM */}
        <label htmlFor="select-origem" className="sr-only">
          Origem
        </label>

        <select
          id="select-origem"
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
        <label htmlFor="select-destino" className="sr-only">
          Destino
        </label>

        <select
          id="select-destino"
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
          disabled={!origem || !destino || origem === destino}
        >
          Buscar Rota
        </button>
      </div>

      <FloorMap3D graph={graph} rota={rota} />
    </div>
  );
}

export default App;
