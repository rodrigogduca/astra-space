---
spec: 01-astra-mvp
fase: tarefas
status: aprovado (2026-11-14)
atualizado: 2026-11-14
---
# Tarefas — Astra MVP

Legenda: `[x]` feito · `[ ]` a fazer. Cada frente mexe só nos **seus arquivos** para os agentes trabalharem em paralelo sem conflito. CSS de tela fica em `src/screens/<Tela>.css`; o `styles.css` global é só da Frente A.

## Frente A — Fundação (orquestrador)
- [x] A1 Projeto Vite + React + TS, dependências, `tsconfig`, `index.html`, ícone · REQ-10.4
- [x] A2 `domain/types.ts` (contrato da base) · REQ-1, 8
- [x] A3 `domain/indicators.ts` (19 indicadores, faixas com fonte) · REQ-1.1, 1.3
- [x] A4 `domain/references.ts` (5 fontes) · REQ-7.1
- [x] A5 `domain/trend.ts` (`describeTrend`, `trendForLatestOrigin`) · REQ-2.2, 2.3
- [x] A6 `domain/simulator.ts` (7 dias + cenário 72 h) · REQ-1, 10.1
- [x] A7 `domain/gamification.ts` · REQ-3, 6
- [x] A8 `store.tsx` (estado, IndexedDB, fila simulada) · REQ-8
- [x] A9 `components/Astrido.tsx`, `components/ui.tsx`, `components/Chart.tsx` · REQ-1.2, 2.1, 4.1
- [x] A10 `domain/astrido.ts` (humor + fala por contexto) · REQ-4
- [x] A11 `styles.css` (tokens + componentes compartilhados), `main.tsx`, `App.tsx` (rotas por hash), `TopBar`, `BottomNav`, faixa DEMO · REQ-10.1, 10.2, 8.2
- [x] A12 `SupportDialog` e `Celebration` globais · REQ-9, 3.3
- [x] A14 `domain/integrations.ts` (catálogo de conectores + `ingest`) e `sourceRef` do simulador apontando para os conectores · REQ-11.1–11.3, 11.6
- [x] A13 Telas provisórias (stubs) para o build passar antes das frentes B–D

## Frente B — Jornada (agente `dev-jornada`)
- [x] B1 `screens/Jornada.tsx` + `.css`: Astrido com fala, trilha em zigue-zague, ações por missão · REQ-3.1, 3.2, 4
- [x] B2 Painel lateral: anéis por pilar, semana da ofensiva, mini-liga · REQ-3.4, 3.5, 6.3
- [x] B3 `screens/Respirar.tsx` (60 s guiado) e `screens/Gratidao.tsx` (3 de 10) · REQ-3.1, 5.6

## Frente C — Prontuário (agente `dev-prontuario`)
- [x] C1 `screens/Prontuario.tsx` + `.css`: cabeçalho, radiação acumulada, grupos de cartões · REQ-1
- [x] C2 `screens/Indicador.tsx` + `.css`: gráfico com janelas, insight, por quê/não significa, tabela, fontes, ações · REQ-2, 9.1

## Frente D — Check-in, contexto, desafios e fila (agente `dev-fluxos`)
- [x] D1 `screens/CheckIn.tsx` + `.css` (matinal e noturno, revisão antes de salvar) · REQ-5
- [x] D2 `screens/Contexto.tsx` + `.css` · REQ-7
- [x] D3 `screens/Desafios.tsx` + `.css` · REQ-6
- [x] D4 `screens/LinhaDoTempo.tsx` + `.css` · REQ-8.3–8.6

## Frente H — Integrações (agente `dev-integracoes`)
- [x] H1 `domain/fhir.ts` (Bundle FHIR R4, LOINC confirmados, tag SIMULADO) + `domain/fhir.test.ts` · REQ-11.5
- [x] H2 `screens/Integracoes.tsx` + `.css` (status, última leitura, sincronizar, exportar JSON) · REQ-11.4, 11.7
- [x] H3 `domain/integrations.test.ts` (ingest aceita/rejeita) · REQ-11.6

## Frente E — Testes (agente `dev-testes`)
- [x] E1 `domain/trend.test.ts` (7 casos + anti-mistura) · REQ-10.5
- [x] E2 `domain/gamification.test.ts`, `domain/simulator.test.ts`, `domain/indicators.test.ts` · REQ-10.5, 3.6

## Frente F — Revisão (agente `revisor`)
- [x] F1 Revisar o diff contra requisitos e salvaguardas da base (selos, `null` ≠ 0, nenhuma palavra de diagnóstico, XP sem sinal) e relatar achados
- [x] F2 Orquestrador corrige achados bloqueantes

## Frente G — Verificação e entrega (orquestrador)
- [x] G1 `npm run build` e `npm test` verdes
- [x] G2 Rodar no navegador e percorrer o roteiro da banca (offline → fila → reconectar)
- [x] G3a PDF e mockup originais movidos para `obsidian-cofre/05-Arquivo/nasa-space-apps-2026/` (conteúdo transcrito em `specs/00-base`)
- [x] G3 Documentação técnica final em `docs/` + `README.md` na raiz
- [x] G4 Hub do projeto no cofre do Obsidian + log

## Achados da revisão (F1)
Corrigidos (2026-11-14): desafio semanal contando hoje em dobro; XP, ofensiva e conquistas que zeravam na virada do dia; `syncState` do registro manual parado; Astrido preso na mensagem de apoio e afirmando envio sem confirmação; fila inacessível no celular; ingestão não ligada e `NaN` aceito; contraste AA dos botões; diálogo de apoio sem foco/Esc; dado simulado sem selo na fala do Astrido; faixa DEMO saindo da tela; aviso de armazenamento não reativo; ids FHIR inválidos; comemoração repetida ao recarregar; proveniência dos autorrelatos simulados (novo conector `cenario-demo`); texto que soava como integração real; check-in reaproveitando estado; check-in noturno vazio dando XP; botões 0–10 pequenos no celular; foco no título ao trocar de tela.

Pendentes (MENOR, não bloqueiam a demo):
- [ ] Gráfico acessível por teclado/toque (hoje a tabela abaixo cobre).
- [ ] `aria-live` do Respirar anunciar só a troca de fase; botão "Recomeçar".
- [ ] Selo "(demo)" na ofensiva, XP base, liga e "Dia 46".
- [ ] Link oficial do Bio-Monitor (CSA) a confirmar pela equipe.
- [ ] Fala de offline do Astrido perde para a de sono em queda antes do check-in (REQ-4.3).
- [ ] "Sincronizar agora" no conector `cenario-demo` diz "nova leitura" sem gerar registro.
- [ ] Validar o Bundle FHIR num validador oficial.
