import { QRCodeSVG } from "qrcode.react";
import graph from "../data/graph.json";
import "./QRCodeLabels.css";

function QRCodeLabels() {
  const params = new URLSearchParams(window.location.search);

  const modoTotem = params.get("gerar-totem") === "1";
  const origemId = params.get("origem");

  const urlBase = "https://mapa-ufc-russas.vercel.app/";

  const locais = graph.vertices.filter(
    (v) => v.tipo !== "cruzamento" && v.tipo !== "escada",
  );

  const origem = locais.find((v) => v.id === origemId);

  const locaisQR = modoTotem ? locais.filter((v) => v.id !== origemId) : locais;

  if (modoTotem && !origem) {
    return (
      <main className="pagina-qrcodes">
        <div className="erro-qrcodes">
          <h1>Não foi possível gerar os QR Codes</h1>
          <p>A origem informada não existe ou não está disponível.</p>
          <strong>ID recebido: {origemId || "Não informado"}</strong>
        </div>
      </main>
    );
  }

  const gerarUrlQR = (local) => {
    const url = new URL(urlBase);

    if (modoTotem) {
      url.searchParams.set("origem", origemId);
      url.searchParams.set("destino", local.id);
    } else {
      url.searchParams.set("origem", local.id);
    }

    return url.toString();
  };

  return (
    <main
      className={`pagina-qrcodes ${modoTotem ? "modo-totem" : "modo-origem"}`}
    >
      <header className="qrcodes-header">
        <div className="header-identidade">
          <div className="identidade-simbolo">UFC</div>

          <div>
            <span>UNIVERSIDADE FEDERAL DO CEARÁ</span>
            <small>Campus de Russas · Sistema de Navegação Indoor</small>
          </div>
        </div>

        <div className="header-conteudo">
          <span className="header-etiqueta">
            {modoTotem ? "PAINEL DE DESTINOS" : "IDENTIFICAÇÃO DE LOCAL"}
          </span>

          <h1>
            {modoTotem ? "Encontre seu destino" : "Encontre sua localização"}
          </h1>

          <p>
            {modoTotem
              ? `Selecione o local desejado a partir de ${origem.nome}.`
              : "Escaneie o código do local onde você está para iniciar sua navegação."}
          </p>
        </div>

        <div className="instrucoes-gerais">
          <div className="instrucao-item">
            <span className="instrucao-numero">01</span>
            <div>
              <strong>Abra a câmera</strong>
              <small>Aponte para o QR Code.</small>
            </div>
          </div>

          <div className="instrucao-item">
            <span className="instrucao-numero">02</span>
            <div>
              <strong>Escaneie o código</strong>
              <small>Acesse o link exibido.</small>
            </div>
          </div>

          <div className="instrucao-item">
            <span className="instrucao-numero">03</span>
            <div>
              <strong>Visualize sua rota</strong>
              <small>Encontre seu caminho pelo campus.</small>
            </div>
          </div>
        </div>

        <div className="legenda-qrcodes">
          <span className={`legenda-cor ${modoTotem ? "destino" : "origem"}`} />

          <span>
            {modoTotem
              ? `Origem fixa: ${origem.nome}`
              : "QR Code de identificação de origem"}
          </span>

          <span className="legenda-total">{locaisQR.length} códigos</span>
        </div>

        <button className="botao-imprimir" onClick={() => window.print()}>
          <span>⎙</span> Imprimir QR Codes
        </button>
      </header>

      <section className="qrcodes-grid">
        {locaisQR.map((local, index) => (
          <article className="qrcode-card" key={local.id}>
            <div className="card-faixa" />

            <div className="card-topo">
              <span
                className={`card-tipo ${modoTotem ? "tipo-destino" : "tipo-origem"}`}
              >
                {modoTotem ? "DESTINO" : "ORIGEM"}
              </span>

              <span className="card-numero">
                #{String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="card-titulo">
              <span className="card-subtitulo">
                {modoTotem ? "DE ONDE VOCÊ ESTÁ" : "LOCAL IDENTIFICADO"}
              </span>

              <h2>{local.nome || local.label || local.id}</h2>
            </div>

            {modoTotem ? (
              <div className="card-trajeto">
                <div className="trajeto-ponto">
                  <span className="ponto-origem" />
                  <div>
                    <small>ORIGEM FIXA</small>
                    <strong>{origem.nome}</strong>
                  </div>
                </div>

                <div className="trajeto-linha" />

                <div className="trajeto-ponto">
                  <span className="ponto-destino" />
                  <div>
                    <small>DESTINO ESCOLHIDO</small>
                    <strong>{local.nome || local.label || local.id}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-descricao">
                <span className="descricao-icone">⌖</span>
                <p>
                  Este código identifica este local como o ponto de partida da
                  sua navegação.
                </p>
              </div>
            )}

            <div className="qrcode-container">
              <QRCodeSVG
                value={gerarUrlQR(local)}
                size={280}
                level="H"
                includeMargin
              />
            </div>

            <div className="card-instrucao">
              <strong>
                {modoTotem
                  ? "ESCANEIE PARA IR ATÉ AQUI"
                  : "ESCANEIE PARA DEFINIR SUA ORIGEM"}
              </strong>

              <p>
                {modoTotem
                  ? `O sistema calculará a rota de ${origem.nome} até este local.`
                  : "Sua localização será preenchida automaticamente no sistema."}
              </p>
            </div>

            <footer className="card-rodape">
              <span>UFC · CAMPUS DE RUSSAS</span>
              <span>NAVEGAÇÃO INDOOR</span>
            </footer>
          </article>
        ))}
      </section>

      <footer className="qrcodes-footer">
        <span>UFC · Universidade Federal do Ceará</span>
        <span>Sistema de Navegação Indoor · Campus de Russas</span>
      </footer>
    </main>
  );
}

export default QRCodeLabels;
