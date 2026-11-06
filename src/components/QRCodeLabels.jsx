import { QRCodeSVG } from "qrcode.react";
import graph from "../data/graph.json";
import "./QRCodeLabels.css";

function QRCodeLabels() {
  const locais = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  // Sempre gera os códigos apontando para a aplicação publicada.
  //const urlBase =  "http://localhost:5173/";
  const urlBase = "https://mapa-ufc-russas.vercel.app/";

  return (
    <main className="pagina-qrcodes">
      <header className="qrcodes-header">
        <button className="botao-imprimir" onClick={() => window.print()}>
          Imprimir QR Codes
        </button>
      </header>

      <section className="qrcodes-grid">
        {locais.map((local) => {
          const url = new URL(urlBase);
          url.searchParams.set("origem", local.id);

          return (
            <article className="qrcode-card" key={local.id}>
              <h3>{local.nome}</h3>

              <QRCodeSVG
                value={url.toString()}
                size={160}
                level="H"
                includeMargin
              />

              <p>Escaneie para iniciar a navegação</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default QRCodeLabels;
