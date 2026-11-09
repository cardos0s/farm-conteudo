---
parte: 4
titulo: Confiabilidade e tolerância a falhas
original: Reliability and Fault Tolerance
---

Num sistema distribuído, falhar é rotina: um disco morre, uma dependência fica lenta, a rede perde pacotes, um cliente entra em loop e dispara milhares de requisições. A pergunta de design não é "e se falhar?", e sim "quando falhar, quanto do sistema vai junto?". Os capítulos 32 a 37 são as defesas do dia a dia: limitar o que entra, parar de chamar quem está quebrado, isolar recursos, repetir com calma, garantir que repetir não faça estrago e perceber quando um nó morreu.

Os capítulos 38 a 40 sobem um degrau: como vários nós concordam sobre quem manda e como manter correta uma operação que atravessa vários serviços ou bancos. Repare como os padrões se apoiam: retry só é seguro com idempotência, circuit breaker e backoff impedem que os retries virem um ataque, e é a falta de heartbeats que dispara a eleição de um novo líder.
