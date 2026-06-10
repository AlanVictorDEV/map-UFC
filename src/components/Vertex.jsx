export default function Vertex({ vertex }) {
  return (
    <>
      <circle cx={vertex.x} cy={vertex.y} r={8} />

      <text x={vertex.x + 10} y={vertex.y}>
        {vertex.nome}
      </text>
    </>
  );
}
