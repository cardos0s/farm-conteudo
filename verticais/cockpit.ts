import type { Vertical } from "../src/core/vertical";

const cockpit: Vertical = {
  id: "cockpit",
  app: {
    nome: "Cockpit",
    // TODO: descrição oficial do app em uma frase
    descricao: "App para quem acompanha automobilismo e F1: calendário, resultados e estatísticas na palma da mão.",
    // TODO: link real (loja, landing ou link inteligente)
    link: "https://cockpit.app.br",
  },
  nicho: "Automobilismo e Fórmula 1",
  publico: "Fãs brasileiros de F1 e automobilismo, de quem assiste toda corrida a quem quer entender estratégia e números.",
  tom: "Empolgado e direto, como um amigo que entende muito de corrida. Usa números para contar histórias. Gírias de paddock com moderação.",
  regras: [
    "Nunca usar, descrever ou sugerir imagens, vídeos ou logotipos oficiais da F1/FOM; só tipografia, gráficos e dados.",
    "Nunca inventar tempos de volta, posições ou declarações; todo número vem da fonte.",
    "Não tratar rumor como fato: rumor é sempre identificado como rumor e com a fonte.",
    "Sem torcida declarada por piloto ou equipe.",
  ],
  fontes: {
    rss: [
      { nome: "Autoracing", url: "https://www.autoracing.com.br/feed/" },
      { nome: "F1Mania", url: "https://www.f1mania.net/feed/" },
      { nome: "RaceFans (inglês)", url: "https://www.racefans.net/feed/" },
    ],
    dados: ["jolpica"],
  },
  marca: {
    nomeApp: "Cockpit",
    arroba: "@cockpit.app", // TODO: @ real no Instagram
    cores: {
      fundo: "#0B0D12",
      superficie: "#171B24",
      primaria: "#E10600",
      secundaria: "#F5F5F5",
      texto: "#FFFFFF",
      suave: "#9AA3B2",
    },
    fonteTitulo: "'Archivo Black', 'Arial Black', Impact, sans-serif",
    fonteTexto: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    elemento: "zebra",
  },
  volume: { videosPorDia: 1, diaNewsletter: 2 },
  newsletter: {
    nome: "Box Box",
    descricao: "O resumo semanal da F1 em números, sem enrolação.",
  },
  hashtags: ["#F1", "#Formula1", "#automobilismo", "#F1Brasil"],
};

export default cockpit;
