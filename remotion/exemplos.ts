import cockpit from "../verticais/cockpit";
import focca from "../verticais/focca";
import rebanho from "../verticais/rebanho";
import type { PropsReel } from "../src/core/roteiro";

// Roteiros de exemplo para o estúdio e para o teste de render. Os números são ilustrativos.

export const exemplos: Record<string, PropsReel> = {
  focca: {
    marca: focca.marca,
    roteiro: {
      cenas: [
        { tipo: "abertura", chamada: "Faltam poucos dias para o ENEM", subtitulo: "Dá tempo de organizar a reta final", duracaoSeg: 3 },
        { tipo: "contagem", titulo: "ENEM 2026", dias: 11, rotulo: "o 1º dia de prova", duracaoSeg: 4 },
        {
          tipo: "grafico",
          titulo: "Um dia de estudo em blocos Pomodoro",
          unidade: "minutos",
          pontos: [
            { rotulo: "Bloco 1", valor: 25 },
            { rotulo: "Pausa", valor: 5 },
            { rotulo: "Bloco 2", valor: 25 },
            { rotulo: "Pausa", valor: 5 },
            { rotulo: "Bloco 3", valor: 25 },
          ],
          duracaoSeg: 5,
        },
        { tipo: "noticia", titulo: "Revise, não comece do zero", texto: "Na reta final, priorize os temas que mais caem e refaça questões que você errou.", fonte: "Exemplo", duracaoSeg: 5 },
        { tipo: "encerramento", cta: "Coloque a data da sua prova e receba o cronograma pronto", duracaoSeg: 3 },
      ],
    },
  },
  cockpit: {
    marca: cockpit.marca,
    roteiro: {
      cenas: [
        { tipo: "abertura", chamada: "A briga pelo título esquentou", subtitulo: "Classificação de pilotos", duracaoSeg: 3 },
        {
          tipo: "ranking",
          titulo: "Top 3 do campeonato",
          itens: [
            { nome: "Piloto A", valor: "320 pts" },
            { nome: "Piloto B", valor: "305 pts" },
            { nome: "Piloto C", valor: "288 pts" },
          ],
          duracaoSeg: 5,
        },
        { tipo: "contagem", titulo: "Próximo GP", dias: 6, rotulo: "a largada", duracaoSeg: 3 },
        { tipo: "encerramento", cta: "Resultados e estatísticas de toda corrida no app", duracaoSeg: 3 },
      ],
    },
  },
  rebanho: {
    marca: rebanho.marca,
    roteiro: {
      cenas: [
        { tipo: "abertura", chamada: "Chuva volta ao Centro-Oeste", subtitulo: "Previsão para os próximos 7 dias", duracaoSeg: 3 },
        {
          tipo: "grafico",
          titulo: "Chuva prevista em 7 dias",
          unidade: "mm",
          pontos: [
            { rotulo: "Campo Grande", valor: 42 },
            { rotulo: "Cuiabá", valor: 61 },
            { rotulo: "Goiânia", valor: 35 },
            { rotulo: "Araçatuba", valor: 18 },
          ],
          duracaoSeg: 5,
        },
        { tipo: "noticia", titulo: "Pasto deve reagir", texto: "Com a umidade, a rebrota acelera e a oferta de forragem melhora nas próximas semanas.", fonte: "Exemplo", duracaoSeg: 5 },
        { tipo: "encerramento", cta: "Controle pesagens e custos do seu rebanho no app", duracaoSeg: 3 },
      ],
    },
  },
};
