# Narração dos Reels: System Design do WhatsApp

Texto narrado nos três vídeos, em linguagem para quem não é da área. Os áudios (voz sintética da
Julia Cardoso) ficam fora do git, em `public/materiais/whatsapp/narracao/parteN.mp3`. Cada parte tem no máximo
2:30.

## Parte 1

Se numa entrevista de emprego te pedissem pra explicar como o WhatsApp funciona por dentro, você saberia por onde começar?

Isso tem nome: system design. É desenhar o sistema por trás de um aplicativo: quais computadores ele usa, como eles conversam entre si e como aguentam milhões de pessoas ao mesmo tempo. E é uma das perguntas mais comuns em entrevista de tecnologia.

O primeiro passo não é desenhar. É perguntar. O WhatsApp faz muita coisa: mensagem, grupo, foto, chamada de vídeo, status. Ninguém explica tudo isso em uma hora. Então você escolhe: vou falar de mensagem entre duas pessoas, de grupo e dos tiquinhos de enviado, entregue e lido. Chamada de vídeo fica de fora. E tem uma regra que não se negocia: nenhuma mensagem pode se perder no caminho.

Segundo passo: fazer as contas, pra entender o tamanho do problema. Imagina quinhentos milhões de pessoas usando o app por dia, cada uma mandando dez mensagens. São cinco bilhões de mensagens por dia. Dividindo pelos segundos do dia, são umas cinquenta e oito mil mensagens chegando a cada segundo. E no horário de pico, à noite, isso triplica.

E tudo isso precisa ser guardado. Só de texto, são uns cinco terabytes por dia. Pra ter uma ideia, é o espaço de mais de mil filmes. Todo dia. Nenhum computador sozinho dá conta. Então a resposta já começa a aparecer: são centenas de computadores trabalhando juntos, dividindo o serviço.

Terceiro passo: como a mensagem chega no celular de quem recebe? Tem dois jeitos. O primeiro é o celular ficar perguntando toda hora pro computador do WhatsApp: tem mensagem nova? Tem mensagem nova? É igual criança no banco de trás perguntando "já chegou?". Quase sempre a resposta é não, e isso gasta bateria e internet à toa.

O segundo jeito é como uma ligação que fica aberta. O celular conecta uma vez, a linha fica ligada, e quando chega mensagem, ela vem na hora, sem ninguém precisar perguntar. Esse jeito se chama WebSocket, e é o que os apps de mensagem usam.

E isso é só o começo. No meu guia eu explico o sistema inteiro, com desenhos, as contas prontas e as perguntas que caem em entrevista, com resposta. System Design do WhatsApp, quinze reais, link na bio. Na parte dois, eu te conto o que o primeiro tiquinho do WhatsApp quer dizer de verdade. Spoiler: não é que a mensagem chegou.

## Parte 2

O primeiro tiquinho do WhatsApp não quer dizer que a sua mensagem chegou. Vem comigo que eu te mostro o caminho que uma mensagem faz.

Quando você abre o WhatsApp, o seu celular se conecta a um computador da empresa, que a gente chama de servidor. E essa conexão fica aberta, como uma ligação que não desliga. Só que existem centenas desses servidores, porque um só não aguenta todo mundo. Então o WhatsApp precisa de uma lista que diz em qual servidor cada pessoa está conectada agora. Pensa na recepção de um prédio: a Ana está na sala doze, o Bruno está na sala quarenta.

Agora a Ana manda "oi" pro Bruno. A mensagem sai do celular dela e chega no servidor dela. E a primeira coisa que o servidor faz é anotar essa mensagem num lugar seguro. Só depois de anotar, ele avisa o celular da Ana: recebi. É aí que aparece o primeiro tiquinho.

Por que nessa ordem? Porque se o servidor avisasse antes de anotar e desse um problema logo em seguida, a mensagem sumia, e ninguém ia saber. Então o primeiro tiquinho quer dizer: o WhatsApp guardou a sua mensagem. Ela está segura. Mas ainda não chegou.

Depois, o servidor da Ana olha a lista da recepção: onde está o Bruno? Na sala quarenta. Ele passa a mensagem pro servidor do Bruno, que entrega no celular dele. O celular do Bruno responde: chegou. Esse aviso faz o caminho de volta até a Ana, e aparecem os dois tiquinhos. Agora sim: entregue. E quando o Bruno abre a conversa, o celular dele manda mais um aviso, e os tiquinhos ficam azuis.

E se o Bruno estiver com o celular desligado? A mensagem já está guardada, então fica esperando por ele, como numa caixa de correio. O WhatsApp manda uma notificação, mas a notificação é só um aviso, e pode até se perder. O que garante a entrega é outra coisa: quando o Bruno liga o celular, o app pergunta "o que chegou pra mim enquanto eu estava fora?" e pega tudo. É por isso que às vezes a sua mensagem fica horas com um tiquinho só: a pessoa ainda não apareceu.

No meu guia tem esse caminho completo, desenhado passo a passo. System Design do WhatsApp, quinze reais, link na bio. Na parte três: o que acontece num grupo de mil pessoas, e quando um servidor quebra.

## Parte 3

Quando você manda uma mensagem num grupo de mil pessoas, o WhatsApp não manda uma mensagem. Manda mil.

Num grupo, o servidor guarda a sua mensagem uma vez só. Depois ele vê a lista de quem está no grupo e entrega uma cópia pra cada pessoa. Quem está com o app aberto recebe na hora. Quem não está recebe uma notificação, e a mensagem fica esperando. É como mandar a mesma carta pra mil endereços: quanto maior o grupo, mais trabalho. Por isso todo app limita o tamanho dos grupos. No WhatsApp, o máximo é mil e vinte e quatro pessoas.

Agora pensa no tamanho disso tudo. Só de texto, são quase dois petabytes por ano. Isso não cabe num computador. Precisa ser dividido em muitos, como um arquivo gigante separado em muitas gavetas. A pergunta é: como dividir?

Se você separar mensagem por mensagem, uma conversa sua fica espalhada em várias gavetas. Aí, pra abrir a conversa, o sistema tem que procurar em todas, e fica lento. O jeito certo é separar por conversa: cada conversa inteira fica numa gaveta só, já em ordem. Abriu a conversa, está tudo ali.

E como o sistema sabe a ordem das mensagens? Cada mensagem ganha um número que começa pelo horário em que ela foi enviada, tipo uma senha de atendimento com o relógio impresso. Então colocar os números em ordem já é colocar as mensagens em ordem. E junto vai a identificação do servidor que criou o número, pra dois servidores nunca darem o mesmo número a mensagens diferentes.

E se um servidor quebrar? Todo mundo que estava conectado nele perde a conexão, e o celular se conecta sozinho em outro. Mas tem um cuidado: se todo mundo tentar ao mesmo tempo, derruba o próximo servidor. É igual quando a luz volta e todo mundo liga tudo de uma vez. Então cada celular espera um pouquinho, e se não der, espera um pouco mais. E nenhuma mensagem se perde, porque o primeiro tiquinho só aparece depois que a mensagem foi guardada.

E um bônus: no WhatsApp de verdade, as mensagens são criptografadas de ponta a ponta. Isso quer dizer que nem o próprio WhatsApp consegue ler o que você escreveu. E depois que a mensagem é entregue, ela é apagada dos servidores. A sua conversa fica guardada no seu celular, não com eles.

Se você curtiu entender isso, no meu guia está tudo explicado com calma, com desenhos de cada parte. System Design do WhatsApp, quinze reais, link na bio.
