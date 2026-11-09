---
parte: 2
titulo: Redes e comunicação
original: Networking and Communication
---

Na Parte 1, o sistema ganhou forma: várias instâncias, serviços separados, estado fora dos servidores. Agora a pergunta é como essas peças conversam. Toda requisição faz uma viagem. O DNS (cap. 16) traduz o nome em endereço, uma CDN (cap. 15) responde o que puder perto do usuário, e o resto passa por proxies reversos (cap. 13), API gateways (cap. 14) e load balancers (cap. 11), que escolhem com um algoritmo (cap. 12) qual servidor atende.

A segunda metade desce até os protocolos que carregam as mensagens: TCP e UDP (cap. 17), HTTP/2 e HTTP/3 (cap. 18), gRPC e REST (cap. 19). Depois vêm as formas de o servidor avisar o cliente sem esperar a pergunta, com WebSocket e SSE (cap. 20) e long polling (cap. 21), e o protocolo gossip (cap. 22), que espalha informação num cluster sem coordenador central. Numa entrevista, é esta parte que vira as caixas e setas do seu desenho.
