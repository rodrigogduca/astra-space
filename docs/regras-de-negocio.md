# Regras de negócio

Todas as regras são **determinísticas**: com a mesma entrada, o resultado é sempre o mesmo. Nenhum modelo de IA decide nada.

## 1. Tendência (`src/domain/trend.ts`)

### `describeTrend(points)` · versão `trend-v1`
Regra da base (§14), com um acréscimo para duplicidade:
1. Fica só com pontos `qualityState === "valid"` e `value` numérico (inválido, ausente, não verificado e `null` são ignorados; `null` nunca vira 0).
2. Remove duplicatas pelo `observationId` (o mesmo registro conta uma vez).
3. Ordena por `observedAt`.
4. Menos de 2 pontos → `{ state: "insufficient_data" }`.
5. Se há pontos simulados **e** não simulados → `{ state: "mixed_origins_blocked" }`.
6. Senão, compara **primeiro e último** (não faz média nem regressão):
   - `delta = último − primeiro`; `direction` = `down`, `up` ou `unchanged`;
   - devolve `unit`, `start`, `end`, `inputIds` (ids do primeiro e do último), `points` (quantos válidos) e `isSynthetic`.

O resultado se chama `descriptive_only`: diz a direção, nunca "normal", "perigoso" ou "piora". A versão `TREND_RULE_VERSION = "trend-v1"` aparece no insight.

### `trendForLatestOrigin(points)` · anti-mistura na prática
Em vez de só bloquear, o Detalhe usa esta função:
1. Fica com os válidos numéricos.
2. Acha o registro **mais recente**.
3. Mantém só os pontos da mesma origem (`isSynthetic` igual ao do mais recente) e chama `describeTrend`.
4. Devolve `{ trend, excluded, synthetic }`, onde `excluded` = quantos válidos de outra origem ficaram de fora. A tela mostra "N registros de outra origem ficaram de fora (regra anti-mistura)".

### `withinWindow(points, horas, agora)`
Filtra para a janela `[agora − horas, agora]`. O Detalhe usa janelas de 24 h, 72 h e 7 dias (168 h). O padrão é 72 h.

## 2. Posição na faixa (`rangePosition` em `indicators.ts`)
- Sem `range` no catálogo ou valor `null` → `sem_faixa`.
- `valor < min` → `abaixo`; `valor > max` → `acima`; senão `dentro`.
- Na tela (`RangeHint`): "na/abaixo da/acima da faixa de referência" para `referencia_geral`, e "meta" no lugar de "faixa de referência" para `meta_demo`.
- **Cores neutras** (tons de azul/roxo), nunca semáforo vermelho/verde.
- A fonte da faixa aparece no Detalhe ("Fonte da faixa: ...") junto com "referência geral, não personalizada" ou o selo `HIPÓTESE ASTRA`.

### Radiação acumulada (cartão do Prontuário)
Estimativa exibida como `SIMULADO`: **média das doses diárias simuladas válidas × 46 dias de missão**, comparada a `CAREER_LIMIT_MSV = 600` mSv (NASA-STD-3001). Mostra mSv, a porcentagem do limite e a nota "CANS não conectado; valores fictícios". Sem dado → "—" e `NÃO COLETADO`.

## 3. Ingestão e limites estruturais (`ingest()` em `integrations.ts`)
Toda leitura (check-in ou conector) vira `Observation` passando por aqui:

| Condição | `qualityState` |
|---|---|
| `value === null` | `missing` (valor continua `null`) |
| valor não finito (`NaN`, `Infinity`) | `invalid` |
| `unit` diferente da unidade do catálogo | `invalid` |
| `observedAt` não é data, ou está mais de 5 min no futuro | `invalid` |
| valor fora de `STRUCTURAL_BOUNDS` do indicador | `invalid` |
| tudo certo | `valid` |

Origem: `synthetic` se a leitura é simulada; `manual` se vem do conector `astra-checkin`; senão `authorized_external`. `sourceRef` = id do conector. `syncState` começa `local_only` (o store ajusta: leituras de conector ficam `synced`, check-ins seguem o evento da fila).

Os limites estruturais servem para barrar **leitura quebrada**, não são faixa clínica (tabela em [modelo-de-dados.md](modelo-de-dados.md#limites-estruturais-plausibilidade-do-sensor-não-clínicos)).

## 4. Gamificação (`gamification.ts` + `store.tsx`)
Princípio (REQ-3.6): **XP pontua a ação, nunca o valor de um sinal.** Há teste para isso.

### Missões do dia (9)
| Id | Missão | Pilar | XP | Meta / passo | Como conclui |
|---|---|---|---|---|---|
| `checkin` | Check-in matinal | Mente | 20 | — | Salvar o check-in (`#/checkin`) |
| `vitals` | Sinais do dia | Corpo | 10 | — | "Sincronizar" (lê Bio-Monitor e CGM simulados) |
| `hydration` | Hidratação | Corpo | 15 | 2.000 mL, +250 | Ao chegar na meta |
| `exercise` | Treino | Corpo | 25 | 120 min, +30 | Ao chegar na meta |
| `breathe` | Pausa de respiração | Mente | 15 | — | Respirar 60 s (ou "Pular (demo)") |
| `earth` | Ligar para a Terra | Espírito | 15 | 15 min, +15 | Um toque |
| `window` | Olhar pela Cúpula | Espírito | 10 | 5 min, +5 | Um toque |
| `gratitude` | Três gratidões | Espírito | 10 | — | Escolher 3 de 10 opções |
| `evening` | Check-in noturno | Espírito | 15 | — | Salvar com pelo menos um campo respondido |

- Uma missão só dá XP **uma vez por dia**. Refazer o check-in grava mais um registro, sem XP.
- Cada conclusão cria um evento `mission_done` na fila e dispara a comemoração (toast com o Astrido e "+XP"). Missões vindas do IndexedDB ao recarregar não comemoram de novo.
- Totais de água, treino, Terra e Cúpula viram uma observação `MANUAL` derivada (`today-<código>`) no Prontuário.

### XP e níveis
- **XP total = 2.340 (base fictícia da demo) + `xpEarned`.**
- Níveis: Cadete 0 · Especialista 800 · Engenheiro de voo 1.800 · Comandante 3.000 · Lenda orbital 5.000. `levelFor` devolve índice, nome, próximo nível, XP que falta e progresso (0–1).

### Ofensiva e virada do dia
- Começa em **12 dias** (fictício), com `lastStreakDay` = ontem.
- Ao concluir a **4ª missão** do dia (`DAILY_GOAL_MISSIONS = 4`), a ofensiva sobe 1, uma vez por dia.
- **Virada do dia** (`rollover`, ao carregar e a cada 60 s): se a data mudou, `today` zera (missões, progresso, gratidões). Se a meta **não** foi batida ontem, a ofensiva volta a 0. XP e conquistas são mantidos.

### Conquistas (10, persistidas)
Primeira órbita (sempre ganha) · Semana em órbita (ofensiva ≥ 7) · Quinzena estelar (≥ 15) · Hidratado em microgravidade · Atleta da ARED · Mente calma · Efeito Overview · Ponte com a Terra · Dia completo (9 missões) · Comandante (≥ 3.000 XP).
Ao concluir uma missão, as conquistas ganhas são somadas a `earnedBadges`; por isso não somem na virada do dia.

### Desafios semanais (`weeklyChallenges`)
Janela: últimos 7 dias. Observações `today-*` ficam de fora; o dia de hoje entra pelas missões, para não contar em dobro.
| Desafio | Conta |
|---|---|
| Dormir 7 h ou mais em 5 noites | dias distintos com sono válido ≥ 7 h |
| Bater a meta de água em 5 dias | dias com hidratação ≥ 2 L + hoje, se a missão de água foi feita |
| Pausa para a mente em 7 dias | dias com contemplação > 0 + hoje, se fez respiração ou Cúpula |
| Tripulação: 4.000 min de treino juntos | 2.980 min (base fictícia da equipe) + seus minutos de treino da semana + progresso de hoje |

Observação honesta: o desafio "4.000 min da tripulação" usa só **seus** minutos sobre uma base fixa; não há dado de outros tripulantes.

### Liga semanal (só XP)
4 colegas fictícios (Vega 520, Lyra 465, Orion 380, Altair 295 XP) + você (410 XP de base + XP de hoje). Ordenada por XP; os 3 primeiros ficam na "zona de promoção". **Nenhum dado de saúde aparece na liga** e isso é dito na tela.

## 5. Falas do Astrido (`astrido.ts`)
`astridoSays({ today, sleep, online, support, hour })` escolhe humor, texto e botões. Ordem de prioridade (a primeira que vale ganha):

| # | Condição | Humor | Fala resumida | Ações |
|---|---|---|---|---|
| 1 | Pedido de apoio de hoje `failed` | calmo | envio falhou, continua salvo | Ver fila |
| 2 | Pedido de apoio de hoje não `synced` | calmo | está na fila (online) / sai quando o enlace voltar (offline) | Respirar 1 min · Ver fila |
| 3 | Todas as 9 missões feitas | animado | "Dia completo!" | Ver conquistas |
| 4 | Check-in de hoje não feito **e** os 3 últimos registros válidos de sono descem (via `trendForLatestOrigin`) | pensativo | "Seus últimos registros de sono vêm diminuindo (7,5 h → 6,0 h → 5,0 h) (dados SIMULADOS). Isso só descreve o que foi registrado, não é diagnóstico." | Fazer check-in · Ver detalhe · Quero apoio |
| 5 | Offline | calmo | "Tudo o que você fizer fica salvo aqui e entra na fila de envio." | Ver fila |
| 6 | Padrão | feliz (sonolento entre 22 h e 5 h) | saudação por horário + próxima missão | Começar (se a missão tem tela) |

Regras de linguagem: nunca "risco", "piora", "perigo", "anormal" nem causa. Um teste percorre 162 combinações de estado para garantir isso. Dado simulado citado na fala leva "(dados SIMULADOS)".

Nota: por causa da prioridade, a fala de offline (#5) só aparece se o ramo do sono (#4) não valer.

## 6. Sincronização simulada (`store.tsx`)
- Eventos nascem `pending`, com `eventId` e `idempotencyKey = DEMO-01:<eventId>`.
- Com o enlace **ligado** e algum evento `pending`/`ready`, a cada **0,9 s** o reducer `advanceSync` faz: `pending → ready` e `ready → synced` (somando 1 em `attempts`).
- Se **"Simular falha no próximo envio"** (`failNext`) está ligado, o primeiro `ready` vira `failed` e o interruptor desliga sozinho.
- **Tentar novamente** (`retry`) volta o evento para `pending`, **com a mesma `idempotencyKey`**: um receptor real pode descartar o reenvio duplicado.
- Com o enlace **desligado**, `advanceSync` não faz nada: tudo fica `pending` e sobe sozinho ao reconectar.
- O registro é **append-only**: não há edição nem remoção de observação (fica no roadmap).
- "Reiniciar demo" (`reset`) troca o estado por um novo (`freshState`), que sobrescreve o IndexedDB.

## 7. Exportação FHIR (`fhir.ts`)
`toFhirBundle(observações, { profileId, generatedAt })` → `Bundle` HL7 FHIR R4 do tipo `collection`.
- **Exclui** observações `invalid`.
- Cada `Observation` FHIR:
  - `id` = `observationId` saneado para o tipo `id` do FHIR (`[A-Za-z0-9-.]`, até 64 caracteres) por `fhirId()`;
  - `fullUrl` = `urn:uuid:<UUID>` determinístico gerado de `observationId` por `uuidFrom()` (formato v4, estável entre exportações);
  - `status` = `final`, ou `cancelled` quando `value` é `null` (com `dataAbsentReason` = `unknown`, "Sem valor registrado");
  - `category` por grupo: vitais → `vital-signs`; metabolismo → `laboratory`; radiação/ambiente e rotina → `social-history`; mente e espírito → `survey`;
  - `code`: **LOINC só quando confirmado**; os demais usam o sistema local `urn:astra:indicator` com o nome em `text`;
  - `subject` = `Patient/DEMO-01`; `effectiveDateTime` = `observedAt`; `device.display` = nome do conector;
  - valor: `valueQuantity` com UCUM quando a unidade é mapeada; escalas 0–10 viram `valueInteger`.
- **Tags** em `meta.tag` (sistema `urn:astra:provenance`): `SIMULATED` ("SIMULADO") em todo recurso sintético, `MANUAL` nos manuais. O próprio `Bundle` recebe `SIMULATED` se houver algum dado sintético.

### LOINC confirmados (6)
| Indicador | LOINC | Display |
|---|---|---|
| FC | 8867-4 | Heart rate |
| PAS | 8480-6 | Systolic blood pressure |
| PAD | 8462-4 | Diastolic blood pressure |
| FR | 9279-1 | Respiratory rate |
| Temperatura | 8310-5 | Body temperature |
| SpO₂ | 59408-5 | Oxygen saturation in Arterial blood by Pulse oximetry |

### Unidades UCUM
bpm e rpm → `/min` · mmHg → `mm[Hg]` · % → `%` · °C → `Cel` · mg/dL → `mg/dL` · mSv → `mSv` · ms → `ms` · h → `h` · L → `L` · min → `min`.

O arquivo baixado se chama `astra-fhir-DEMO-01.json` (`application/fhir+json`). Ele **não foi validado** num servidor FHIR oficial; os testes conferem a estrutura principal.
