# Guia de desenvolvimento

## Pré-requisitos
- **Node.js** e **npm**. Testado com Node 24.15.0 e npm 11.12.1. Versão mínima oficial: {{versão mínima do Node exigida pelo Vite 8}}.
- Navegador moderno com IndexedDB (Chrome, Edge, Firefox, Safari).
- Dependências principais (`package.json`): React 19, `idb-keyval` 6, `@fontsource-variable/nunito` 5; dev: TypeScript 7 (versão nativa), Vite 8, `@vitejs/plugin-react` 6, Vitest 5.

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências. |
| `npm run dev` | Servidor de desenvolvimento do Vite (por padrão em `http://localhost:5173`). |
| `npm test` | `vitest run`: roda todos os testes uma vez. |
| `npm run build` | `tsc -b && vite build`: checa os tipos e gera `dist/`. |
| `npm run preview` | Serve o `dist/` gerado, para testar o build final. |

### Números atuais (2026-11-14)
- **Testes:** 8 arquivos, **249 testes, todos passando** (`npx vitest run`, ~0,5 s).
- **Build:** 53 módulos; `index.js` **329,34 kB** (101,33 kB gzip); `index.css` **44,25 kB** (9,53 kB gzip); 5 arquivos de fonte Nunito `.woff2` (13 a 39 kB cada); `index.html` 0,53 kB.

## Como reiniciar a demo
Antes de apresentar, deixe a demo no estado inicial (ofensiva 12, 2.340 XP, nenhuma missão feita, fila vazia):
1. Abra **Fila** (`#/linha-do-tempo`).
2. Em **Zona de perigo**, clique em **🔄 Reiniciar demo** e confirme em **Sim, apagar e reiniciar**.

Alternativa: nas ferramentas do navegador, apague o IndexedDB do site (banco do `idb-keyval`, chave `astra-state-v1`) e recarregue.

Dicas:
- O histórico simulado é gerado a partir do momento da abertura. Se o estado salvo tem mais de 1 h, a âncora é renovada sozinha.
- A fala do Astrido sobre sono só aparece **antes** do check-in matinal do dia. Se já fez o check-in, reinicie a demo.
- Depois das 22 h o Astrido aparece sonolento no ramo padrão.

## Como adicionar um indicador
1. **`src/domain/types.ts`**: acrescente o código em `IndicatorCode`.
2. **`src/domain/indicators.ts`**: acrescente um item em `INDICATORS` com `name`, `short`, `unit`, `decimals`, `pillar`, `group`, `icon`, `inputMode`, `sensor` (se telemetria, sempre "(simulado)"), `scaleNote` e `referenceIds`. **Só ponha `range` se tiver fonte escrita** em `range.source`; meta inventada pela equipe usa `kind: "meta_demo"`.
3. **`src/domain/integrations.ts`**: acrescente o limite estrutural em `STRUCTURAL_BOUNDS` (o TypeScript obriga) e inclua o código em `feeds` de algum conector.
4. **`src/domain/simulator.ts`**: se for telemetria, gere valores em `generateSynthetic` e, se o conector puder "sincronizar agora", ponha base e amplitude em `LIVE_BASE`. Se for autorrelato, inclua em `DAILY` ou `PAST_DAYS_TOTALS`.
5. **`src/domain/fhir.ts`**: se a unidade for nova, mapeie em `UCUM_UNITS`. Só acrescente em `LOINC_CODES` se o código LOINC estiver **confirmado**.
6. Se for coletado no check-in, inclua o campo em `screens/CheckIn.tsx`.
7. Rode `npm test`: os testes do catálogo checam unidade, faixa com fonte e códigos únicos; os do simulador checam unidade e conector de cada item.

O Prontuário e o Detalhe se montam sozinhos a partir do catálogo.

## Como adicionar um conector
1. **`src/domain/integrations.ts`**: acrescente um item em `CONNECTORS` com `id`, `name`, `institution`, `kind`, `status`, `measures`, `feeds`, `sourceNote` e, se houver fonte NASA/CSA, `referenceId`.
2. Escolha o **status honesto**: `simulado` (a demo gera dados), `roadmap` (previsto, sem dados) ou `requer_autorizacao`. Nunca escreva que está conectado de verdade.
3. Se for `simulado` e deve gerar leitura em "Sincronizar agora", garanta que os indicadores de `feeds` tenham entrada em `LIVE_BASE` (`simulator.ts`).
4. Se ele deve ser o "dono" do histórico simulado de um indicador, confira a ordem em `CONNECTORS`: `connectorFor()` pega o primeiro `simulado`/`ativo` que alimenta o código.
5. Atualize o teste `connectorFor` em `integrations.test.ts` se mudar a atribuição.

A tela Integrações lista o novo conector automaticamente.

## Como adicionar uma missão
1. **`src/domain/gamification.ts`**: acrescente o id em `MissionId` e um item em `MISSIONS` (`title`, `subtitle`, `icon`, `pillar`, `xp`; para missão com progresso: `goal`, `unit`, `step`).
2. Se a missão tem tela própria, crie `src/screens/<Tela>.tsx` + `<Tela>.css`, registre a rota em `App.tsx` e o caminho em `ROUTES` (`screens/Jornada.tsx`) e `MISSION_ROUTE` (`domain/astrido.ts`). A tela conclui com `dispatch({ type: "complete", id })`.
3. Missão com meta e sem tela usa `dispatch({ type: "progress", id })` e conclui sozinha ao bater o `goal`.
4. Se o total do dia deve aparecer no Prontuário, mapeie em `TODAY_TOTALS` (`store.tsx`).
5. Se houver conquista ligada, acrescente em `badges()`.
6. Lembre: o XP é fixo por missão e **nunca** pode depender do valor de um sinal (há teste para isso). Note que `ZIGZAG` da trilha tem 8 posições e repete.

## Convenções
- **Selo `SIMULADO` em todo dado simulado**, inclusive em fala do Astrido que cite número simulado.
- **`null` ≠ 0.** Ausência é `value: null`, mostrada como "—" com selo `AUSENTE` (ou `NÃO COLETADO` se não há registro).
- **Nunca palavra de diagnóstico** em texto da interface: nada de "risco", "piora", "perigo", "anormal", "normal/seguro". Descreva o que foi registrado.
- **Faixa só com fonte escrita** no catálogo; cores neutras (azul/roxo), nunca vermelho/verde de risco.
- **Sem texto livre**: escalas, botões e listas fechadas.
- **CSS por tela + tokens**: cada tela tem `src/screens/<Tela>.css`; o global `styles.css` tem só tokens (`--green`, `--blue`, `--orange`, `--yellow`, `--purple`, `--pink`, `--night`, `--corpo`, `--mente`, `--espirito`...) e classes compartilhadas (`.page`, `.card`, `.btn`, `.chip`, `.tag`...). Use `var(--...)`, não cores soltas.
- **Domínio sem React**: regras novas vão para `src/domain/` com teste ao lado.
- Comentários e textos em português do Brasil. Cada mudança cita o requisito (`REQ-x.y`).

## Estratégia de testes
Vitest em ambiente `node` (`vite.config.ts`), sem testes de interface. Foco no domínio e no reducer.

| Arquivo | Testes | O que cobre |
|---|---|---|
| `domain/astrido.test.ts` | 169 | 162 combinações de estado sem linguagem clínica proibida + sono em queda, offline, apoio, dia completo, anti-mistura |
| `domain/gamification.test.ts` | 21 | níveis, XP/contagens/pilares, conquistas, desafios semanais, XP independente do valor dos sinais (REQ-3.6) |
| `domain/trend.test.ts` | 20 | subida, descida, igual, insuficiente, inválido, ausente, não verificado, `null`, ordem, mistura, duplicidade, `trendForLatestOrigin`, `withinWindow` |
| `domain/indicators.test.ts` | 9 | catálogo (códigos únicos, faixa com fonte, unidade), `rangePosition`, `formatValue` |
| `domain/integrations.test.ts` | 9 | `ingest` aceita/rejeita (unidade, horário, limite, `null`), origem, `sourceRef`, `connectorFor` |
| `domain/simulator.test.ts` | 8 | determinismo, ids únicos, unidade e conector, cenário 72 h da base |
| `domain/fhir.test.ts` | 7 | Bundle R4, LOINC, sistema local, `valueInteger`, `dataAbsentReason`, tag SIMULATED, exclusão de inválidos |
| `store.test.ts` | 6 | XP sem duplicar, ofensiva e conquistas, virada do dia, ingestão no check-in, `syncState` seguindo a fila, falha e retry |
| **Total** | **249** | |

A verificação de interface (roteiro da banca, offline → fila → reconectar) foi feita manualmente no navegador (tarefa G2 do `tasks.md`).

## Método: specs e frentes de agentes
O projeto foi feito de forma **spec-driven** (ver `specs/README.md`): nada vira código sem estar numa spec aprovada.

1. **Planejamento** (orquestrador): PDF da equipe → `requirements.md` (o quê, em EARS), `design.md` (como), `tasks.md` (passos com dono e requisito).
2. **Aprovação** (equipe humana): "sim" explícito.
3. **Desenvolvimento** em paralelo por frentes, cada uma mexendo só nos seus arquivos: A fundação, B Jornada, C Prontuário, D fluxos (check-in, contexto, desafios, fila), H integrações, E testes.
4. **Revisão** (agente `revisor`): diff contra requisitos e salvaguardas. Os achados e o que foi corrigido estão em `tasks.md` → "Achados da revisão".
5. **Verificação** (orquestrador): build e testes verdes, roteiro no navegador.
6. **Documentação** (agente `documentador`): esta pasta `docs/`.

Requisito novo volta para a frente 1 e passa pela 2. Commit e push são sempre da equipe.
