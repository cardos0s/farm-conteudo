import type { Vertical } from "../src/core/vertical";

const rebanho: Vertical = {
  id: "rebanho",
  app: {
    nome: "Rebanho",
    // TODO: descrição oficial do app em uma frase
    descricao: "App de gestão para pecuaristas: controle do rebanho, pesagens e custos sem planilha.",
    // TODO: link real (loja, landing ou link inteligente)
    link: "https://rebanho.app.br",
  },
  nicho: "Pecuária de corte e agronegócio",
  publico: "Pecuaristas, gestores de fazenda e técnicos do agro que querem decidir com número na mão.",
  tom: "Respeitoso, prático e confiável, como um técnico de campo experiente. Linguagem simples, sem jargão de mercado financeiro.",
  regras: [
    "Nunca recomendar compra ou venda de gado, nem dar previsão de preço como certeza.",
    "Toda cotação vem com praça, data e fonte.",
    "Nada de sensacionalismo com clima ou mercado.",
    "Sem posicionamento político-partidário.",
  ],
  fontes: {
    rss: [
      { nome: "Canal Rural Pecuária", url: "https://www.canalrural.com.br/pecuaria/feed/" },
      { nome: "Giro do Boi", url: "https://girodoboi.canalrural.com.br/feed/" },
      { nome: "Canal Rural", url: "https://www.canalrural.com.br/feed/" },
    ],
    dados: ["open-meteo"],
    cidades: [
      { nome: "Campo Grande (MS)", lat: -20.4697, lon: -54.6201 },
      { nome: "Cuiabá (MT)", lat: -15.601, lon: -56.0974 },
      { nome: "Goiânia (GO)", lat: -16.6869, lon: -49.2648 },
      { nome: "Araçatuba (SP)", lat: -21.2089, lon: -50.4328 },
      { nome: "Marabá (PA)", lat: -5.3686, lon: -49.1178 },
    ],
  },
  marca: {
    nomeApp: "Rebanho",
    arroba: "@rebanho.app", // TODO: @ real no Instagram
    cores: {
      fundo: "#F4EFE6",
      superficie: "#FFFFFF",
      primaria: "#2F5D3A",
      secundaria: "#B5651D",
      texto: "#1F2A1F",
      suave: "#6B6F5E",
    },
    fonteTitulo: "'Roboto Slab', 'Rockwell', Georgia, serif",
    fonteTexto: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    elemento: "cerca",
  },
  volume: { videosPorDia: 1, diaNewsletter: 1 },
  newsletter: {
    nome: "Porteira",
    descricao: "Mercado do boi, clima e gestão da fazenda, toda segunda-feira.",
  },
  hashtags: ["#pecuaria", "#agro", "#boigordo", "#pecuariadecorte"],
};

export default rebanho;
