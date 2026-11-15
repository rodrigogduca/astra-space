---
spec: 01-astra-mvp
fase: requisitos
status: aprovado (2026-11-14, com acréscimo do REQ-11)
atualizado: 2026-11-14
base: specs/00-base/especificacao-tecnica.md
---
# Requisitos — Astra MVP

## Visão
**Astra** é um prontuário eletrônico de saúde (EHR) **gamificado**, no estilo Duolingo e GymRats, para tripulantes em missão espacial. Junta a telemetria dos sensores e os autorrelatos num só lugar e transforma o cuidado diário com **corpo, mente e espírito** em missões, ofensiva e conquistas. O mascote é o **Astrido**, uma estrela.

É um **MVP de hackathon**: roda no navegador, offline, com **dados simulados** rotulados. Não é dispositivo médico.

## Divergências em relação à base (decisão da equipe)
A base (`00-base`) recomenda só sono, energia e humor, sem fisiologia. A equipe pediu ver **todos** os sinais (radiação, glicose, SpO₂, pressão etc.) e gamificação. Resolução:

| Tema | Base | MVP Astra | Salvaguarda mantida da base |
|---|---|---|---|
| Sinais fisiológicos | Desativados | Exibidos | Todos `SIMULADO`, com sensor fictício nomeado |
| Faixas de referência | Proibidas sem fonte | Faixas **gerais** de adulto, com fonte escrita | Cor neutra, texto "não é diagnóstico"; sem semáforo vermelho/verde |
| Radiação | Só contexto | Dose diária simulada + acumulado vs. limite de carreira NASA (600 mSv) | Nota "CANS não conectado" |
| Gamificação | Não prevista | XP, ofensiva, níveis, missões, conquistas, liga | Pontua **hábito**, nunca o valor de um sinal |
| Liga da tripulação | Sem visão agregada | Ranking só de XP | Nenhum dado de saúde de ninguém aparece |
| Integrações | "Não afirma integração" | Central de conectores (ARCHeR, Bio-Monitor, CANS, ECLSS...) | Todo conector é `SIMULADO` ou `ROADMAP`; nenhum diz "conectado de verdade" |

## Fora do MVP
Login real, backend, conexão real com sensores/estudos (ARCHeR, CANS etc. ficam como conectores simulados), diagnóstico, alerta automático à Terra, IA generativa decidindo saúde, texto livre, edição/remoção de registro (fica na fila do roadmap), PWA instalável, tradução.

---

## REQ-1 Prontuário (EHR)
**História:** como tripulante, quero ver todos os meus sinais num prontuário para entender meu estado sem caçar dados.
- **1.1** O sistema DEVE exibir os indicadores agrupados em: Sinais vitais (FC, VFC, pressão, SpO₂, FR, temperatura), Metabolismo (glicose), Radiação e ambiente (dose, CO₂ da cabine), Sono/água/treino, Mente (energia, humor, estresse) e Espírito (propósito, conexão com a Terra, contemplação).
- **1.2** Cada cartão DEVE mostrar valor, unidade, horário relativo, selo de origem (`SIMULADO`, `MANUAL`, `AUSENTE`, `NÃO COLETADO`) e minigráfico.
- **1.3** QUANDO o indicador tiver faixa de referência, o sistema DEVE dizer se o valor está abaixo, na ou acima da faixa, com cor neutra e a fonte da faixa visível no detalhe.
- **1.4** O sistema DEVE mostrar a dose acumulada de radiação da missão contra o limite de carreira da NASA, rotulada como simulada.
- **1.5** SE não houver valor, o sistema DEVE mostrar "—" e o selo de ausência, nunca 0.

## REQ-2 Detalhe e insight explicável
**História:** como tripulante, quero abrir um indicador e entender o que mudou e por quê estou vendo isso.
- **2.1** O detalhe DEVE ter gráfico com janelas de 24 h, 72 h e 7 dias, e a faixa de referência sombreada em tom neutro.
- **2.2** O sistema DEVE calcular a tendência com a regra `describeTrend` da base (≥2 pontos válidos, primeiro vs. último).
- **2.3** SE houver pontos de origens diferentes, o sistema NÃO DEVE misturá-los: compara só a origem do registro mais recente e informa quantos ficaram de fora.
- **2.4** O insight DEVE mostrar valores inicial e final, timestamps, IDs dos registros, versão da regra e os blocos "Por que estou vendo isto?" e "O que isto não significa?".
- **2.5** O detalhe DEVE listar os registros com horário, valor, origem, qualidade e estado de sincronização.
- **2.6** O detalhe DEVE ligar às referências NASA/CSA pertinentes, com o selo `FATO DA FONTE`.

## REQ-3 Jornada gamificada
**História:** como tripulante, quero missões diárias curtas e recompensas para manter bons hábitos.
- **3.1** A tela inicial DEVE mostrar uma trilha de missões do dia (estilo Duolingo) cobrindo os três pilares: check-in matinal, sinais do dia, hidratação, treino, respiração, ligar para a Terra, olhar pela Cúpula, três gratidões, check-in noturno.
- **3.2** Missões com meta DEVEM ter progresso incremental (ex.: +250 mL) e concluir ao atingir a meta.
- **3.3** Cada missão concluída DEVE dar XP e mostrar uma comemoração com o Astrido.
- **3.4** O sistema DEVE mostrar ofensiva (dias seguidos), XP total e nível; a ofensiva do dia fica garantida com 4 missões.
- **3.5** O sistema DEVE mostrar metas do dia por pilar (Corpo, Mente, Espírito) em anéis de progresso.
- **3.6** XP NUNCA DEVE depender do valor de um sinal de saúde, só da ação.

## REQ-4 Astrido
- **4.1** O Astrido DEVE aparecer com humores (feliz, animado, calmo, pensativo, sonolento) conforme o contexto.
- **4.2** QUANDO a tendência de sono dos últimos registros cair, o Astrido DEVE descrevê-la com os números e oferecer check-in, ver detalhe ou pedir apoio, sem dizer "risco", "piora" ou causa.
- **4.3** QUANDO estiver offline, o Astrido DEVE avisar que tudo fica salvo e vai na fila.

## REQ-5 Check-ins
- **5.1** O check-in matinal DEVE coletar sono (h), energia (0–10) e humor (0–10, opcional, pode pular).
- **5.2** O check-in DEVE perguntar "Você se sente diferente do habitual?" com: não / sim, quero registrar / quero ver apoio disponível.
- **5.3** Antes de salvar, o sistema DEVE mostrar a revisão: unidade, horário, origem `MANUAL` e campos ausentes.
- **5.4** Campo pulado DEVE ser salvo como `missing` com valor `null`.
- **5.5** O check-in noturno DEVE coletar estresse e propósito (0–10, opcionais).
- **5.6** O sistema NÃO DEVE ter campo de texto livre.

## REQ-6 Desafios, conquistas e liga
- **6.1** Desafios semanais com barra de progresso (sono ≥7 h em 5 noites, água em 5 dias, 7 pausas, meta de treino da tripulação).
- **6.2** Grade de conquistas com estado ganho/bloqueado.
- **6.3** Liga semanal da tripulação por XP, com aviso de que nenhum dado de saúde é compartilhado.

## REQ-7 Contexto NASA/CSA
- **7.1** Cartões das 5 fontes da base com instituição, título, data, seção, afirmação, tipo, hazards, limitação e botão "Abrir fonte".
- **7.2** Filtro pelos 5 hazards.
- **7.3** Aviso fixo: "contexto não identifica causa; não é dataset integrado".

## REQ-8 Offline, fila e linha do tempo
- **8.1** Todo estado DEVE ser salvo no IndexedDB do navegador antes de qualquer envio.
- **8.2** Deve existir um alternador de enlace com a Terra (simulado) visível no topo.
- **8.3** Eventos (check-in, missão, pedido de apoio) DEVEM ir para a fila com id e chave de idempotência, seguindo PENDING → READY → SYNCED, ou FAILED com "tentar novamente".
- **8.4** Offline, os eventos DEVEM ficar PENDING; ao reconectar, sincronizam sozinhos.
- **8.5** A linha do tempo DEVE ter filtros Registros e Fila, e a legenda de origens.
- **8.6** DEVE existir "Reiniciar demo" (apaga os dados locais).

## REQ-9 Apoio humano
- **9.1** "Pedir apoio" DEVE estar acessível no prontuário, no detalhe, no Astrido e no check-in.
- **9.2** O pedido DEVE mostrar o canal configurado pela missão (cirurgião de voo, simulado), dizer o que será enviado (só o pedido de contato) e exigir confirmação.

## REQ-10 Transversais
- **10.1** Faixa "MODO DEMO · dados simulados · não é dispositivo médico" sempre visível.
- **10.2** Responsivo de 360 px a desktop; abas no topo no desktop e barra inferior no celular.
- **10.3** Acessível: navegação por teclado, foco visível, rótulos ARIA nos gráficos, contraste AA.
- **10.4** Funciona sem internet depois de carregado (fonte e mascote embutidos).
- **10.5** Testes automatizados da regra de tendência (subida, descida, igual, insuficiente, inválido, ausente, mistura) e da gamificação.

## REQ-11 Central de integrações
**História:** como tripulante e como equipe médica, quero que o Astra receba automaticamente os dados dos equipamentos e estudos da missão, para ter uma central única sem digitar nada.
- **11.1** O sistema DEVE ter um catálogo de conectores com: nome, instituição, tipo (vestível, instrumento, ambiente, equipamento de treino, estudo), o que mede, indicadores que alimenta, fonte pública e **status honesto**: `AUTORRELATO` (o próprio check-in do Astra), `SIMULADO` (demo gera dados como se viessem dele), `ROADMAP` (previsto, sem dados) ou `REQUER AUTORIZAÇÃO`.
- **11.2** Conectores mínimos: ARCHeR (actigrafia: sono e atividade), Bio-Monitor/Astroskin da CSA (FC, FR, SpO₂, PA, temperatura), CANS da CSA (nêutrons), dosímetro pessoal, ECLSS da estação (CO₂), monitor contínuo de glicose, ARED/esteira (treino) e o check-in do próprio Astra.
- **11.3** Toda observação DEVE apontar o conector de origem (`sourceRef`), visível no cartão e no detalhe.
- **11.4** A tela "Integrações" DEVE mostrar cada conector com status, última leitura, quantidade de registros e botão "Sincronizar agora" (simulado) nos conectores `SIMULADO`.
- **11.5** O sistema DEVE exportar o prontuário em **HL7 FHIR R4** (Bundle de `Observation`), com códigos LOINC quando confirmados e a etiqueta `SIMULADO` em `meta.tag` de cada recurso.
- **11.6** A camada de ingestão DEVE validar unidade, horário e faixa estrutural antes de aceitar uma leitura; leitura inválida vira `invalid` e não entra na tendência.
- **11.7** O sistema NÃO DEVE afirmar que está conectado a sistemas reais da NASA/CSA.

## Rastreabilidade com a base
| Base | Requisitos |
|---|---|
| R-01 hazards | 7.1, 7.2 |
| R-02 sono | 2.2, 2.4, 4.2, 5.1 |
| R-03 ARCHeR | 7.1, 2.6 |
| R-04 CANS | 1.4 (dose simulada, aviso de não conexão) |
| R-05 missões longas | 7.1 |
| R-06 offline | 8.1–8.4 |
| R-07 energia/humor | 5.1, 5.4 |
