import { useState } from "react";
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

  const selectStyle = {
    background: "#16213e",
    color: "#a0c4ff",
    border: "1px solid #2d4a7a",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
  };

  const buttonStyle = {
    background: "linear-gradient(135deg, #ff4757, #c0392b)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 20px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: "0.5px",
    boxShadow: "0 4px 15px rgba(255,71,87,0.4)",
    transition: "transform 0.1s",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d1a",
        fontFamily: "'Segoe UI', sans-serif",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            color: "#e0e8ff",
            fontSize: "22px",
            fontWeight: 700,
            margin: 0,
            letterSpacing: "1px",
          }}
        >
          🗺️ Mapa de Rotas 3D
        </h1>
        <p style={{ color: "#4a6fa5", fontSize: "13px", margin: "4px 0 0" }}>
          Selecione origem e destino para visualizar a menor rota
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <select
          style={selectStyle}
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
        >
          <option value="">📍 Origem</option>
          {graph.vertices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <span style={{ color: "#2d4a7a", fontSize: "18px" }}>→</span>

        <select
          style={selectStyle}
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        >
          <option value="">🏁 Destino</option>
          {graph.vertices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label || v.nome || v.id}
            </option>
          ))}
        </select>

        <button
          style={buttonStyle}
          onClick={calcularRota}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Buscar Rota
        </button>

        {rota.length > 0 && (
          <span
            style={{
              color: "#ff6b81",
              fontSize: "13px",
              background: "rgba(255,71,87,0.1)",
              border: "1px solid rgba(255,71,87,0.3)",
              borderRadius: "6px",
              padding: "6px 12px",
            }}
          >
            {rota.length} paradas encontradas
          </span>
        )}
      </div>

      {/* 3D Map */}
      <FloorMap3D graph={graph} rota={rota} />
    </div>
  );
}

export default App;
