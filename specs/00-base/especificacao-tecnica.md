---
origem: ASTRA_especificacao_tecnica_completa.pdf (original arquivado em obsidian-cofre/05-Arquivo/nasa-space-apps-2026/)
versao-do-pdf: 1.0 (2026-11-14)
transcrito-em: 2026-11-14
status: referencia (não editar; mudanças vão para specs/01-astra-mvp)
---
# ASTRA — Especificação técnica completa (transcrição)

> Transcrição em Markdown do PDF base da equipe. Texto fiel ao original, com tabelas convertidas.
> Esta é a **fonte de verdade de contexto**. As decisões que vão além dela (gamificação, prontuário completo)
> estão em `specs/01-astra-mvp/requirements.md`, seção "Divergências em relação à base".

NASA Space Apps Challenge 2026 · Desafio: *Health Monitoring Software for Astronauts on Space Missions*.

## 1. Resumo executivo
Software visual, responsivo e local-first para registrar poucos sinais autorrelatados, mostrar mudanças descritivas ao longo de 72 horas, apresentar contexto NASA/CSA com fonte e limite de interpretação e oferecer um próximo passo seguro. Não é dispositivo médico, sistema certificado para voo nem integração operacional.

O MVP proposto contém três entradas: **duração de sono (h)**, **energia percebida (0–10)** e **humor opcional (0–10)**. São autorrelatos; a escala de energia e humor é hipótese de interface, não instrumento NASA validado. A fisiologia fica prevista no modelo de dados, mas desativada na demo: o material informa apenas que um indicador fisiológico estaria "estável", sem nome, unidade, origem, horário ou valor. O ASTRA deve exibir "não coletado", não fabricar medição.

As páginas NASA/CSA descrevem hazards, riscos, projetos de pesquisa e contexto de missão, mas não entregam série biomédica, limiar clínico ou telemetria do CANS. Entram como **biblioteca de evidências citáveis**, não como fonte automática de valores. [1][2][3][4][5]

**Decisão central:** mostrar "o que foi registrado, o que mudou, qual fonte contextualiza o tema, o que não se pode concluir e qual opção segura está disponível". Nenhum escore composto, previsão clínica, limiar inventado ou recomendação autônoma. Offline = persistência local e fila visível; a sincronização com a "Terra" é simulada.

## 2. Problema observado e recorte
Em missão, distância, isolamento, transições de gravidade, radiação e ambiente fechado formam contextos de risco. Instruções, suprimentos e apoio médico ficam mais difíceis de receber com a distância; sono inadequado e horários irregulares são relevantes à saúde e segurança. Isso não significa que um check-in possa inferir qual hazard causou uma mudança. [1][2][5]

Problema de produto: dados de bem-estar registrados em momentos diferentes ficam dispersos, sem origem explícita, histórico compreensível ou próximo passo. O protótipo ajuda a responder: *O que eu registrei? O que mudou? Que informação oficial é pertinente? O que não sabemos? Quero repetir o check-in ou solicitar apoio?* Apoio humano é escolha, nunca diagnóstico automático.

O recorte evita: prontuário clínico completo, recursos médicos, tripulação, previsão, protocolos de tratamento e cuidado autônomo.

## 3. Desafio NASA e objetivo
O desafio pede software visual de monitoramento de saúde para astronautas. A especificação converte isso em: entrada de dados com origem, interpretação descritiva, contexto rastreável, orientação não diagnóstica, histórico local e funcionamento sem conexão. [6][7]

As cinco páginas HRP/CSA são contexto, **não dataset nem API**. O projeto não afirma "integração de dados NASA". Se o desafio exigir um recurso de dados NASA específico, a equipe deve selecionar a fonte, verificar acesso, licença, variáveis e formato e documentar a integração separadamente.

## 4. Hazards NASA relevantes [1]
| Hazard HRP | O que a fonte permite afirmar | Tratamento no MVP |
|---|---|---|
| Radiação | Classificada entre os hazards; sem dose, instrumento ou desfecho individual. | Contexto; sem leitura ou score. |
| Isolamento/confinamento | Respostas comportamentais em equipes isoladas; seleção, treinamento e apoio. | Contexto; humor é autorrelato opcional, sem causalidade. |
| Distância da Terra | Instruções, suprimentos e cuidado médico ficam mais difíceis com a distância. | Contexto de autonomia; sync offline simulado. |
| Campos gravitacionais | Ajuste dos sistemas corporais a diferentes gravidades. | Roadmap/contexto; sem avaliação fisiológica. |
| Ambientes hostis/fechados | Temperatura, pressão, iluminação, ruído, micróbios e resposta imune. | Contexto; nenhuma leitura ambiental fornecida. |

"Contexto" = conteúdo explicativo com fonte; "roadmap" = possibilidade condicionada a instrumento, protocolo e dado externo. Só observações com fonte e unidade verificadas aparecem como medições.

## 5. Riscos de saúde citados pela NASA [2]
| Tema | Síntese da página HRP | Decisão de produto |
|---|---|---|
| Sono e horários | Sono inadequado e horários irregulares podem afetar saúde e segurança. | Sono autorrelatado; só descrever tendência. |
| Cardiovascular | Adaptações cardiovasculares em voo. | Sem FC, pressão ou alerta no MVP. |
| Imunidade | Respostas imunes alteradas. | Sem biomarcadores. |
| Sensório-motor/vestibular | Enjoo, tontura, coordenação nas transições. | Sem teste funcional. |
| Radiação/câncer | Risco de câncer induzido por radiação. | Sem cálculo de dose ou risco individual. |
| EVA | Lesão, desempenho, doença descompressiva, baixo O₂, alto CO₂. | Fora do escopo. |

"Risco descrito" não é resultado observado numa pessoa.

## 6. Pesquisas NASA em andamento [3]
| Investigação | O que a página informa | O que o ASTRA não deve alegar |
|---|---|---|
| ARCHeR (Artemis II) | Bem-estar, atividade e sono como tema de investigação. | Que dados Artemis II foram importados ou validados. |
| Immune Biomarkers | Sangue e saliva para estudar resposta imune. | Que biomarcadores ou resultados estão disponíveis. |
| B-Complex / Brain Fluid Pressure | Alterações cérebro/olhos e pressão de fluido. | Eficácia de suplemento ou causalidade. |
| Manual piloting / gravity transitions | Efeitos das transições de gravidade sobre a pilotagem. | Score de prontidão do HRP. |
| Spacecraft Occupant Protection | Desconforto na reentrada e dados de sensores. | Telemetria pronta para integração. |

## 7. Fontes e classes de dados
Quatro rótulos permanentes:
- **FATO DA FONTE:** afirmação atribuída, com URL, seção e data.
- **HIPÓTESE ASTRA:** decisão de produto ainda a validar.
- **DADO SIMULADO:** valor artificial da demo, sempre com selo.
- **INTERPRETAÇÃO DO SISTEMA:** cálculo descritivo reproduzível, nunca diagnóstico.

Observação = valor/estado, unidade, horário, origem, indicador, qualidade e sincronização. Referência NASA = afirmação, seção, hazard tags, URL, data e limitação. Referência não preenche campo de saúde nem vira limiar.

## 8. Como as fontes NASA/CSA entram no ASTRA
| Fonte | Informação | Hazard/risco | Indicador candidato | Uso | Tela/ação |
|---|---|---|---|---|---|
| [1] NASA Hazards | Cinco hazards; habitabilidade. | Todos os cinco. | Nenhum dado direto. | Contexto; sem alerta. | Contexto NASA; abrir fonte. |
| [2] NASA Risks | Sono, cardiovascular, imune, vestibular, radiação, EVA. | Riscos de saúde, não diagnósticos. | Sono autorrelatado. | Descrever sono. | Timeline/insight; repetir check-in ou pedir apoio. |
| [3] NASA Ongoing | ARCHeR e outros. | Pesquisa em saúde. | Categorias, sem série. | Biblioteca de pesquisa. | Contexto NASA. |
| [4] CSA Radiation | CANS em desenvolvimento (nêutrons). | Radiação de nêutrons. | Só com fonte operacional validada. | Sem CANS, dose ou score no MVP. | Cartão de contexto. |
| [5] CSA Space Science | Missões longas: exposição e dependência da Terra. | Gravidade, radiação, isolamento, atraso, autonomia. | Metadados de missão. | Contextualizar. | Resumo da missão. |

## 9. Entradas e indicadores do MVP
| Entrada | Unidade | Origem na demo | Cadência | Limite |
|---|---|---|---|---|
| Duração do sono | h | Manual; sintético no cenário | Um por check-in | Não mede qualidade, fase circadiana ou causa. |
| Energia percebida | 0–10 ordinal | Autorrelato; sintético | Junto ao check-in | Escala não validada. |
| Humor percebido | 0–10 ordinal | Autorrelato opcional | Junto ao check-in | Não diagnostica; sensível e omitível. |
| Fisiologia | depende da fonte | Nenhuma leitura ativa | — | Registrar como não coletado. |
| Ambiente e missão | da fonte | Não fornecido | Só com origem oficial | Leitura ausente não é zero. |

Cada campo numérico guarda `origin`, `observedAt`, `timezone`, `qualityState`, `syncState`. Dados simulados não podem ser exportados como telemetria real. Perfil com identificador fictício, sem texto livre.

## 10. Conceito
Interface de autoconsciência contextual. Fluxo: **registrar → validar → comparar → contextualizar → explicar → escolher → salvar → acompanhar**. Relação entre dado e fonte é temática e educativa, não causal.

## 11. Proposta de valor e hipótese
Tripulação: entender registros recentes e achar referência confiável sem conexão contínua. Equipe médica: registro rastreável se a missão autorizar. Banca: relevância espacial sem alegar sensor ou resultado inexistente. Hipótese só é aceita após teste de usabilidade.

## 12. Arquitetura geral
Duas trilhas separadas: biblioteca de evidências NASA/CSA e registros pessoais. Encontram-se só no motor de contexto por tópico. Camadas: catálogo de fontes; entrada; validação; repositório local; timeline; regra descritiva; contexto; orientação segura; outbox; sincronização. Backend Node.js/PostgreSQL é fase posterior. Estados PENDING, READY, SYNCED são de demonstração.

## 13. Arquitetura de dados
Entidades: perfil demo, check-ins, definições de indicador, observações, referências, insights, orientações, eventos de sync. Histórico **append-only**.

```ts
export type DataOrigin = "manual" | "synthetic" | "authorized_external";
export type QualityState = "valid" | "missing" | "invalid" | "unverified";
export type SyncState = "local_only" | "pending" | "ready" | "synced" | "failed";
export interface Observation {
  observationId: string;
  profileId: string; // demo id; não é identidade real
  indicatorCode: "sleep_duration" | "energy_self_report" | "mood_self_report" | string;
  value: number | string | null;
  unit: string | null;
  observedAt: string; // ISO-8601, com fuso
  origin: DataOrigin;
  sourceRef?: string;
  qualityState: QualityState;
  syncState: SyncState;
  isSynthetic: boolean;
}
```
`value: null` é ausência, nunca 0. Campos sem unidade/horário/fonte ficam `unverified`/`invalid` e não entram na tendência.

## 14. Lógica e regras
Motor determinístico; nenhum modelo generativo decide risco. Tendência: ≥2 observações válidas do mesmo indicador, ordena por tempo, diferença entre primeiro e último. Mostra direção e janela, nunca "normal/anormal/seguro/perigoso".

```ts
function describeTrend(points: Observation[]) {
  const valid = points
    .filter(p => p.qualityState === "valid" && typeof p.value === "number")
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  if (valid.length < 2) return { state: "insufficient_data" };
  if (valid.some(p => p.isSynthetic) && !valid.every(p => p.isSynthetic))
    return { state: "mixed_origins_blocked" };
  const first = valid[0], last = valid[valid.length - 1];
  const delta = Number(last.value) - Number(first.value);
  return { state: "descriptive_only", direction: delta < 0 ? "down" : delta > 0 ? "up" : "unchanged",
    delta, unit: first.unit, start: first.observedAt, end: last.observedAt,
    inputIds: [first.observationId, last.observationId], isSynthetic: valid.every(p => p.isSynthetic) };
}
```

## 15. Arquitetura técnica
Frontend: React, TypeScript, Vite, responsivo, acessível. PWA opcional (testar, não presumir). IndexedDB como repositório local. Domínio em TypeScript puro. Backend futuro: Node.js + REST + PostgreSQL (`GET /api/v1/references`, `POST /api/v1/check-ins`, `GET /api/v1/timeline?from=&to=`, `POST /api/v1/sync-events` com idempotência). IndexedDB não é "criptografado".

## 16. Fluxo do usuário
1. Visão geral: data, origem dos últimos registros, conexão simulada.
2. "Fazer check-in": sono, energia, humor opcional (pode pular).
3. Validação de unidade, horário, origem e ausência antes de salvar.
4. Tendência de 72 h com os registros que sustentam o cálculo.
5. Contexto NASA/CSA com link e ressalva "contexto não identifica causa".
6. Repetir/editar, salvar ou pedir o canal de apoio da missão.
7. Estado local; offline → PENDING; ao reconectar → READY → SYNCED.

## 17. Cenário demonstrativo de 72 h (DADOS SINTÉTICOS)
| Momento | Sono (h) | Energia | Humor | Fisiologia |
|---|---|---|---|---|
| T0 | 7,5 | 8 | 8 | Não coletada |
| T+36 h | 6 | 6 | 6 | Não coletada |
| T+72 h | 5 | 4 | 4 | Não coletada |

Saída esperada: sono −2,5 h; energia e humor −4. Pode dizer "os três registros seguem direção descendente". Não pode dizer "risco alto", "sono causou queda de humor", "piora clínica".

## 18–25. Telas
Sete telas: **Visão geral; Check-in; Detalhe do indicador; Insight; Orientação; Contexto NASA/CSA; Linha do tempo.** Estado offline persistente na Visão geral e Linha do tempo. Modo DEMO e selo SIMULADO sempre visíveis.
- **Visão geral:** cartões com valor, unidade, hora e origem; botão "Fazer check-in"; sem semáforo clínico. Estados: primeira utilização, dados ausentes, simulados, fila pendente, erro de armazenamento.
- **Check-in:** sono, energia, humor opcional, "Você se sente diferente do habitual?" (não / sim, gostaria de registrar / quero ver apoio). Sem texto livre. Campo pulado = `missing`.
- **Detalhe:** série, timestamps, origem por ponto, regra aplicada, editar/remover; sem comparação com outra pessoa. Menos de 2 pontos → "dados insuficientes para tendência".
- **Insight:** frase descritiva, valores, timestamps, IDs, regra e versão, origem, fonte, limite. "Por que estou vendo isto?" e "O que isto não significa?".
- **Orientação segura:** revisar dado, novo check-in, abrir fonte, "quero apoio" com canal da missão. Sem dose, tratamento ou escalonamento automático.
- **Contexto NASA/CSA:** instituição, título, data, seção, afirmação, hazard tags, link, limitação. "Abrir fonte" / "Entendi — voltar ao dado".
- **Linha do tempo:** filtros registros/insights/fila; legenda MANUAL, SIMULADO, EXTERNO AUTORIZADO, AUSENTE.

## 26. Offline, fila e sincronização
Ação confirmada persiste no IndexedDB antes de qualquer envio. Evento com id e chave de idempotência. Estados: LOCAL_ONLY, PENDING, READY, SYNCED, FAILED (com "tentar novamente"). Append-only; sem mesclar valores silenciosamente.

## 27. Matriz de rastreabilidade
| ID | Fonte | Dado ASTRA | Lógica | Tela | Prova esperada |
|---|---|---|---|---|---|
| R-01 | [1] hazards | Referência curada | Tag por tema | Contexto | URL/seção/limite visíveis |
| R-02 | [2] sono | Sono autorrelatado | Delta ≥2 pontos | Detalhe + Insight | Teste determinístico |
| R-03 | [3] ARCHeR | Só referência | Agenda, não resultado | Contexto | Texto diz "pesquisa" |
| R-04 | [4] CANS | Sem dose no MVP | Bloquear valor sem origem | Contexto radiação | Sem alerta de exposição |
| R-05 | [5] missões longas | Metadado só se fornecido | Contexto | Resumo da missão | Campo com fonte/data |
| R-06 | [1][5] distância | Conectividade simulada | Persistir local; não zerar | Visão geral + fila | Teste com rede desligada |
| R-07 | [2][3] sono/desempenho | Energia/humor sintéticos | Sem score mental | Check-in + Insight | Rótulos e opt-out visíveis |

## 28. Segurança
Sem login real; perfil fictício; dados artificiais; sem texto livre ou upload; conteúdo NASA local; nenhuma transmissão automática. IndexedDB não é cofre clínico: oferecer limpeza local. Antes de dados reais: modelo de ameaça, RBAC, criptografia, chaves, auditoria, backup, retenção, resposta a incidente.

## 29. Privacidade
Dados fictícios. Humor opcional e individual; compartilhar exige decisão separada e clara. Nada individual agregado à equipe sem regra aprovada. Nenhum diário pessoal em tela de crew/gestão por padrão.

## 30–32. Diferenciais, limitações e fora do MVP
Diferencial: cadeia verificável **observação → proveniência → comparação → fonte → ressalva → escolha humana → registro local**; não ocultar ausência de dados.
Fora do MVP (base): prontuário clínico real, diagnóstico, limiares médicos, sensores contínuos, cálculo de radiação individual, CANS, sangue/saliva, inferência mental, previsão, tratamento, prescrição, medicamentos, visão agregada da tripulação, alerta automático à Terra, IA generativa para decisão.

## 33. Roadmap
| Fase | Entrega | Gate |
|---|---|---|
| 0 especificação | Documento, fontes, cenário | Revisão da equipe; confirmar regra de dataset |
| 1 demo local | React/TS, check-in, IndexedDB, tendência, fontes | Testes unitários; rede desligada; dados rotulados |
| 2 usabilidade | Teste formativo | Revisão humana |
| 3 integração | API Node/PostgreSQL, fonte de dados, sync real | Permissão, segurança, auditoria |
| 4 operacional | Só com aprovação de autoridades | Validação e regulação |

## 34. Métricas de avaliação
Proveniência 100%; regra correta para subida/descida/igualdade/ausência/inválido/duplicidade/mistura; offline sem perda; 100% das mensagens de contexto com referência e ressalva; usabilidade; acessibilidade (teclado, contraste, foco, leitor de tela).

## 35. Aderência (status da base)
Software visual, monitoramento, contexto NASA, orientação segura, offline e apresentação: AMARELO (especificado). Validade clínica: VERMELHO.

## 36. Apresentação à banca
**Pitch 45 s (base):** "ASTRA transforma poucos check-ins pessoais em uma linha do tempo explicável. Mostra o que foi registrado, compara mudanças sem chamar isso de diagnóstico, conecta o tema a uma fonte NASA/CSA com ressalvas e permite escolher um próximo passo seguro. A demo usa dados sintéticos, mantém a origem visível e continua registrando localmente sem conexão."

**Roteiro de demo:** (1) problema + fonte NASA; (2) registros sintéticos; (3) insight com diferença, IDs e timestamps; (4) referência e "contexto, não causalidade"; (5) rede simulada desligada e fila pendente; (6) limites e gates.

**Perguntas previsíveis:**
- *Onde estão os dados da NASA?* As cinco páginas são fontes de riscos, hazards e pesquisa, não feeds. Não declaramos dataset integrado.
- *E se o usuário piorar?* O MVP não classifica saúde; mostra a sequência, explica o cálculo e oferece canal de apoio.
- *A NASA mediu esse valor?* Não. Cenário sintético e rotulado.

## Referências
1. NASA HRP — 5 Hazards of Human Spaceflight (atualizada 2026-06-12) — https://www.nasa.gov/hrp/hazards/
2. NASA HRP — Risks of Human Spaceflight (2026-07-21) — https://www.nasa.gov/hrp/risks/
3. NASA HRP — Ongoing HRP Research in Space (2026-08-18) — https://www.nasa.gov/hrp/ongoing-hrp-research/
4. CSA — Monitoring radiation for astronaut health (2026-02-26) — https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
5. CSA — Why do we conduct science experiments in space? (2025-10-28) — https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp
6. Space Apps 2026 — Create Health Monitoring Software for Astronauts — https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/
7. Space Apps — Judging & Awards Guide — https://www.spaceappschallenge.org/resources/judging-awards-guide/
8. NASA — Crew-13 human health study (imagem de capa, 2026-09-24) — https://www.nasa.gov/humans-in-space/nasa-to-study-human-health-performance-during-crew-13-mission/

## Glossário
API, CANS (Crew Active Neutron Spectrometer), EHR (prontuário eletrônico), HRP (Human Research Program), idempotência, ISS, MVP, proveniência, PWA, UX.
