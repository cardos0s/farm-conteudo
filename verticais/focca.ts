import type { Vertical } from "../src/core/vertical";

const focca: Vertical = {
  id: "focca",
  app: {
    nome: "Focca",
    descricao:
      "App de estudos com Pomodoro: você coloca o edital e a data da prova, e ele monta seu cronograma e o tempo de estudo de cada dia.",
    // TODO: link real (loja, landing ou link inteligente)
    link: "https://focca.app.br",
  },
  nicho: "Estudos para vestibular, ENEM, concursos e faculdade",
  publico: "Vestibulandos, concurseiros e universitários que querem estudar com constância e chegar preparados na prova.",
  tom: "Encorajador e organizado, como um colega que já passou e ensina o caminho. Frases curtas, nada de coach motivacional vazio.",
  regras: [
    "Nunca prometer aprovação nem usar números de aprovação sem fonte.",
    "Datas de provas e editais só com fonte oficial; se não houver confirmação, dizer que é previsão.",
    "Não falar de idiomas: o Focca não é app de idiomas.",
    "Nada de culpa ou pressão tóxica sobre quem estuda.",
  ],
  fontes: {
    rss: [
      { nome: "Agência Brasil Educação", url: "https://agenciabrasil.ebc.com.br/rss/educacao/feed.xml" },
      { nome: "JC Concursos", url: "https://jcconcursos.com.br/feed" },
      { nome: "Estratégia Concursos", url: "https://www.estrategiaconcursos.com.br/blog/feed/" },
      { nome: "Estratégia Vestibulares", url: "https://vestibulares.estrategia.com/portal/feed/" },
    ],
    dados: ["calendario-provas"],
    provas: [
      // Só datas confirmadas em edital. Adicione vestibulares e concursos conforme saírem os editais.
      { nome: "ENEM 2026 (1º dia)", data: "2026-11-08" }, // Edital Inep nº 64/2026
      { nome: "ENEM 2026 (2º dia)", data: "2026-11-15" },
    ],
  },
  marca: {
    nomeApp: "Focca",
    arroba: "@focca.app", // TODO: @ real no Instagram
    cores: {
      fundo: "#14123A",
      superficie: "#221F55",
      primaria: "#FF6B57",
      secundaria: "#7BE0C3",
      texto: "#FFFFFF",
      suave: "#B7B4E0",
    },
    fonteTitulo: "'Poppins', 'Montserrat', 'Helvetica Neue', Arial, sans-serif",
    fonteTexto: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    elemento: "pomodoro",
  },
  volume: { videosPorDia: 1, diaNewsletter: 0 },
  newsletter: {
    nome: "Foco Total",
    descricao: "Datas de provas, técnicas de estudo e editais abertos, todo domingo.",
  },
  hashtags: ["#ENEM", "#concursos", "#vestibular", "#estudos", "#pomodoro"],
};

export default focca;
