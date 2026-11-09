// Capítulo 49 — OAuth 2.0 + OIDC: o fluxo Authorization Code com PKCE.
export default (d) => {
  d.tela(720, 460).titulo(
    "Fluxo Authorization Code com PKCE",
    "Diagrama de sequência com quatro participantes: usuário, aplicação (o cliente OAuth), servidor de autorização e API. 1: a aplicação manda o navegador para /authorize com scope=openid e o code_challenge. 2: o usuário faz login e dá o consentimento direto no servidor de autorização; a senha fica lá. 3: o servidor devolve um code à aplicação, por redirect do navegador. 4: a aplicação envia o code e o code_verifier ao servidor, numa chamada direta. O servidor confere se o hash do verifier bate com o challenge. 5: o servidor responde com o access token e, por causa do OIDC, com o ID token. 6: a aplicação chama a API com o access token no cabeçalho Bearer. Setas tracejadas passam pelo navegador; setas contínuas são chamadas diretas. O ID token diz à aplicação quem é o usuário; o access token é só para a API.",
  );

  const usr = 56;
  const app = 200;
  const as = 470;
  const api = 660;
  const FIM = 392;

  // participantes e linhas de vida
  d.pessoa(usr, 40, 48, { rotulo: "usuário" });
  d.etiqueta(app, 50, "aplicação\n(cliente)", { tom: "azul", tam: 16 });
  d.etiqueta(as, 50, "servidor de\nautorização", { tom: "azul", tam: 16 });
  d.etiqueta(api, 50, "API", { tom: "azul", tam: 16 });
  for (const xv of [usr, app, as, api]) {
    d.linha([[xv, 94], [xv, FIM]], { cor: "cinza", tracejado: true, espessura: 1.4 });
  }

  const dir = (x1, x2, y, rotulo, o = {}) => d.seta([x1, y], [x2, y], { rotulo, desloc: o.duas ? 27 : 17, tamRotulo: 16, ...o });
  const esq = (x1, x2, y, rotulo, o = {}) => d.seta([x1, y], [x2, y], { rotulo, desloc: o.duas ? -27 : -17, tamRotulo: 16, ...o });

  // canal da frente: tudo passa pelo navegador
  dir(app, as, 132, "1. /authorize, scope=openid\n+ code_challenge", { duas: true, tracejado: true });
  dir(usr, as, 186, "2. login e consentimento\n(a senha fica aqui)", { duas: true, tracejado: true, posRotulo: 0.66 });
  esq(as, app, 226, "3. *{code}, via navegador", { tracejado: true, destaque: "laranja" });

  // canal de trás: chamada direta
  dir(app, as, 266, "4. *{code} + code_verifier", { destaque: "laranja" });
  d.caixa(482, 230, 162, 70, "confere se\nhash(verifier)\n= challenge", { tom: "amarelo", hachura: "solid", tam: 16 });
  esq(as, app, 320, "5. access token\n+ *{ID token} (OIDC)", { duas: true, destaque: "violeta", cor: "verde", corRotulo: "tinta" });
  dir(app, api, 372, "6. Bearer\naccess token", { duas: true, posRotulo: 0.78 });

  // legenda
  d.texto(24, 424, "tracejado: passa pelo navegador (redirect)  ·  contínuo: chamada direta", { tam: 16, cor: "cinza" });
  d.texto(24, 448, "*{ID token}: diz ao app quem é o usuário  ·  access token: só para a API", { tam: 16, destaque: "violeta" });
};
