---
parte: 1
titulo: Princípios de arquitetura
original: Core Architecture Principles
---

Antes de falar de load balancers, bancos e filas, você precisa do vocabulário que aparece em toda conversa de system design. Esta parte reúne dez princípios que sustentam o resto do livro: como um sistema cresce (cap. 1), o que ele sacrifica quando a rede falha (cap. 2) e no dia a dia (cap. 3), que garantias os dados oferecem (caps. 4 e 7) e como medir e limitar o desempenho (caps. 5 e 6).

Os últimos capítulos tratam de como organizar código e infraestrutura: serviços stateful ou stateless (cap. 8), monólito ou microsserviços (cap. 9) e serverless (cap. 10). As ideias se encadeiam: escalar na horizontal exige serviços stateless; réplicas trazem o dilema entre consistência, disponibilidade e latência; e cada máquina a mais esbarra no gargalo que a Lei de Amdahl prevê. Quase todos os capítulos seguintes voltam a algum destes.
