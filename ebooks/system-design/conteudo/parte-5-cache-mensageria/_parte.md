---
parte: 5
titulo: Cache e mensageria
original: Caching and Messaging
---

Depois de escalar e de sobreviver a falhas, sobram duas ferramentas que aparecem em quase todo design: o cache, que evita refazer trabalho, e a mensageria, que evita esperar por ele. O cache guarda perto de quem lê os dados mais pedidos e corta a latência e a carga do banco. A mensageria põe uma fila ou um tópico entre quem produz e quem processa, para que cada lado escale e falhe no próprio ritmo.

Os capítulos 41 a 43 tratam do cache: por que ele funciona, como mantê-lo em sintonia com o banco nas leituras e nas escritas e quem sai quando ele enche. Os capítulos 44 a 46 tratam da mensageria: a fila ponto a ponto, que distribui trabalho; o pub/sub, que distribui eventos; e a dead letter queue, que guarda as mensagens que falham. As duas famílias cobram um preço parecido: dados que podem chegar velhos, duplicados ou fora de ordem.
