# Modelo de dados

Arquivos de referência: `src/domain/types.ts`, `src/store.tsx`, `src/domain/indicators.ts`, `src/domain/integrations.ts`, `src/domain/references.ts`.

## `Observation`
Uma medição ou registro. Segue o contrato da base (§13), com `indicatorCode` tipado e `value` só numérico.

| Campo | Tipo | Significado |
|---|---|---|
| `observationId` | `string` | Id único. Prefixos usados: `sim-<código>-<n>` (histórico simulado), `sim-live-<seq>-<conector>-<i>` (leitura "ao vivo" de conector), `man-<tempo>-<seq>-<i>` (check-in), `today-<código>` (total do dia, derivado). |
| `profileId` | `string` | Id de demo (`DEMO-01`). Não é identidade real. |
| `indicatorCode` | `IndicatorCode` | Um dos 19 códigos do catálogo. |
| `value` | `number \| null` | Valor. **`null` = ausente, nunca 0.** |
| `unit` | `string \| null` | Unidade (deve bater com o catálogo, senão a ingestão marca `invalid`). |
| `observedAt` | `string` | Momento da observação, ISO-8601. |
| `origin` | `DataOrigin` | `manual`, `synthetic` ou `authorized_external`. |
| `sourceRef` | `string?` | Id do conector de origem (ex.: `bio-monitor`, `astra-checkin`). Visível no cartão e no detalhe. |
| `qualityState` | `QualityState` | `valid`, `missing`, `invalid` ou `unverified`. Só `valid` entra na tendência. |
| `syncState` | `SyncState` | Estado de envio (ver abaixo). |
| `isSynthetic` | `boolean` | `true` em todo dado gerado pela demo. Controla o selo `SIMULADO` e a tag FHIR. |

### Origens (`DataOrigin`)
| Valor | Selo na tela | Quando |
|---|---|---|
| `synthetic` | `SIMULADO` | Histórico gerado pelo simulador e leituras de "Sincronizar agora". |
| `manual` | `MANUAL` | Check-in e totais de missões (água, treino, Terra, Cúpula). |
| `authorized_external` | `EXTERNO` | Previsto para dado real autorizado. **Nenhuma observação usa essa origem na demo.** |

Selos extras de ausência: `AUSENTE` (registro existe, valor `null`) e `NÃO COLETADO` (nenhum registro).

### Estados de qualidade (`QualityState`)
| Valor | Significado | Quem gera |
|---|---|---|
| `valid` | Passou na ingestão. | `ingest()`, simulador |
| `missing` | Campo pulado; `value: null`. | `ingest()` quando o valor é `null` |
| `invalid` | Unidade errada, horário inválido ou mais de 5 min no futuro, valor não finito ou fora do limite estrutural. Fica fora da tendência e do FHIR. | `ingest()` |
| `unverified` | Previsto no contrato da base. **Nenhum ponto do código gera esse estado hoje.** | — |

### Estados de sincronização (`SyncState`)
| Valor | Rótulo na fila | Significado |
|---|---|---|
| `local_only` | LOCAL | Só no aparelho (totais do dia; saída inicial do `ingest()`). |
| `pending` | PENDING | Na fila, aguardando enlace. |
| `ready` | READY | Pronto para enviar. |
| `synced` | SYNCED | "Recebido na Terra" (simulado). Dados simulados nascem `synced`. |
| `failed` | FAILED | Envio não confirmado; botão "Tentar novamente". |

O `syncState` de uma observação manual **é o estado do evento da fila que a envia** (mapa `obsEvent`), calculado em `allObservations()`.

## `SyncEvent`
Um item da fila de envio.

| Campo | Tipo | Significado |
|---|---|---|
| `eventId` | `string` | `evt-<tempo em base36>-<seq>`. |
| `idempotencyKey` | `string` | `DEMO-01:<eventId>`. Não muda em nova tentativa, então o receptor pode descartar duplicatas. |
| `type` | `"check_in" \| "mission_done" \| "support_request"` | Tipo do evento. |
| `label` | `string` | Texto exibido na fila (ex.: "Missão concluída: Treino (+25 XP)"). |
| `createdAt` | `string` | ISO-8601. |
| `state` | `SyncState` | `pending`, `ready`, `synced` ou `failed`. |
| `attempts` | `number` | Tentativas de envio (soma 1 ao passar de `ready` para `synced` ou `failed`). |

## `AppState`
Salvo inteiro no IndexedDB na chave **`astra-state-v1`**.

| Campo | Tipo | Significado |
|---|---|---|
| `anchor` | `number` | Momento (ms, arredondado ao minuto) a partir do qual o histórico simulado é gerado. Renovado se tiver mais de 1 h ao carregar. |
| `manual` | `Observation[]` | Observações de check-in (matinal e noturno). |
| `live` | `Observation[]` | Leituras de "Sinais do dia" e "Sincronizar agora". |
| `today` | `TodayState` | `date` (AAAA-MM-DD), `done` (missões feitas), `progress` (progresso das missões com meta), `gratitude` (3 escolhas). Zera na virada do dia. |
| `outbox` | `SyncEvent[]` | Fila de envio. |
| `online` | `boolean` | Enlace com a Terra (simulado) ligado ou não. |
| `failNext` | `boolean` | Se `true`, o próximo evento `ready` vira `failed`. |
| `lastSync` | `Record<string, string>` | Conector → ISO da última leitura "ao vivo". |
| `obsEvent` | `Record<string, string>` | Observação manual → `eventId` que a envia. |
| `xpEarned` | `number` | XP ganho no app (somado à base de demo de 2.340). |
| `streak` | `number` | Ofensiva atual. Começa em 12 (fictício). |
| `lastStreakDay` | `string \| null` | Último dia em que a meta de 4 missões foi batida. Começa como "ontem". |
| `earnedBadges` | `string[]` | Ids de conquistas já ganhas. Não somem na virada do dia. |
| `seq` | `number` | Contador para ids únicos. |

> Divergência com o `design.md`: a spec lista um campo `supportRequested`. O código **não** tem esse campo: o pedido de apoio vira um `SyncEvent` do tipo `support_request`, e o "pedido de hoje" é achado na `outbox`. Os campos `lastSync`, `obsEvent`, `xpEarned`, `streak`, `lastStreakDay`, `earnedBadges` e `seq` existem no código e não estão na spec.

## Catálogo dos indicadores (19)
Fonte: `INDICATORS` em `src/domain/indicators.ts`. Modo de entrada: `telemetria` (sensor), `autorrelato` (check-in) ou `registro` (missão).

| Código | Nome | Unidade | Pilar | Grupo | Entrada | Faixa | Fonte da faixa |
|---|---|---|---|---|---|---|---|
| `heart_rate` | Frequência cardíaca em repouso | bpm | Corpo | Sinais vitais | telemetria | 60–100 bpm | Faixa geral de repouso para adultos (AHA) |
| `hrv` | Variabilidade da FC (RMSSD) | ms | Mente | Sinais vitais | telemetria | sem faixa | "compare só com você mesmo" |
| `bp_systolic` | Pressão arterial sistólica | mmHg | Corpo | Sinais vitais | telemetria | < 120 mmHg | Classificação AHA/ACC 2017 para adultos |
| `bp_diastolic` | Pressão arterial diastólica | mmHg | Corpo | Sinais vitais | telemetria | < 80 mmHg | Classificação AHA/ACC 2017 para adultos |
| `spo2` | Oxigênio no sangue (SpO₂) | % | Corpo | Sinais vitais | telemetria | 95–100 % | Faixa geral em ar ambiente para adultos |
| `resp_rate` | Frequência respiratória | rpm | Corpo | Sinais vitais | telemetria | 12–20 rpm | Faixa geral de repouso para adultos |
| `body_temp` | Temperatura corporal | °C | Corpo | Sinais vitais | telemetria | 36,1–37,2 °C | Faixa geral para adultos |
| `glucose` | Glicose intersticial | mg/dL | Corpo | Metabolismo | telemetria | 70–180 mg/dL | "Tempo no alvo" de CGM (consenso internacional 2019) |
| `radiation_dose` | Dose de radiação diária | mSv | Corpo | Radiação e ambiente | telemetria | sem faixa diária | Acumulado comparado ao limite de carreira de 600 mSv (NASA-STD-3001) |
| `cabin_co2` | CO₂ na cabine | mmHg | Corpo | Radiação e ambiente | telemetria | sem faixa | "Limites operacionais vêm da missão" |
| `sleep_duration` | Duração do sono | h | Corpo | Sono, água e treino | autorrelato | ≥ 7 h | Recomendação geral para adultos (AASM/SRS 2015) |
| `hydration` | Hidratação | L | Corpo | Sono, água e treino | registro | meta 2 L | Meta da demo (HIPÓTESE ASTRA) |
| `exercise` | Exercício | min | Corpo | Sono, água e treino | registro | meta 2 h (≥ 120 min) | Tripulantes da ISS se exercitam cerca de 2 h/dia (NASA) |
| `energy_self_report` | Energia percebida | 0–10 | Mente | Mente | autorrelato | sem faixa | Escala de produto, não validada |
| `mood_self_report` | Humor percebido | 0–10 | Mente | Mente | autorrelato | sem faixa | Idem; opcional e privado |
| `stress_self_report` | Estresse percebido | 0–10 | Mente | Mente | autorrelato | sem faixa | Idem; opcional e privado |
| `purpose_self_report` | Sentido e propósito | 0–10 | Espírito | Espírito | autorrelato | sem faixa | Idem; opcional e privado |
| `earth_contact` | Conexão com a Terra | min | Espírito | Espírito | registro | sem faixa | — |
| `contemplation` | Contemplação e respiração | min | Espírito | Espírito | registro | sem faixa | — |

Tipos de faixa (`range.kind`): `referencia_geral` (faixa geral de adulto), `meta_demo` (meta da demo, aparece com selo `HIPÓTESE ASTRA`) e `limite_carreira` (previsto; nenhum indicador usa hoje, o limite de 600 mSv está na constante `CAREER_LIMIT_MSV`).

Cada indicador também tem `short`, `decimals`, `icon`, `sensor` (nome fictício, só telemetria), `scaleNote` e `referenceIds` (fontes NASA/CSA mostradas no detalhe).

## Conectores (9)
Fonte: `CONNECTORS` em `src/domain/integrations.ts`. Nenhum está ligado a sistema real.

| Id | Nome | Instituição | Tipo | Status (rótulo) | Indicadores que alimenta |
|---|---|---|---|---|---|
| `astra-checkin` | Check-in Astra | Astra | Autorrelato | `ativo` (AUTORRELATO) | sono, energia, humor, estresse, propósito, hidratação, conexão com a Terra, contemplação |
| `bio-monitor` | Bio-Monitor (camiseta Astroskin) | CSA | Vestível | `simulado` (SIMULADO) | FC, VFC, FR, SpO₂, PAS, PAD, temperatura |
| `cgm` | Monitor contínuo de glicose | Genérico | Vestível | `simulado` | glicose |
| `dosimetro` | Dosímetro pessoal ativo | Genérico | Instrumento | `simulado` | dose de radiação |
| `cans` | CANS · Crew Active Neutron Spectrometer | CSA | Instrumento | `roadmap` (ROADMAP) | dose de radiação |
| `eclss` | ECLSS · suporte de vida da estação | NASA | Ambiente da nave | `simulado` | CO₂ da cabine |
| `ared` | ARED e esteira | NASA | Equipamento de treino | `simulado` | exercício |
| `archer` | ARCHeR · Artemis Research for Crew Health and Readiness | NASA | Estudo científico | `roadmap` | sono, exercício |
| `cenario-demo` | Cenário demo · autorrelatos simulados | Astra | Autorrelato | `simulado` | sono, energia, humor, estresse, propósito, hidratação, conexão com a Terra, contemplação |

- O status `requer_autorizacao` (REQUER AUTORIZAÇÃO) existe no tipo e na tela, mas **nenhum conector usa** hoje.
- `connectorFor(code)` define quem "gera" cada indicador no histórico simulado: Bio-Monitor (vitais), CGM (glicose), dosímetro (radiação), ECLSS (CO₂), ARED (exercício) e `cenario-demo` (autorrelatos e hábitos).
- O link oficial do Bio-Monitor **ainda não foi confirmado** pela equipe ({{link oficial do Bio-Monitor na CSA}}); por isso o conector não tem `referenceId`.

### Limites estruturais (plausibilidade do sensor, não clínicos)
| Indicador | Mín–máx | Indicador | Mín–máx |
|---|---|---|---|
| FC | 20–250 | glicose | 20–600 |
| VFC | 1–300 | dose de radiação | 0–100 |
| PAS | 50–260 | CO₂ cabine | 0–30 |
| PAD | 20–160 | sono | 0–24 |
| SpO₂ | 50–100 | hidratação | 0–10 |
| FR | 3–60 | exercício | 0–600 |
| temperatura | 30–43 | escalas 0–10 | 0–10 |
| conexão com a Terra | 0–600 | contemplação | 0–600 |

## Referências NASA/CSA (5)
Fonte: `REFERENCES` em `src/domain/references.ts`. Todas aparecem com o selo `FATO DA FONTE` e uma limitação escrita.

| Id | Instituição | Título | Tipo | Hazards | Data da página |
|---|---|---|---|---|---|
| `nasa-hazards` | NASA | 5 Hazards of Human Spaceflight | risco descrito | todos os 5 | atualizada em 2026-06-12 |
| `nasa-risks` | NASA | Risks of Human Spaceflight | risco descrito | radiação, gravidade, isolamento | atualizada em 2026-07-21 |
| `nasa-ongoing` | NASA | Ongoing HRP Research in Space | pesquisa em andamento | isolamento, gravidade | atualizada em 2026-08-18 |
| `csa-radiation` | CSA | Monitoring radiation for astronaut health | tecnologia em desenvolvimento | radiação | 2026-02-26 |
| `csa-science` | CSA | Why do we conduct science experiments in space? | contexto de missão | gravidade, radiação, isolamento, distância | modificada em 2025-10-28 |

Hazards (`Hazard`): `radiacao`, `isolamento`, `distancia`, `gravidade`, `ambiente`. As URLs estão no código e na seção "Referências" da base.

## Dados simulados: o que o simulador gera
`generateSynthetic(anchor)` em `src/domain/simulator.ts`, semente fixa 2026:
- **Telemetria a cada 2 h nos últimos 7 dias**: FC, VFC, PAS, PAD, SpO₂, FR, temperatura, CO₂ da cabine e glicose, com ciclo do dia e uma leve "fadiga" nas últimas 72 h.
- **Dose diária de radiação** nos 7 dias, com um pico simulado dois dias atrás.
- **6 check-ins simulados** (−144, −120, −96, −70, −36 e −2 h) de sono, energia, humor, estresse e propósito. Os três últimos reproduzem o cenário de 72 h da base: sono 7,5 → 6 → 5 h; energia 8 → 6 → 4; humor 8 → 6 → 4.
- **Totais de 6 dias anteriores** de água, treino, conexão com a Terra e contemplação.

`MISSION` (fictício): "Missão demo ASTRA-1", dia 46, indicativo "Polaris", tripulante `DEMO-01`.
