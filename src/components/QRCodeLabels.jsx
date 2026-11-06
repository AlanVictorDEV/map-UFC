import { QRCodeSVG } from "qrcode.react";
import graph from "../data/graph.json";
import "./QRCodeLabels.css";

function QRCodeLabels() {
  const params = new URLSearchParams(window.location.search);
  const modo = params.get("tipo") || "origem";

  const locais = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  const PORTARIA_ID = "portaria";

  const urlBase = "https://mapa-ufc-russas.vercel.app/";

  const locaisQR =
    modo === "portaria" ? locais.filter((v) => v.id !== PORTARIA_ID) : locais;

  return (
    <main className="pagina-qrcodes">
      <header className="qrcodes-header">
        <h1>
          {modo === "portaria"
            ? "Painel de Destinos - Portaria"
            : "QR Codes de Origem"}
        </h1>

        <button className="botao-imprimir" onClick={() => window.print()}>
          Imprimir QR Codes
        </button>
      </header>

      <section className="qrcodes-grid">
        {locaisQR.map((local) => {
          const url = new URL(urlBase);

          if (modo === "portaria") {
            url.searchParams.set("origem", PORTARIA_ID);
            url.searchParams.set("destino", local.id);
          } else {
            url.searchParams.set("origem", local.id);
          }

          return (
            <article className="qrcode-card" key={local.id}>
              <h3>{local.nome}</h3>

              <QRCodeSVG
                value={url.toString()}
                size={160}
                level="H"
                includeMargin
              />

              <p>
                {modo === "portaria"
                  ? "Destino a partir da portaria"
                  : "Escaneie para definir sua origem"}
              </p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default QRCodeLabels;
