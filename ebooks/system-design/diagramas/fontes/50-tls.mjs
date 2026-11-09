// Capítulo 50 — Handshake TLS: o TLS 1.3 completo em 1 RTT.
export default (d) => {
  d.tela(720, 396).titulo(
    "Handshake do TLS 1.3 em 1 RTT",
    "Diagrama de sequência entre cliente e servidor, com o tempo correndo para baixo. O cliente envia o ClientHello com as cifras aceitas e a sua key_share. O servidor responde com o ServerHello e a sua key_share e, já cifrados, o certificado, o CertificateVerify e o Finished. Entre a saída do ClientHello e a chegada dessa resposta passa 1 RTT. O cliente confere o certificado, calcula as chaves e envia o seu Finished junto com a primeira requisição HTTP, já cifrados, e daí em diante os dados da aplicação trafegam cifrados nos dois sentidos. Mensagens em preto vão em claro; em verde, cifradas. No TLS 1.2, a mesma conversa levava 2 RTT antes do primeiro dado.",
  );

  const cli = 150;
  const srv = 590;
  d.etiqueta(cli, 46, "cliente", { tom: "azul", tam: 16 });
  d.etiqueta(srv, 46, "servidor", { tom: "azul", tam: 16 });
  d.linha([[cli, 66], [cli, 316]], { cor: "cinza", tracejado: true, espessura: 1.4 });
  d.linha([[srv, 66], [srv, 316]], { cor: "cinza", tracejado: true, espessura: 1.4 });

  // 1º voo: o cliente já manda a sua parte da troca de chaves
  d.seta([cli, 118], [srv, 130], { rotulo: "ClientHello\ncifras aceitas + key_share", desloc: 27, tamRotulo: 16 });

  // 2º voo: do certificado em diante, tudo cifrado
  d.seta([srv, 180], [cli, 192], {
    rotulo: "ServerHello + key_share\n*{certificado + CertificateVerify + Finished}",
    desloc: -27,
    tamRotulo: 16,
    destaque: "verde",
  });

  // o cliente fecha o handshake e já manda dados
  d.texto(cli - 16, 222, "confere o\ncertificado\ne calcula\nas chaves", { ancora: "end", tam: 16, cor: "cinza" });
  d.seta([cli, 238], [srv, 250], { rotulo: "*{Finished + requisição HTTP}", desloc: 17, tamRotulo: 16, cor: "verde", destaque: "verde" });
  d.seta([cli, 294], [srv, 294], { rotulo: "*{dados da aplicação}", desloc: 17, tamRotulo: 16, cor: "verde", destaque: "verde", duasPontas: true });

  // 1 RTT: da saída do ClientHello à chegada da resposta
  d.linha([[cli - 22, 118], [cli - 30, 118], [cli - 30, 192], [cli - 22, 192]], { cor: "violeta", espessura: 2 });
  d.texto(cli - 76, 161, "1 RTT", { ancora: "middle", tam: 20, cor: "violeta" });

  // legenda
  d.texto(24, 350, "preto: vai em claro  ·  *{verde: já cifrado}", { tam: 16, destaque: "verde" });
  d.texto(24, 376, "No TLS 1.2, a mesma conversa levava 2 RTT antes do primeiro dado.", { tam: 16, cor: "cinza" });
};
