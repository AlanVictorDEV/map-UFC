import { useState, useEffect, useCallback } from "react";
import "./App.css";
import graph from "./data/graph.json";
import FloorMap3D from "./components/FloorMap3D";
import QRCodeLabels from "./components/QRCodeLabels";
import { dijkstra } from "./algorithms/dijkstra";

function App() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [rota, setRota] = useState([]);
  const [estadoTrajeto, setEstadoTrajeto] = useState("inativo");
  const [reinicioKey, setReinicioKey] = useState(0);

  const gerarQR =
    new URLSearchParams(window.location.search).get("gerar-qrcodes") === "1";

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

  const calcularRota = () => {
    if (!origem || !destino || origem === destino) return;

    const resultado = dijkstra(graph, origem, destino);

    setRota(resultado);
    setEstadoTrajeto(resultado.length >= 2 ? "pronto" : "inativo");
  };

  const iniciarTrajeto = () => {
    setEstadoTrajeto("executando");
  };

  const pausarTrajeto = () => {
    setEstadoTrajeto("pausado");
  };

  const continuarTrajeto = () => {
    setEstadoTrajeto("executando");
  };

  const reiniciarTrajeto = () => {
    setReinicioKey((key) => key + 1);
    setEstadoTrajeto("executando");
  };

  const concluirTrajeto = useCallback(() => {
    setEstadoTrajeto("concluido");
  }, []);

  if (gerarQR) {
    return <QRCodeLabels />;
  }

  return (
    <div className="app">
      <div className="control-panel">
        <label htmlFor="select-origem" className="sr-only">
          Origem
        </label>

        <select
          id="select-origem"
          className="select-field"
          value={origem}
          onChange={(e) => {
            setOrigem(e.target.value);
            setRota([]);
            setEstadoTrajeto("inativo");
          }}
        >
          <option value="">Origem</option>

          {locaisDisponiveis.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <label htmlFor="select-destino" className="sr-only">
          Destino
        </label>

        <select
          id="select-destino"
          className="select-field"
          value={destino}
          onChange={(e) => {
            setDestino(e.target.value);
            setRota([]);
            setEstadoTrajeto("inativo");
          }}
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

        {estadoTrajeto === "pronto" && (
          <button className="route-button" onClick={iniciarTrajeto}>
            Iniciar trajeto
          </button>
        )}

        {estadoTrajeto === "executando" && (
          <button className="route-button" onClick={pausarTrajeto}>
            Pausar
          </button>
        )}

        {estadoTrajeto === "pausado" && (
          <button className="route-button" onClick={continuarTrajeto}>
            Continuar
          </button>
        )}

        {["executando", "pausado", "concluido"].includes(estadoTrajeto) && (
          <button className="route-button" onClick={reiniciarTrajeto}>
            Reiniciar
          </button>
        )}

        {estadoTrajeto === "concluido" && (
          <span className="route-status">Destino alcançado!</span>
        )}
      </div>

      <FloorMap3D
        graph={graph}
        rota={rota}
        estadoTrajeto={estadoTrajeto}
        reinicioKey={reinicioKey}
        onTrajetoConcluido={concluirTrajeto}
      />
    </div>
  );
}

export default App;
