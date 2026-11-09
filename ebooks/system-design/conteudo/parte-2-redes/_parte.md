---
parte: 2
titulo: Redes e comunicação
original: Networking and Communication
---

Na Parte 1, o sistema ganhou forma: várias instâncias, serviços separados, estado guardado fora dos servidores. Agora a pergunta é como essas peças conversam. Toda requisição faz uma viagem. O DNS (cap. 16) traduz o nome em endereço, uma CDN (cap. 15) responde o que dá para responder perto do usuário, e o resto passa por proxies reversos, API gateways e load balancers (caps. 11 a 14), que decidem qual servidor atende.

A segunda metade desce um nível, até os protocolos que carregam as mensagens: TCP e UDP (cap. 17), HTTP/2 e HTTP/3 (cap. 18), gRPC e REST (cap. 19). Depois vêm as formas de o servidor avisar o cliente sem esperar a pergunta, com WebSocket, SSE e long polling (caps. 20 e 21), e o protocolo gossip (cap. 22), que espalha informação entre os nós de um cluster sem coordenador central. Numa entrevista, é esta parte que vira as caixas e as setas do seu desenho.
