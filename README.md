# 🗺️ Map UFC — Sistema de Navegação Interna

Sistema web de navegação interna desenvolvido para o **Campus da Universidade Federal do Ceará (UFC) em Russas**, com o objetivo de auxiliar estudantes, servidores e visitantes a localizar ambientes e encontrar caminhos dentro da instituição.

A aplicação utiliza **Teoria dos Grafos** e o **algoritmo de Dijkstra** para calcular rotas entre diferentes pontos do campus, apresentando o percurso em uma representação tridimensional interativa.

🔗 **Demonstração:** https://mapa-ufc-russas.vercel.app/

---

## 📌 Sobre o projeto

O crescimento da estrutura física do campus e a circulação de estudantes, servidores e visitantes tornam cada vez mais importante facilitar a localização dos diferentes ambientes da universidade.

O Map UFC busca solucionar essa dificuldade por meio de uma aplicação web que permite selecionar um ponto de origem e um destino, calcular o caminho de menor distância e visualizar o percurso em um mapa tridimensional simplificado do campus.

O sistema oferece duas maneiras de definir os pontos de navegação:

- **Seleção manual:** o usuário escolhe a origem e o destino diretamente na interface.
- **Leitura de QR Codes:** códigos instalados em pontos estratégicos permitem identificar a localização do usuário. Também existem painéis com QR Codes individuais para os destinos, permitindo iniciar uma navegação a partir de uma origem previamente definida.

## ✨ Funcionalidades

- 🏫 **Mapa tridimensional:** representação visual simplificada da estrutura física do Campus da UFC em Russas.
- 📍 **Seleção de origem e destino:** definição manual dos pontos de navegação.
- 🧭 **Cálculo de rotas:** utilização do algoritmo de Dijkstra para encontrar o caminho de menor custo.
- 🔵 **Visualização do percurso:** destaque visual da rota calculada no mapa 3D.
- 🚶 **Animação da navegação:** representação do deslocamento ao longo do percurso selecionado.
- 📱 **Identificação por QR Code:** leitura de códigos para definir automaticamente a origem da navegação.
- 🏷️ **Painéis de destinos:** disponibilização de QR Codes associados a diferentes ambientes, permitindo selecionar um destino a partir de uma localização fixa.
- 🔄 **Diferentes formas de utilização:** possibilidade de utilizar a navegação manualmente ou por meio dos códigos QR.

## 🧠 Fundamentação computacional

### Teoria dos Grafos

A estrutura física do campus é representada computacionalmente por um grafo ponderado:

- **Vértices:** representam os ambientes e pontos relevantes para a navegação.
- **Arestas:** representam as conexões e possibilidades de deslocamento entre os pontos.
- **Pesos:** representam as distâncias associadas aos caminhos entre os vértices.

Essa modelagem permite representar a circulação interna do campus de maneira estruturada, independentemente da representação visual utilizada na interface.

### Algoritmo de Dijkstra

O cálculo das rotas é realizado utilizando o algoritmo de Dijkstra, responsável por encontrar o caminho de menor custo entre dois vértices de um grafo ponderado com pesos não negativos.

No Map UFC, o algoritmo utiliza as distâncias associadas às conexões para determinar o percurso entre a origem e o destino selecionados.

Após o cálculo, a sequência de vértices obtida é utilizada para representar visualmente a rota no mapa tridimensional.

### Identificação por QR Codes

O sistema também utiliza códigos QR como mecanismo de identificação dos pontos de navegação.

Existem duas aplicações principais:

1. **QR Code de localização:** instalado em um ponto específico do campus. Ao realizar a leitura, o sistema identifica a origem correspondente àquele local.
2. **Painel de QR Codes de destinos:** instalado em uma localização fixa. Cada código representa um ambiente diferente, permitindo que o usuário escolha seu destino por meio da leitura do código correspondente.

Os QR Codes funcionam como mecanismos de identificação de locais previamente cadastrados, não como sistemas de rastreamento ou posicionamento automático.

## 🛠️ Tecnologias utilizadas

| Tecnologia | Utilização |
|---|---|
| React | Construção da interface e organização dos componentes |
| JavaScript | Implementação da lógica da aplicação |
| Three.js | Renderização e visualização tridimensional do campus |
| Vite | Ambiente de desenvolvimento e build |
| CSS | Estilização e apresentação da interface |
| QR Code | Identificação de origens e seleção de destinos |

## 🏗️ Funcionamento do sistema

O funcionamento da aplicação pode ser dividido em quatro etapas:

1. **Definição dos pontos:** o usuário informa a origem e o destino manualmente ou utiliza os QR Codes disponíveis.
2. **Processamento da rota:** o sistema utiliza a representação do campus em grafo para executar o algoritmo de Dijkstra.
3. **Obtenção do caminho mínimo:** o algoritmo determina a sequência de vértices que representa o percurso de menor custo.
4. **Visualização tridimensional:** a aplicação apresenta o caminho calculado no mapa 3D, permitindo acompanhar visualmente o trajeto.

## 🚀 Como executar o projeto

### Pré-requisitos

- Node.js instalado.
- npm instalado.

### Instalação

Clone o repositório:

```bash
git clone https://github.com/AlanVictorDEV/map-UFC.git
```

Acesse a pasta do projeto:

```bash
cd map-UFC
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse o endereço disponibilizado pelo Vite no terminal.

## 🎓 Contexto acadêmico

Este projeto faz parte do Trabalho de Conclusão de Curso (TCC) em Ciência da Computação da **Universidade Federal do Ceará (UFC) — Campus Russas**.

**Autor:** Alan Victor Soares Vieira

**Orientador:** Prof. Cláubio Landney Bandeira

**Curso:** Bacharelado em Ciência da Computação
