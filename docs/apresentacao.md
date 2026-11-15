# Apresentação à banca

Equipe: {{nomes e papéis do time}} · Data da apresentação: {{data da apresentação no Space Apps 2026}} · Link da demo publicada: {{URL, se houver}}

## Pitch de 45 segundos
> Em missão, os dados de saúde do tripulante ficam espalhados: sensor de um lado, questionário do outro, sem origem clara e sem um motivo para cuidar de si todo dia.
>
> O **Astra** junta tudo num **prontuário eletrônico gamificado**. Como no Duolingo, o tripulante tem missões diárias para corpo, mente e espírito, ganha XP, mantém a ofensiva e é guiado pelo **Astrido**, nossa estrela. O XP vem do hábito, nunca do valor de um sinal.
>
> No prontuário, cada número mostra de onde veio, a faixa de referência com fonte, e o que mudou nos últimos dias, sem chamar isso de diagnóstico. Uma central de integrações mostra como Bio-Monitor, ECLSS ou ARCHeR alimentariam o prontuário, e exporta tudo em **HL7 FHIR**.
>
> Tudo funciona offline e entra numa fila até o enlace com a Terra voltar. Nesta demo, os dados são simulados e rotulados, e nenhum sistema da NASA ou da CSA está conectado.

(Cerca de 120 palavras; ensaiar para caber em 45 s.)

## Antes de começar
1. `npm run dev` (ou `npm run preview` depois do build) e abrir no navegador.
2. Ir em **Fila** → **Reiniciar demo** → confirmar. Isso garante ofensiva 12, 2.340 XP, nenhuma missão feita e a fala do Astrido sobre o sono.
3. Voltar à **Jornada**. Se for depois das 22 h, o Astrido aparece sonolento no ramo padrão (não afeta o roteiro).

## Roteiro de demo (clicável)

### 1. Jornada · o jogo
- Mostrar a faixa **MODO DEMO** no topo, 🔥 12 de ofensiva, ⭐ 2.340 XP e o nível.
- Mostrar a trilha das 9 missões e os anéis Corpo / Mente / Espírito.
- Clicar **+250 mL** em Hidratação duas ou três vezes: o anel de progresso enche.

### 2. Astrido · sono em queda
- Ler o balão: "Seus últimos registros de sono vêm diminuindo (7,5 h → 6,0 h → 5,0 h) (dados SIMULADOS). Isso só descreve o que foi registrado, não é diagnóstico."
- Destacar: ele dá números, não diz "risco" nem causa, e oferece três saídas: **Fazer check-in**, **Ver detalhe**, **Quero apoio**.

### 3. Check-in matinal
- Clicar **Fazer check-in**.
- Sono: **Usar 7 h** (ou ajustar com +/−). Energia: tocar **7**. Humor: clicar **Pular**. "Diferente do habitual?": **Não**.
- **Revisar**: mostrar a tabela com unidade, horário, origem `MANUAL` e humor como `AUSENTE` ("nunca zero").
- **Salvar**: Astrido comemora, **+20 XP**.

### 4. Prontuário e detalhe
- Abrir **Prontuário**: cabeçalho Polaris · DEMO-01, cartão de **radiação acumulada** contra 600 mSv (simulado, "CANS não conectado"), grupos de cartões com selos de origem e faixa em cor neutra.
- Abrir o cartão **Duração do sono**.
  - O registro mais recente agora é o seu (`MANUAL`). O insight diz **"Dados insuficientes para tendência"** e **"3 registros de outra origem ficaram de fora (regra anti-mistura)"**: o Astra não mistura seu dado com o simulado.
  - Mostrar a tabela de registros (origem, conector, qualidade, sincronização) e os cartões **NASA/CSA** com `FATO DA FONTE` e limitação.
- Voltar e abrir **Glicose intersticial** (ou FC) para mostrar um insight completo: valores inicial e final, datas, Δ, ids dos registros, regra `describeTrend` versão `trend-v1`, e os blocos **"Por que estou vendo isto?"** e **"O que isto não significa?"**. Trocar a janela entre 24 h, 72 h e 7 d.

### 5. Integrações e FHIR
- Abrir **Integrações**: o fluxo Conectores → Validação → Prontuário → FHIR e o aviso "**Nenhum conector está ligado a sistemas reais da NASA/CSA**".
- Mostrar status honestos: Bio-Monitor `SIMULADO`, ARCHeR e CANS `ROADMAP`.
- Clicar **Sincronizar agora** no Bio-Monitor: "última leitura" vira "agora" e o número de registros sobe.
- Rolar até **Exportar prontuário (HL7 FHIR R4)**: mostrar a prévia (`meta.tag` SIMULADO, LOINC) e clicar **Baixar JSON**.

### 6. Offline e fila
- No topo, clicar **Enlace on** → vira **Offline**. O Astrido avisa que tudo fica salvo (se o check-in já foi feito).
- Na Jornada, concluir uma missão (ex.: **Olhar pela Cúpula** → +5 min). Comemoração normal.
- Abrir **Fila**: o evento aparece como **PENDING**, com tentativas e chave de idempotência.
- (Opcional) Ligar **Simular falha no próximo envio**.

### 7. Reconectar
- Clicar **Reconectar**: os eventos passam por **READY → SYNCED** em poucos segundos.
- Se a falha estava ligada, um evento vira **FAILED** → clicar **↻ Tentar novamente** → volta para PENDING e sincroniza com a **mesma chave de idempotência**.

### 8. Fechamento
- Abrir **NASA/CSA**: filtro por hazard e o aviso "Contexto, não causalidade".
- Encerrar com os limites: dados simulados, não é dispositivo médico, próximos passos (teste de usabilidade, integração autorizada).

## Perguntas previsíveis da banca

**Onde estão os dados da NASA?**
As cinco páginas NASA/CSA que usamos descrevem hazards, riscos e pesquisas. Elas não são feed nem dataset, então entram como contexto citável, com data, seção e limitação. Todos os valores da demo são simulados e rotulados.

**O Astra está integrado ao ARCHeR, ao CANS ou ao Bio-Monitor?**
Não. Eles aparecem como conectores `SIMULADO` ou `ROADMAP` para mostrar a arquitetura. Integração real exigiria acesso, autorização da missão e contrato de dados. A tela diz isso explicitamente.

**A NASA mediu esses valores?**
Não. O simulador gera os dados com semente fixa. O cenário de sono 7,5 → 6 → 5 h vem do documento base da equipe, também fictício.

**E se o tripulante piorar?**
O Astra não classifica saúde nem dá alerta. Ele mostra a sequência registrada, explica o cálculo e oferece um caminho humano: pedir apoio ao cirurgião de voo, com confirmação. A interpretação é da equipe médica.

**Por que mostrar faixas de referência se não é diagnóstico?**
Para localizar o valor, não para julgar. Cada faixa tem fonte escrita (AHA, AASM, consenso de CGM...), aparece em cor neutra e com o texto "referência geral, não personalizada". Indicadores sem faixa universal, como VFC e escalas 0–10, ficam sem faixa.

**Gamificar saúde não incentiva a pessoa a "maquiar" os números?**
O XP vem só da ação (fazer o check-in, beber água, treinar, pausar), nunca do valor. Ter pressão alta ou dormir pouco não tira ponto. Isso é coberto por teste automatizado. A liga mostra só XP, nenhum dado de saúde.

**Como funciona offline?**
Tudo é salvo no IndexedDB do navegador antes de qualquer envio. Os eventos vão para uma fila com chave de idempotência e só sobem quando o enlace volta. O enlace com a Terra é simulado.

**Os dados estão seguros?**
Para a demo, não precisam: são fictícios. O IndexedDB não é criptografado e não substitui um cofre clínico. Antes de dado real, seria preciso modelo de ameaça, controle de acesso, criptografia, auditoria e backup (fase 3 do roadmap).

**O FHIR exportado é válido?**
Segue a estrutura de um Bundle R4 `collection` de `Observation`, com ids no formato do FHIR, LOINC só nos 6 códigos confirmados e UCUM nas unidades. Testamos a estrutura no código, mas ainda não passamos num validador oficial.

**Usa inteligência artificial?**
Não para decidir saúde. Tendência, falas do Astrido e faixas são regras determinísticas e reproduzíveis. (O desenvolvimento usou agentes de IA para programar, guiados por specs revisadas pela equipe.)

**Qual o próximo passo?**
Teste de usabilidade com usuários para validar as escalas e a gamificação; depois, backend e integração autorizada com uma fonte de dados real. Validação clínica e regulatória só numa fase operacional.

**Quanto tempo e quantas pessoas?**
{{tempo de desenvolvimento e tamanho da equipe}}
