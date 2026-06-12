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
        width: "100vw",
        height: "100vh",
        background: "#0d0d1a",
        fontFamily: "'Segoe UI', sans-serif",
        boxSizing: "border-box",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* Painel de Controles Flutuante */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10, // Fica por cima do mapa 3D
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
          background: "rgba(13, 13, 26, 0.75)", // Fundo semitransparente
          padding: "16px",
          borderRadius: "12px",
          backdropFilter: "blur(10px)", // Efeito de desfoque moderno
          border: "1px solid rgba(45, 74, 122, 0.5)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          maxWidth: "calc(100vw - 40px)", // Evita que saia da tela no mobile
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

      {/* Mapa 3D (Ocupando o fundo inteiro) */}
      <FloorMap3D graph={graph} rota={rota} />
    </div>
  );
}

export default App;
