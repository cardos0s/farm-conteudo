# Introdução {#introducao}

Um modelo de linguagem treinado é um arquivo. Ele pode ter 16 GB, 140 GB ou quase um terabyte de números, e sozinho não responde a ninguém. Para virar o produto que milhões de pessoas usam, alguém precisa colocar esse arquivo em GPUs, receber requisições pela internet, organizar quem é atendido primeiro, devolver tokens rápido, não estourar a memória, não gastar uma fortuna e continuar funcionando às 2 da manhã de um domingo.

Esse alguém é a pessoa de **engenharia de inferência**.

## O que é engenharia de inferência

Em machine learning existem duas fases bem diferentes:

- **Treinamento**: o modelo aprende. Você mostra trilhões de tokens, calcula o erro, ajusta os pesos. Acontece uma vez (ou poucas vezes), dura semanas e usa milhares de GPUs ao mesmo tempo.
- **Inferência**: o modelo é usado. Alguém manda um prompt, o modelo gera uma resposta. Acontece bilhões de vezes, para sempre, enquanto o produto existir.

O custo do treinamento é grande, mas acontece poucas vezes. O custo da inferência se repete a cada requisição. Para um produto popular, o gasto acumulado com inferência pode passar o de treinamento. Por isso cada ponto percentual de eficiência em inferência vale muito dinheiro.

::: analogia
**Analogia:** treinar um modelo é escrever uma receita depois de anos de testes. Fazer inferência é tocar o restaurante que serve essa receita para milhares de clientes por hora. A receita pode ser genial, mas se a cozinha for desorganizada, o prato chega frio, atrasado e caro. A engenharia de inferência cuida da cozinha.
:::

O trabalho tem três objetivos que brigam entre si:

```text
                     RÁPIDO
              (latência baixa, p99 ok)
                       ▲
                      ╱ ╲
                     ╱   ╲
                    ╱     ╲
                   ╱ você  ╲
                  ╱  vive   ╲
                 ╱   aqui    ╲
                ▼─────────────▼
           BARATO            CONFIÁVEL
    (tokens por dólar)   (não cai, não erra,
                          não trava a fila)
```

Deixar o serviço mais rápido quase sempre custa mais caro: você coloca menos usuários por GPU para cada um ser atendido mais depressa. Deixar mais barato quase sempre deixa mais lento: você enche a GPU de usuários e cada um espera mais. Deixar mais confiável custa capacidade reservada. A profissão inteira é escolher bem onde ficar nesse triângulo e mover o triângulo inteiro para melhor com técnicas novas.

## O dia a dia da função

O post que originou a lista de perguntas deste livro resume bem: quem faz inferência "lê kernels de atenção, dimensiona frotas de GPUs, ajusta schedulers e fica de plantão quando a latência p99 dobra às 2 da manhã". Em termos concretos, uma semana típica pode incluir:

- **Kernel**: descobrir por que a atenção está usando só 40% da banda de memória da GPU e reescrever um pedaço em CUDA ou Triton.
- **Runtime**: ajustar o scheduler do motor de inferência (vLLM, TensorRT-LLM, SGLang ou um motor próprio) para misturar melhor prompts longos e curtos.
- **Modelo**: quantizar um modelo novo para FP8, medir a perda de qualidade e decidir se vale colocar em produção.
- **Sistema**: projetar como 2.000 GPUs recebem os pesos de um modelo novo de 400 GB sem derrubar a rede.
- **Capacidade**: calcular quantas GPUs são necessárias para o lançamento da semana que vem.
- **Operação**: investigar um incidente em que uma GPU com defeito deixava todas as requisições daquele nó lentas.

Não existe uma pessoa que faça tudo isso igualmente bem. As vagas costumam pender para um de três perfis:

| Perfil | Foco | Linguagens e ferramentas |
|---|---|---|
| Kernel / performance | fazer cada operação rodar perto do limite do hardware | CUDA, C++, Triton, Nsight, PTX |
| Runtime / serving | motor de inferência, batching, KV cache, scheduler | Python, C++, PyTorch, vLLM, TensorRT-LLM |
| Infra / plataforma | frota de GPUs, Kubernetes, rede, deploy, confiabilidade | Go, Python, Kubernetes, NCCL, observabilidade |

Este livro cobre os três, porque as entrevistas cobrem os três. Uma vaga de kernel ainda pergunta sobre batching, e uma vaga de infra ainda pergunta por que a inferência é limitada por memória.

## Carreira e salários

Engenharia de inferência é uma das especialidades mais bem pagas em IA hoje. Nas 20 vagas analisadas no levantamento que deu origem às perguntas, as faixas salariais base publicadas iam de cerca de **US$ 129 mil a US$ 685 mil por ano**. A xAI publicou uma faixa única, de US$ 180 mil a US$ 440 mil, para todos os níveis. Esses números são salário base nos Estados Unidos; ações e bônus vêm por cima e muitas vezes são a maior parte da remuneração.

O motivo é simples: uma melhoria de 20% no throughput de uma frota de dezenas de milhares de GPUs economiza dezenas de milhões de dólares por ano. Poucas pessoas sabem fazer isso, e todas as empresas de IA precisam.

## O que as vagas pedem

O mesmo levantamento leu 20 vagas de 16 empresas. As habilidades que mais apareceram:

```text
Habilidade               Vagas (de 20)
─────────────────────────────────────────────────
Python                   █████████  9
CUDA                     █████████  9
PyTorch                  █████████  9
vLLM                     █████████  9
TensorRT-LLM             ████████   8
Kubernetes               ███████    7
C++                      ███████    7
Kernels de GPU           ██████     6
Sistemas distribuídos    ██████     6
Quantização              ██████     6
```

Três padrões apareceram com força:

1. **O KV cache é o recurso escasso.** Os entrevistadores voltam a ele o tempo todo: qual o tamanho, como paginar, como compartilhar, o que fazer quando acaba. Se você só puder estudar um assunto a fundo, estude este. O [Capítulo 6](#cap-06) é inteiro sobre ele.
2. **Designs de batching dominam os processos da Anthropic.** Foram pelo menos oito enunciados relatados sobre batching, APIs de inferência em GPU ou distribuição de pesos. Os Capítulos [7](#cap-07), [11](#cap-11) e [14](#cap-14) cobrem esses designs.
3. **Vagas de nível Staff listam resultados, não ferramentas.** "Aumentar o throughput por GPU." "Ser dono do runtime sobre o qual todo acelerador é construído." Nesses níveis, prepare histórias de impacto com números, não listas de palavras-chave.

## De onde vêm as perguntas

As 50 perguntas deste livro vêm do post *"You should never walk into an Inference Engineering interview without knowing these 50 questions"*, publicado pelo [AI Engineering Insider](https://aiengineeringinsider.substack.com/p/you-should-never-walk-into-an-inference). Os autores leram 20 vagas e reuniram relatos de entrevista do Glassdoor, PracHub, Taro, Aced (antigo Exponent), 1Point3Acres e LeetCode. O post publicou 50 das 112 perguntas do guia deles, cobrindo 14 categorias.

As respostas, explicações, diagramas e códigos deste livro foram escritos de forma independente e não reproduzem o guia pago do AI Engineering Insider. A lista de perguntas, as marcações e os links para as fontes foram mantidos como no post original, traduzidos para o português.

### Como ler as marcações

Cada pergunta tem uma marcação que diz quanta evidência existe de que ela realmente caiu numa entrevista:

- **[Relatado]**: um relato de candidato cita a empresa (Glassdoor, PracHub, Taro, Aced, 1Point3Acres, LeetCode). A redação costuma ser parafraseada. Trate o **tema** como o sinal, não a frase exata.
- **[Fornecedor]**: um fornecedor de preparação ou banco público de perguntas atribui a pergunta a uma empresa, mas o relato original não pôde ser verificado.
- **[Prática]**: pergunta padrão do setor, escrita a partir das vagas. Nenhuma empresa é atribuída.

Depois da marcação vêm empresa, cargo, etapa do processo, ano, dificuldade e o link da fonte.

## Como usar este livro

Cada capítulo segue a mesma estrutura:

1. **Por que importa**: o que o entrevistador está testando com o tema.
2. **Teoria do zero ao avançado**: analogia primeiro, depois números reais, depois detalhe técnico, diagramas e código.
3. **Perguntas de entrevista comentadas**: cada pergunta da lista com quatro partes:
   - *Resposta em 30 segundos*: o que você diz se tiver meio minuto.
   - *Resposta completa*: a versão que mostra profundidade.
   - *Perguntas de acompanhamento prováveis*: o que o entrevistador pergunta em seguida, com resposta curta.
   - *Armadilhas comuns*: os erros que derrubam candidatos.
4. **Resumo e checklist**: o que você precisa conseguir explicar sem consultar nada.

Você vai encontrar caixas de destaque ao longo do texto:

::: analogia
**Analogia:** comparações do dia a dia para fixar a intuição.
:::

::: conta
**Fazendo a conta:** contas passo a passo com números de hardware e modelos reais. Refaça essas contas com lápis. Em entrevista de inferência, saber fazer conta de guardanapo é metade do jogo.
:::

::: dica
**Dica de entrevista:** como apresentar o assunto para causar a melhor impressão.
:::

::: atencao
**Cuidado:** erros conceituais frequentes.
:::

### Ordem de leitura

Os capítulos foram escritos para serem lidos em ordem, mas você pode pular conforme a vaga:

```text
                 ┌───────────────────────────┐
                 │ 1 Fundamentos             │  todo mundo
                 │ 2 Transformer por dentro  │  começa aqui
                 └─────────────┬─────────────┘
          ┌────────────────────┼─────────────────────┐
          ▼                    ▼                     ▼
 ┌─────────────────┐ ┌───────────────────┐ ┌──────────────────┐
 │ KERNEL          │ │ RUNTIME/SERVING   │ │ INFRA/PLATAFORMA │
 │ 3 GPU e CUDA    │ │ 6 KV cache        │ │ 9 Distribuída    │
 │ 4 Performance   │ │ 7 Batching        │ │ 10 Redes         │
 │ 5 CUDA e Triton │ │ 8 Quantização     │ │ 12 Confiabilidade│
 └────────┬────────┘ └─────────┬─────────┘ └────────┬─────────┘
          └────────────────────┼────────────────────┘
                               ▼
                 ┌───────────────────────────┐
                 │ 11 System design          │  todo mundo
                 │ 13 Coding                 │  termina aqui
                 │ 14 Arquitetura avançada   │
                 └───────────────────────────┘
```

Os apêndices trazem os números de referência que você deve saber de cabeça, um glossário, um plano de estudo de 30 dias, a lista das 50 perguntas com links e as referências (papers e documentação) para ir mais fundo.

### Os números que vamos usar o tempo todo

Para as contas não ficarem abstratas, o livro usa sempre o mesmo hardware e os mesmos modelos de exemplo:

| Item | Valor de referência |
|---|---|
| GPU H100 SXM | 80 GB de HBM3, ~3,35 TB/s, ~989 TFLOPS BF16 denso |
| GPU A100 80GB SXM | 80 GB de HBM2e, ~2,0 TB/s, ~312 TFLOPS BF16 denso |
| Llama 3 8B | 32 camadas, d_model 4096, 32 heads de query, 8 heads de KV |
| Llama 3 70B | 80 camadas, d_model 8192, 64 heads de query, 8 heads de KV |

Esses valores são aproximados e mudam de geração para geração (B200, MI300X, TPUs). O raciocínio não muda. Em entrevista, o que conta é você saber de onde vem cada número e fazer a conta na frente do entrevistador.

::: dica
**Dica de entrevista:** quando der um número, diga a ordem de grandeza e a origem: "uma H100 tem uns 3 TB/s de banda; um modelo de 8B em BF16 tem 16 GB; então cada passo de decode leva no mínimo uns 5 ms". Uma conta aproximada que você sabe defender vale mais que um número exato decorado.
:::

Vamos começar pela pergunta que está por trás de todas as outras: por que gerar texto com um LLM é tão diferente de qualquer outro programa que roda numa GPU?
