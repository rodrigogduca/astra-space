---
spec: 01-astra-mvp
fase: design
status: aprovado (2026-11-14)
atualizado: 2026-11-14
---
# Design — Astra MVP

## Stack
React 19 + TypeScript + Vite · IndexedDB via `idb-keyval` · fonte Nunito embutida (`@fontsource-variable/nunito`) · gráficos em SVG próprio (sem biblioteca, roda offline) · Vitest para testes. Sem backend.

## Estrutura de pastas
```
src/
├── domain/               ← TypeScript puro, sem React (testável)
│   ├── types.ts          Observation, SyncEvent, origens/estados (contrato da base §13)
│   ├── indicators.ts     catálogo dos 19 indicadores: unidade, pilar, grupo, sensor fictício, faixa + fonte
│   ├── references.ts     5 fontes NASA/CSA (afirmação, limitação, hazards, URL)
│   ├── trend.ts          describeTrend (base §14) + trendForLatestOrigin (anti-mistura)
│   ├── simulator.ts      gerador determinístico (semente 2026) de 7 dias + cenário 72 h da base §17
│   ├── integrations.ts   catálogo de conectores (ARCHeR, Bio-Monitor, CANS...) + ingestão/validação
│   ├── fhir.ts           exporta Observation → Bundle FHIR R4 (LOINC + tag SIMULADO)
│   ├── gamification.ts   missões, XP, níveis, ofensiva, conquistas, desafios, liga
│   └── astrido.ts        escolhe humor + fala do Astrido a partir do estado
├── store.tsx             useReducer + Context; persiste no IndexedDB; simula o enlace
├── components/           Astrido (SVG), ui (selos, anel, barra, sparkline), Chart, TopBar, SupportDialog, Celebration
├── screens/              Jornada, Prontuario, Indicador, CheckIn, Respirar, Gratidao, Desafios, Contexto, LinhaDoTempo
├── App.tsx               rotas por hash (#/prontuario/glucose) + layout
└── styles.css            tokens de design e componentes
```

## Modelo de dados
- `Observation` exatamente como a base, com `indicatorCode` tipado e `value: number | null`.
- Dados simulados **não são salvos**: são regenerados de `anchor` (momento da 1ª abertura) com semente fixa. Assim a demo é sempre igual e o IndexedDB guarda só o que o usuário fez.
- `AppState` salvo no IndexedDB (`astra-state-v1`): `anchor`, `manual[]` (check-ins), `live[]` (leituras de "Sinais do dia"), `today` (missões, progresso, gratidões), `outbox[]`, `online`, `failNext`, `lastSync`, `obsEvent` (registro → evento da fila), `xpEarned`, `streak`, `lastStreakDay`, `earnedBadges`, `seq`. O pedido de apoio é um evento `support_request` da fila (não há flag própria). Detalhes: `docs/modelo-de-dados.md`.
- Totais do dia (água, treino, Terra, contemplação) viram uma observação `MANUAL` derivada para aparecer no prontuário.
- Virada de dia: ao abrir num dia novo, `today` zera.

## Regras
| Regra | Onde | Comportamento |
|---|---|---|
| Tendência | `trend.ts` | Base §14, sem alteração. Versão `trend-v1`. |
| Anti-mistura | `trendForLatestOrigin` | Filtra pela origem do último ponto; devolve `excluded`. |
| Faixa | `rangePosition` | abaixo/dentro/acima/sem_faixa. Só indicadores com `range` + `source`. |
| XP | `gamification.ts` | Soma do XP das missões concluídas; base demo 2.340 XP. |
| Ofensiva | idem | Base demo 12 dias; +1 quando ≥4 missões no dia. |
| Níveis | idem | Cadete 0 · Especialista 800 · Engenheiro de voo 1.800 · Comandante 3.000 · Lenda orbital 5.000. |
| Sync | `store.tsx` | A cada 0,9 s online: PENDING→READY→SYNCED. `failNext` faz o próximo virar FAILED. |

## Faixas de referência (com fonte)
| Indicador | Faixa | Fonte |
|---|---|---|
| FC repouso | 60–100 bpm | AHA, adultos |
| PA sistólica / diastólica | < 120 / < 80 mmHg | AHA/ACC 2017, categoria normal |
| SpO₂ | 95–100 % | Faixa geral em ar ambiente |
| FR | 12–20 rpm | Faixa geral adulto em repouso |
| Temperatura | 36,1–37,2 °C | Faixa geral adulto |
| Glicose (CGM) | 70–180 mg/dL | Consenso internacional de tempo no alvo, 2019 |
| Sono | ≥ 7 h | AASM/SRS 2015 |
| Treino | meta 120 min | NASA: tripulantes da ISS treinam cerca de 2 h/dia |
| Água | meta 2 L | HIPÓTESE ASTRA (meta da demo) |
| Radiação acumulada | limite de carreira 600 mSv | NASA-STD-3001 |
VFC, CO₂ e autorrelatos: **sem faixa** (comparar só consigo mesmo).

## Telas
| Rota | Tela | Requisitos |
|---|---|---|
| `#/` | **Minha Jornada**: Astrido falando, trilha de missões em zigue-zague, anéis Corpo/Mente/Espírito, semana da ofensiva, mini-liga | 3, 4 |
| `#/prontuario` | **Meu Prontuário**: cabeçalho do tripulante (Polaris · DEMO-01 · dia 46), cartão de radiação acumulada, grupos de cartões | 1, 9 |
| `#/prontuario/:code` | **Detalhe**: gráfico + janela, insight, por quê / o que não significa, tabela, fontes, ações | 2, 9 |
| `#/checkin` / `#/noturno` | **Check-in** em 2 passos: preencher → revisar → salvar | 5 |
| `#/respirar` | Respiração guiada de 60 s (inspira 4 s, solta 6 s) com o Astrido calmo; botão "pular (demo)" | 3 |
| `#/gratidao` | Escolher 3 de 10 opções (sem texto livre) | 3, 5.6 |
| `#/desafios` | Nível, desafios semanais, conquistas, liga completa | 6 |
| `#/contexto` | Cartões NASA/CSA + filtro de hazards | 7 |
| `#/integracoes` | **Integrações**: conectores, status honesto, sincronizar agora, exportar FHIR | 11 |
| `#/linha-do-tempo` | Filtros Registros/Fila, controles do enlace, reiniciar demo | 8 |

Componentes globais: **TopBar** (logo, abas, 🔥 ofensiva, ⭐ XP, barra de nível, botão de enlace), **faixa DEMO**, **BottomNav** no celular, **Celebration** (toast com Astrido animado e +XP quando uma missão conclui), **SupportDialog** (REQ-9).

## Integrações (arquitetura)
```
Conector (vestível/instrumento/ambiente/estudo) ──leitura bruta──▶ ingest() valida unidade, horário, faixa estrutural
        └─ status: SIMULADO | ROADMAP | REQUER AUTORIZAÇÃO              │
                                                                         ▼
                                              Observation { origin, sourceRef = connectorId, qualityState }
                                                                         │
                         Prontuário · Detalhe · Tendência ◀──────────────┤
                                                                         ▼
                                                 fhir.ts → Bundle FHIR R4 (export)
```
- Na demo, o simulador "fala" como cada conector `SIMULADO` (`sourceRef` = id do conector).
- Origem real futura: `authorized_external`, só depois de contrato de dados e autorização (base §31).

## Identidade visual
- Clara e brincalhona como no mockup original (arquivado em `obsidian-cofre/05-Arquivo/nasa-space-apps-2026/`): fundo branco, cartões arredondados (16–20 px), botões "fofinhos" com sombra inferior sólida.
- Tokens: verde `#3DBE4F` (ação), azul `#1CA7EC` (água/dados), laranja `#FF9600` (ofensiva), amarelo `#FFC21A` (Astrido/XP), roxo `#8B5CF6` (mente), rosa `#EC4899` (espírito), azul-noite `#0B1640` (espaço, cabeçalho).
- Fora/dentro da faixa: tons de azul e roxo, **nunca** vermelho/verde de risco.
- Nunito 600–900. Emojis como ícones (funcionam offline).

## Erros e estados vazios
- IndexedDB indisponível → app funciona em memória e mostra aviso "dados não serão guardados".
- Indicador sem pontos → "Sem registros neste período".
- < 2 pontos válidos → "Dados insuficientes para tendência".

## Testes
`src/domain/*.test.ts` com Vitest: tendência (7 casos da base §34), anti-mistura, faixa, níveis, XP não depende de sinal, simulador determinístico e cenário 72 h (7,5 → 6 → 5).
