// Plano do ebook "Arquitetura de Software: o guia completo". Uma entrada por capítulo; o arquivo de cada
// capítulo é capitulos/<NN>-<slug>.mjs e exporta `default` com o HTML do corpo (o título e o número
// vêm daqui, para o sumário e as referências cruzadas ficarem sempre certos).

export const titulo = "Arquitetura de Software";
export const subtitulo = "Todos os tipos, quando usar cada um e como usar na prática";

export const partes = [
  { id: "I", titulo: "Antes de escolher", descricao: "O que é arquitetura, os critérios que decidem a escolha e o mapa de todos os tipos." },
  { id: "II", titulo: "O código por dentro", descricao: "Como organizar o código de uma aplicação: camadas, MVC, hexagonal, clean, vertical slice, plugins e pipelines." },
  { id: "III", titulo: "O sistema por fora", descricao: "Em quantas partes o sistema é dividido e como cada parte vai para o ar: do monólito aos microsserviços, serverless e células." },
  { id: "IV", titulo: "Comunicação e dados", descricao: "Como as partes conversam e guardam dados: cliente-servidor, P2P, eventos, CQRS, event sourcing, sagas, atores e dados em grande escala." },
  { id: "V", titulo: "Escolher, combinar e evoluir", descricao: "Comparativo, árvore de decisão, combinações que funcionam, como migrar, anti-padrões e como registrar decisões." },
];

export const capitulos = [
  { n: 1, slug: "por-que-arquitetura", parte: "I", titulo: "Por que arquitetura importa" },
  { n: 2, slug: "criterios", parte: "I", titulo: "Os critérios que decidem a escolha" },
  { n: 3, slug: "mapa", parte: "I", titulo: "O mapa das arquiteturas" },
  { n: 4, slug: "camadas", parte: "II", titulo: "Arquitetura em camadas" },
  { n: 5, slug: "mvc-mvvm", parte: "II", titulo: "MVC, MVP e MVVM" },
  { n: 6, slug: "hexagonal", parte: "II", titulo: "Hexagonal (portas e adaptadores)" },
  { n: 7, slug: "clean-onion", parte: "II", titulo: "Clean Architecture e Onion" },
  { n: 8, slug: "vertical-slice", parte: "II", titulo: "Vertical Slice" },
  { n: 9, slug: "microkernel", parte: "II", titulo: "Microkernel (plugins)" },
  { n: 10, slug: "pipes-filters", parte: "II", titulo: "Pipes and Filters" },
  { n: 11, slug: "monolito", parte: "III", titulo: "Monólito" },
  { n: 12, slug: "monolito-modular", parte: "III", titulo: "Monólito modular" },
  { n: 13, slug: "soa", parte: "III", titulo: "SOA (arquitetura orientada a serviços)" },
  { n: 14, slug: "microsservicos", parte: "III", titulo: "Microsserviços" },
  { n: 15, slug: "serverless", parte: "III", titulo: "Serverless" },
  { n: 16, slug: "micro-frontends", parte: "III", titulo: "Micro-frontends" },
  { n: 17, slug: "celulas", parte: "III", titulo: "Arquitetura em células" },
  { n: 18, slug: "cliente-servidor", parte: "IV", titulo: "Cliente-servidor e N camadas físicas" },
  { n: 19, slug: "peer-to-peer", parte: "IV", titulo: "Peer-to-peer" },
  { n: 20, slug: "eventos", parte: "IV", titulo: "Arquitetura orientada a eventos" },
  { n: 21, slug: "cqrs", parte: "IV", titulo: "CQRS" },
  { n: 22, slug: "event-sourcing", parte: "IV", titulo: "Event Sourcing" },
  { n: 23, slug: "sagas", parte: "IV", titulo: "Sagas e consistência entre serviços" },
  { n: 24, slug: "space-based", parte: "IV", titulo: "Space-based" },
  { n: 25, slug: "atores", parte: "IV", titulo: "Modelo de atores" },
  { n: 26, slug: "dados", parte: "IV", titulo: "Arquiteturas de dados: Lambda, Kappa, Lakehouse e Data Mesh" },
  { n: 27, slug: "comparativo", parte: "V", titulo: "Comparativo geral" },
  { n: 28, slug: "decisao", parte: "V", titulo: "Árvore de decisão: qual usar" },
  { n: 29, slug: "combinacoes", parte: "V", titulo: "Combinações que funcionam" },
  { n: 30, slug: "migrar", parte: "V", titulo: "Como migrar sem parar o sistema" },
  { n: 31, slug: "anti-padroes", parte: "V", titulo: "Anti-padrões" },
  { n: 32, slug: "adrs", parte: "V", titulo: "Registrando decisões: ADRs e revisão" },
  { n: 33, slug: "cola", parte: "V", titulo: "Cola final" },
  { n: 34, slug: "outros-estilos", parte: "V", titulo: "Outros estilos que você vai encontrar", apendice: true },
];

/** Número como aparece no livro: "01".."33", ou "A" para o apêndice. */
export const rotuloDo = (c) => (c.apendice ? "A" : String(c.n).padStart(2, "0"));

export const arquivoDo = (c) => `capitulos/${String(c.n).padStart(2, "0")}-${c.slug}.mjs`;
