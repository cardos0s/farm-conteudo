# Apêndice A — Glossário {#apendice-a}

**Abstenção**: o sistema responder que não encontrou a informação, em vez de arriscar uma resposta.

**Alucinação**: conteúdo falso ou sem apoio apresentado como verdadeiro.

**ANN (vizinhos mais próximos aproximados)**: busca que examina só parte da base, aceitando perder alguns vizinhos em troca de velocidade.

**Aprendizado autossupervisionado**: treino com rótulos construídos a partir dos próprios dados.

**Aprendizado em contexto**: seguir instruções e exemplos do prompt sem mudar os pesos.

**Atenção cruzada**: mecanismo pelo qual uma rede consulta outra fonte (ex.: o texto, num modelo de difusão).

**Batching contínuo**: reorganizar o lote a cada passo de geração; quem termina sai, quem espera entra.

**Bi-encoder**: modelo que codifica consulta e documento separadamente em vetores.

**BM25**: fórmula clássica de busca por palavras (IDF, saturação da frequência, normalização pelo tamanho).

**Bradley-Terry**: modelo de preferência em que $P(A \succ B) = \sigma(r_A - r_B)$.

**Chunking**: dividir documentos em pedaços para indexação e busca.

**Classifier-free guidance**: combinar previsões com e sem condição para seguir melhor o texto, em modelos de difusão.

**Cross-encoder**: modelo que lê consulta e documento juntos e dá uma nota de relevância.

**Decodificação com restrições**: mascarar tokens inválidos a cada passo, para a saída seguir uma gramática.

**Difusão**: geração por remoção gradual de ruído, a partir de ruído puro.

**DPO**: otimização direta de preferências, sem modelo de recompensa nem RL.

**Embedding**: vetor que representa o significado de um texto, imagem ou outro dado.

**Entropia cruzada**: perda de classificação; no pré-treino, a média de $-\log p$ do token certo.

**Exposure bias**: descompasso entre treinar com o texto verdadeiro e gerar a partir das próprias escolhas.

**Factualidade**: estar correto em relação ao mundo.

**Few-shot**: incluir alguns exemplos de entrada e saída no prompt.

**Fundamentação (groundedness)**: estar apoiado em fontes fornecidas e verificáveis.

**GRPO**: algoritmo de RL que compara cada resposta com a média do seu grupo.

**HNSW**: índice ANN baseado num grafo hierárquico de vizinhos.

**InfoNCE**: perda contrastiva; a probabilidade de escolher o par certo entre candidatos.

**IVF**: índice ANN que agrupa vetores em clusters e busca só nos mais próximos.

**Janela de contexto**: o máximo de tokens que o modelo processa numa chamada, entrada mais saída.

**KV cache**: vetores K e V guardados por token e camada para não recalcular o contexto na geração.

**LoRA**: adaptação de posto baixo; $W' = W + \frac{\alpha}{r}BA$ com W congelada.

**MCP**: Model Context Protocol, padrão aberto para conectar aplicações de IA a ferramentas e dados.

**MRR / nDCG**: métricas de ranking que valorizam acertos no topo.

**PEFT**: fine-tuning eficiente em parâmetros, treinando uma pequena fração deles.

**Perplexidade**: $e^{\text{perda}}$; quantas opções o modelo "hesita" em média.

**PQ (quantização de produto)**: compressão de vetores em códigos curtos por pedaços.

**Pré-treino**: prever o próximo token em grandes volumes de texto; a base das capacidades do modelo.

**Prefill / decode**: processar o prompt inteiro / gerar um token por passo.

**Prompt caching**: reaproveitar o processamento de um prefixo repetido do prompt.

**QLoRA**: LoRA sobre um modelo base quantizado em 4 bits.

**Quantização**: representar números do modelo com menos bits, usando escalas.

**RAG**: geração aumentada por recuperação; buscar trechos e colocá-los no contexto antes de responder.

**Recall@k**: fração dos itens relevantes (ou dos vizinhos verdadeiros) entre os k primeiros resultados.

**Reranking**: reordenar candidatos com um modelo mais preciso.

**Reward hacking**: a política explora falhas do modelo de recompensa em vez de melhorar de verdade.

**RLHF**: aprendizado por reforço com feedback humano.

**RRF**: Reciprocal Rank Fusion; fusão de rankings por $1/(k + \text{posição})$.

**Saída estruturada**: resposta que segue um formato definido, como JSON com esquema.

**SFT**: ajuste supervisionado com pares instrução → resposta.

**Teacher forcing**: treinar com o texto verdadeiro como contexto em todas as posições.

**Temperatura**: divisor dos logits antes do softmax; controla a variedade da amostragem.

**Token**: pedaço de texto (parte de palavra) que o modelo processa.

**Top-p (nucleus)**: amostrar entre o menor conjunto de tokens cuja probabilidade soma p.

# Apêndice B — Plano de estudo de três semanas {#apendice-b}

Cerca de uma hora por dia. Em todos os dias: 10 minutos de flashcards no Anki antes de começar (importe o arquivo de flashcards do livro).

```text
 SEMANA 1 — COMO OS MODELOS APRENDEM
 dia 1   Cap. 1 Pré-treino; rode o modelo bigrama
 dia 2   Cap. 2 Autossupervisionado; mexa no τ da InfoNCE
 dia 3   Cap. 3 Geração; teste temperaturas e top-p
 dia 4   Cap. 4 RLHF; mude o viés de tamanho e veja os pesos
 dia 5   Cap. 5 LoRA; treine com posto 2 e com posto 16
 dia 6   Cap. 6 Difusão; mude o número de passos T
 dia 7   revisão: refaça os "Teste-se" de 1 a 6 sem olhar

 SEMANA 2 — COMO OS MODELOS RODAM E USAM CONTEXTO
 dia 8   Cap. 7 Inferência; calcule o KV cache de 3 modelos
 dia 9   Cap. 8 Quantização; compare grupos de 32, 64 e 128
 dia 10  Cap. 9 Janela de contexto; monte um teste de posição
 dia 11  Cap. 10 Saídas estruturadas; adicione um campo novo
         ao decodificador de brinquedo
 dia 12  Cap. 11 Aprendizado em contexto; escreva um prompt
         few-shot para uma tarefa sua
 dia 13  Cap. 12 Chunking; divida um documento seu e leia
         os pedaços
 dia 14  revisão: refaça os "Teste-se" de 7 a 12

 SEMANA 3 — BUSCA, FUNDAMENTAÇÃO E FERRAMENTAS
 dia 15  Cap. 13 Busca vetorial; varie nprobe e meça recall
 dia 16  Cap. 14 Busca híbrida; acrescente documentos à base
         do BM25 e teste consultas suas
 dia 17  Cap. 15 Reranking; calcule MRR e nDCG à mão
 dia 18  Cap. 16 Alucinação; escreva 3 respostas com
         citações erradas e veja o verificador pegar
 dia 19  Cap. 17 MCP; crie uma ferramenta nova no servidor
 dia 20  projeto: monte um mini-RAG juntando os Caps. 12-16
 dia 21  revisão geral: explique a "máquina inteira" da
         Introdução em voz alta, sem consultar
```

# Apêndice C — Correspondência com a newsletter {#apendice-c}

A lista de conceitos segue a Parte 2 da série *"64 AI Engineering Concepts, Clearly Explained"*, de Neo Kim (newsletter System Design One). A ordem dos capítulos foi reorganizada para que cada conceito venha depois dos que ele usa.

| Nº na newsletter | Conceito | Capítulo deste livro |
|---|---|---|
| 18 | Reinforcement Learning from Human Feedback | [4](#cap-04) |
| 19 | Pretraining | [1](#cap-01) |
| 20 | Vector Search and Approximate Nearest Neighbors | [13](#cap-13) |
| 21 | In-Context Learning | [11](#cap-11) |
| 22 | Hallucination, Factuality and Grounding | [16](#cap-16) |
| 23 | Quantization | [8](#cap-08) |
| 24 | Context Windows and Long-Context Modeling | [9](#cap-09) |
| 25 | Structured Outputs and Constrained Decoding | [10](#cap-10) |
| 26 | Model Context Protocol | [17](#cap-17) |
| 27 | Parameter-Efficient Fine-Tuning | [5](#cap-05) |
| 28 | Diffusion Models | [6](#cap-06) |
| 29 | Autoregressive Generation and Next-Token Prediction | [3](#cap-03) |
| 30 | Self-Supervised Learning | [2](#cap-02) |
| 31 | Inference | [7](#cap-07) |
| 32 | Retrieval Reranking | [15](#cap-15) |
| 33 | Hybrid Retrieval | [14](#cap-14) |
| 34 | Chunking and Document Segmentation | [12](#cap-12) |

# Apêndice D — Referências {#apendice-d}

## Fonte da lista de conceitos

- Neo Kim. *64 AI Engineering Concepts, Clearly Explained*, Parte 2. Newsletter System Design One. <https://newsletter.systemdesign.one/p/advanced-ai-concepts-explained>

## Pré-treino e aprendizado autossupervisionado

- Vaswani et al., 2017. *Attention Is All You Need.*
- Radford et al., 2018 e 2019. Os trabalhos dos modelos GPT e GPT-2.
- Devlin et al., 2018. *BERT.*
- Raffel et al., 2019. *T5: Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer.*
- Kaplan et al., 2020. *Scaling Laws for Neural Language Models.*
- Hoffmann et al., 2022. *Training Compute-Optimal Large Language Models* (Chinchilla).
- Chen et al., 2020. *SimCLR.* Radford et al., 2021. *CLIP.* He et al., 2021. *Masked Autoencoders.*
- van den Oord et al., 2018. *Representation Learning with Contrastive Predictive Coding* (InfoNCE).

## Geração e pós-treino

- Holtzman et al., 2019. *The Curious Case of Neural Text Degeneration* (top-p).
- Ouyang et al., 2022. *Training language models to follow instructions with human feedback* (InstructGPT).
- Schulman et al., 2017. *Proximal Policy Optimization.*
- Bai et al., 2022. *Constitutional AI.*
- Rafailov et al., 2023. *Direct Preference Optimization.*
- Shao et al., 2024. *DeepSeekMath* (GRPO).
- Hu et al., 2021. *LoRA.* Dettmers et al., 2023. *QLoRA.* Houlsby et al., 2019. *Parameter-Efficient Transfer Learning for NLP* (adapters).

## Difusão

- Ho et al., 2020. *Denoising Diffusion Probabilistic Models.*
- Song et al., 2020. *Denoising Diffusion Implicit Models.*
- Ho e Salimans, 2022. *Classifier-Free Diffusion Guidance.*
- Rombach et al., 2022. *High-Resolution Image Synthesis with Latent Diffusion Models.*
- Peebles e Xie, 2023. *Scalable Diffusion Models with Transformers* (DiT).
- Lipman et al., 2022. *Flow Matching for Generative Modeling.* Liu et al., 2022. *Rectified Flow.*

## Inferência, quantização e contexto

- Kwon et al., 2023. *PagedAttention* (vLLM).
- Frantar et al., 2022. *GPTQ.* Lin et al., 2023. *AWQ.* Dettmers et al., 2022. *LLM.int8().*
- Liu et al., 2023. *Lost in the Middle: How Language Models Use Long Contexts.*
- Peng et al., 2023. *YaRN.*
- Leviathan et al., 2023. *Fast Inference from Transformers via Speculative Decoding.*

## Busca e RAG

- Lewis et al., 2020. *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.*
- Robertson e Zaragoza, 2009. *The Probabilistic Relevance Framework: BM25 and Beyond.*
- Cormack, Clarke e Büttcher, 2009. *Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods.*
- Malkov e Yashunin, 2016. *HNSW.* Jégou et al., 2011. *Product Quantization for Nearest Neighbor Search.*
- Khattab e Zaharia, 2020. *ColBERT.* Formal et al., 2021. *SPLADE.*
- Nogueira e Cho, 2019. *Passage Re-ranking with BERT.*
- Anthropic, 2024. *Introducing Contextual Retrieval* (artigo técnico).

## Saídas estruturadas e MCP

- Willard e Louf, 2023. *Efficient Guided Generation for Large Language Models* (Outlines).
- Especificação e documentação do Model Context Protocol: <https://modelcontextprotocol.io>
