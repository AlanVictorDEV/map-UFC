import { QRCodeSVG } from "qrcode.react";
import graph from "../data/graph.json";
import "./QRCodeLabels.css";

function QRCodeLabels() {
  const params = new URLSearchParams(window.location.search);

  // Identifica o modo de geração
  const modoTotem = params.get("gerar-totem") === "1";

  // Origem configurada para o totem
  const origemId = params.get("origem");

  // URL principal do sistema
  const urlBase = "https://mapa-ufc-russas.vercel.app/";

  // Locais disponíveis para navegação
  const locais = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  // Valida a origem informada na URL
  const origem = locais.find((v) => v.id === origemId);

  // No totem, remove a própria origem da lista de destinos
  const locaisQR = modoTotem ? locais.filter((v) => v.id !== origemId) : locais;

  // Impede a geração de um painel com origem inválida
  if (modoTotem && !origem) {
    return (
      <main className="pagina-qrcodes">
        <header className="qrcodes-header">
          <h1>Não foi possível gerar o painel</h1>
        </header>

        <p>A origem informada não existe ou não está disponível no grafo.</p>

        <p>
          ID recebido: <strong>{origemId || "Não informado"}</strong>
        </p>
      </main>
    );
  }

  // Gera a URL correspondente a cada QR Code
  const gerarUrlQR = (local) => {
    const url = new URL(urlBase);

    if (modoTotem) {
      // Totem: origem fixa e destino variável
      url.searchParams.set("origem", origemId);
      url.searchParams.set("destino", local.id);
    } else {
      // Sala: somente a origem é definida
      url.searchParams.set("origem", local.id);
    }

    return url.toString();
  };

  return (
    <main className="pagina-qrcodes">
      <header className="qrcodes-header">
        <h1>
          {modoTotem
            ? `Painel de Destinos - ${origem.nome}`
            : "QR Codes de Origem"}
        </h1>

        <button className="botao-imprimir" onClick={() => window.print()}>
          Imprimir QR Codes
        </button>
      </header>

      <section className="qrcodes-grid">
        {locaisQR.map((local) => (
          <article className="qrcode-card" key={local.id}>
            <h3>{local.nome || local.label || local.id}</h3>

            <QRCodeSVG
              value={gerarUrlQR(local)}
              size={250}
              level="H"
              includeMargin
            />

            <p>
              {modoTotem
                ? `Destino a partir de ${origem.nome}`
                : "Escaneie para definir sua origem"}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default QRCodeLabels;
