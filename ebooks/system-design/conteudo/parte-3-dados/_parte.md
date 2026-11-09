---
parte: 3
titulo: Bancos de dados e armazenamento
original: Database and Storage Internals
---

Servidores de aplicação sem estado (cap. 8) se multiplicam com um clique; os dados, não. Mais cedo ou mais tarde, todo sistema que cresce esbarra no banco. Esta parte abre o capô do armazenamento. Primeiro, como espalhar os dados por várias máquinas: dividindo (sharding, cap. 23), copiando (replicação, cap. 24) e decidindo quem guarda cada chave sem embaralhar tudo quando o cluster muda de tamanho (hashing consistente, cap. 25).

Depois, o que acontece dentro de um único nó: as estruturas que tornam a busca rápida (B-Tree e LSM-Tree, cap. 26), o log que protege cada escrita contra quedas (WAL, cap. 27) e o filtro que poupa idas inúteis ao disco (Bloom filter, cap. 30). Por fim, decisões de modelagem que aparecem em toda entrevista: normalizar ou duplicar (cap. 28), usar um banco ou vários (cap. 29) e buscar por semelhança em vez de igualdade, com bancos vetoriais (cap. 31).
