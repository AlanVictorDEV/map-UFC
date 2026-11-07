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

  const paramsURL = new URLSearchParams(window.location.search);

  const gerarQR =
    paramsURL.get("gerar-qrcodes") === "1" ||
    paramsURL.get("gerar-totem") === "1";

  const locaisDisponiveis = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const origemQR = params.get("origem");
    const destinoQR = params.get("destino");

    const origemValida = locaisDisponiveis.some(
      (local) => local.id === origemQR,
    );

    const destinoValido = locaisDisponiveis.some(
      (local) => local.id === destinoQR,
    );

    if (origemQR) {
      setOrigem(origemValida ? origemQR : "");
    }

    if (destinoQR) {
      setDestino(destinoValido ? destinoQR : "");
    }
  }, []);

  useEffect(() => {
    if (!origem || !destino || origem === destino) {
      setRota([]);
      setEstadoTrajeto("inativo");
      return;
    }

    const resultado = dijkstra(graph, origem, destino);

    setRota(resultado);
    setEstadoTrajeto(resultado.length >= 2 ? "pronto" : "inativo");
  }, [origem, destino]);

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

  const nomeOrigem = locaisDisponiveis.find(
    (local) => local.id === origem,
  )?.nome;

  const nomeDestino = locaisDisponiveis.find(
    (local) => local.id === destino,
  )?.nome;

  return (
    <main className="app">
      <FloorMap3D
        graph={graph}
        rota={rota}
        estadoTrajeto={estadoTrajeto}
        reinicioKey={reinicioKey}
        onTrajetoConcluido={concluirTrajeto}
      />

      <section className="control-panel">
        <div className="panel-header">
          <span className="panel-eyebrow">
            NAVEGAÇÃO INTERNA UFC CAMPUS DE RUSSAS
          </span>
        </div>

        <div className="route-fields">
          <div className="route-field">
            <span className="field-marker origin-marker" />
            <div className="field-content">
              <label htmlFor="select-origem">PONTO DE PARTIDA</label>

              <select
                id="select-origem"
                className="select-field"
                value={origem}
                onChange={(e) => setOrigem(e.target.value)}
              >
                <option value="">Selecione sua origem</option>

                {locaisDisponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label || v.nome || v.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="route-connector" />

          <div className="route-field">
            <span className="field-marker destination-marker" />
            <div className="field-content">
              <label htmlFor="select-destino">DESTINO</label>

              <select
                id="select-destino"
                className="select-field"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
              >
                <option value="">Para onde deseja ir?</option>

                {locaisDisponiveis.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label || v.nome || v.id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="route-actions">
          {estadoTrajeto === "pronto" && (
            <button
              className="route-button primary-button"
              onClick={iniciarTrajeto}
            >
              <span>▶</span> Iniciar navegação
            </button>
          )}

          {estadoTrajeto === "executando" && (
            <button
              className="route-button primary-button"
              onClick={pausarTrajeto}
            >
              <span>Ⅱ</span> Pausar navegação
            </button>
          )}

          {estadoTrajeto === "pausado" && (
            <button
              className="route-button primary-button"
              onClick={continuarTrajeto}
            >
              <span>▶</span> Continuar navegação
            </button>
          )}

          {estadoTrajeto === "inativo" && (
            <button className="route-button disabled-button" disabled>
              Defina origem e destino
            </button>
          )}

          {estadoTrajeto === "concluido" && (
            <div className="route-completed">Você chegou ao destino!</div>
          )}

          {["executando", "pausado", "concluido"].includes(estadoTrajeto) && (
            <button
              className="restart-button"
              onClick={reiniciarTrajeto}
              title="Reiniciar trajeto"
            >
              ↻
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
