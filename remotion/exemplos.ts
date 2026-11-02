import cockpit from "../verticais/cockpit";
import focca from "../verticais/focca";
import rebanho from "../verticais/rebanho";
import type { Carrossel } from "../src/core/carrossel";
import type { Marca, PropsReel } from "../src/core/roteiro";

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

// Carrosséis de exemplo, um por marca. Os números também são ilustrativos.

export const exemplosCarrossel: Record<string, { marca: Marca; carrossel: Carrossel }> = {
  focca: {
    marca: focca.marca,
    carrossel: {
      slides: [
        { tipo: "capa", titulo: "5 erros na última semana antes do ENEM", subtitulo: "E o que fazer no lugar de cada um" },
        { tipo: "numero", valor: "6 dias", legenda: "até o 1º dia de prova. Dá para revisar sem atropelo.", fonte: "Exemplo" },
        {
          tipo: "lista",
          titulo: "Evite na reta final",
          itens: ["Começar matéria nova do zero", "Virar a noite estudando", "Fazer simulado todo dia", "Mudar a rotina de sono", "Deixar documentos para a véspera"],
          fonte: null,
        },
        { tipo: "texto", titulo: "Faça no lugar", texto: "Revise os temas que mais caem, refaça as questões que você errou e durma no mesmo horário em que vai acordar no dia da prova.", fonte: null },
        { tipo: "fechamento", titulo: "Reta final é revisão, não maratona", cta: "Monte sua revisão em blocos Pomodoro no Focca" },
      ],
    },
  },
  cockpit: {
    marca: cockpit.marca,
    carrossel: {
      slides: [
        { tipo: "capa", titulo: "Quem ainda pode ser campeão?", subtitulo: "As contas da briga pelo título" },
        {
          tipo: "ranking",
          titulo: "Classificação de pilotos",
          itens: [
            { nome: "Piloto A", valor: "320 pts" },
            { nome: "Piloto B", valor: "305 pts" },
            { nome: "Piloto C", valor: "288 pts" },
          ],
          fonte: "Exemplo",
        },
        { tipo: "numero", valor: "78 pts", legenda: "ainda estão em jogo nas três últimas etapas", fonte: "Exemplo" },
        { tipo: "texto", titulo: "O que o líder precisa", texto: "Se terminar à frente do segundo colocado nas duas próximas corridas, o título fica matematicamente garantido.", fonte: "Exemplo" },
        { tipo: "fechamento", titulo: "Toda conta atualizada após cada corrida", cta: "Acompanhe a classificação ao vivo no Cockpit" },
      ],
    },
  },
  rebanho: {
    marca: rebanho.marca,
    carrossel: {
      slides: [
        { tipo: "capa", titulo: "Onde vai chover nesta semana", subtitulo: "Previsão para as principais praças pecuárias" },
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
          fonte: "Exemplo",
        },
        { tipo: "numero", valor: "61 mm", legenda: "é o maior volume previsto, em Cuiabá", fonte: "Exemplo" },
        {
          tipo: "lista",
          titulo: "O que ajustar no manejo",
          itens: ["Planeje a rotação para aproveitar a rebrota", "Confira o acesso aos piquetes depois da chuva", "Revise o estoque de sal mineral"],
          fonte: null,
        },
        { tipo: "fechamento", titulo: "Chuva boa é pasto na próxima semana", cta: "Controle pesagens e custos do rebanho no app" },
      ],
    },
  },
};
