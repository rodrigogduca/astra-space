# Segurança, privacidade e limites

## O que o Astra é
- Um **protótipo de hackathon** (NASA Space Apps Challenge 2026) que mostra como seria um prontuário de saúde gamificado para tripulantes.
- Um app de navegador, local-first, que funciona offline e guarda os dados só no aparelho.
- Uma interface **descritiva**: mostra o que foi registrado, o que mudou entre o primeiro e o último registro e qual fonte NASA/CSA dá contexto ao tema.

## O que o Astra não é
- **Não é dispositivo médico** nem sistema certificado para voo. A faixa "MODO DEMO · dados simulados · não é dispositivo médico" fica sempre visível.
- **Não diagnostica**, não prevê, não classifica risco, não recomenda tratamento nem dose.
- **Não alerta a Terra sozinho.** O pedido de apoio é uma escolha do tripulante, com confirmação.
- **Não usa IA generativa** para decidir nada sobre saúde. Todas as regras são determinísticas.
- **Não está conectado a nenhum sistema real da NASA ou da CSA.** ARCHeR, CANS, Bio-Monitor, ECLSS e ARED aparecem como conectores `SIMULADO` ou `ROADMAP`. As cinco páginas NASA/CSA são **contexto citável**, não dataset nem API.

## Dados fictícios
- Todo valor fisiológico, ambiental e de radiação da demo é **gerado pelo simulador** (`src/domain/simulator.ts`), com semente fixa. Nada vem de astronauta, NASA ou CSA.
- O tripulante "Polaris · DEMO-01", a "Missão demo ASTRA-1", o "dia 46", a ofensiva inicial de 12 dias, os 2.340 XP de base, os colegas da liga (Vega, Lyra, Orion, Altair) e a meta de treino da tripulação são **fictícios**.
- Todo dado simulado leva o selo `SIMULADO` na tela e a tag `SIMULATED` no FHIR exportado.

## Armazenamento local: IndexedDB não é cofre clínico
- O estado fica no IndexedDB do navegador, chave `astra-state-v1`, **sem criptografia**. Qualquer pessoa com acesso ao navegador pode ler.
- Não há login, conta, senha nem perfil real.
- "Reiniciar demo" apaga os dados locais (sobrescreve o estado salvo).
- Se o IndexedDB falhar, o app funciona em memória e avisa que os registros não serão guardados.
- Antes de qualquer dado real, a base (§28) exige: modelo de ameaça, controle de acesso por papel, criptografia, gestão de chaves, auditoria, backup, retenção e resposta a incidente.

## Salvaguardas da base mantidas no MVP
| Salvaguarda | Como o código cumpre |
|---|---|
| Origem sempre visível | Selos `SIMULADO`, `MANUAL`, `AUSENTE`, `NÃO COLETADO` em cartões, detalhe, revisão e linha do tempo; `sourceRef` mostra o conector. |
| Ausência não é zero | `value: null` → "—" + `AUSENTE`; `ingest()` marca `missing`; tendência ignora; FHIR usa `dataAbsentReason`. Testado. |
| Sem limiar inventado | Faixa só com fonte escrita no catálogo; metas da equipe aparecem como `HIPÓTESE ASTRA`. |
| Sem semáforo clínico | Fora/dentro da faixa em azul e roxo; texto "referência geral, não personalizada". |
| Sem mistura de origens | `describeTrend` bloqueia; `trendForLatestOrigin` compara só a origem mais recente e conta o que ficou de fora. |
| Sem linguagem de diagnóstico | Teste com 162 combinações de estado do Astrido contra "risco", "piora", "perigo", "anormal". |
| Gamificação só de hábito | XP fixo por missão; teste prova que mudar os sinais não muda XP (REQ-3.6). |
| Liga sem dado de saúde | Só XP aparece, com aviso na tela. |
| Sem texto livre | Check-in por escalas e botões; gratidão por lista fechada. |
| Apoio humano por escolha | Diálogo mostra canal (simulado), o que vai (só o pedido de contato) e pede confirmação. |
| Persistir antes de enviar | Tudo grava no IndexedDB; a fila só envia (simulado) com o enlace ligado. |
| Histórico append-only | Check-in novo não apaga o anterior; não há edição/remoção. |

## Acessibilidade feita
- Navegação por teclado em todas as telas; foco visível (`:focus-visible`).
- Foco vai para o título ao trocar de tela.
- Diálogo de apoio com foco preso, Esc para fechar e retorno do foco.
- Rótulos ARIA em gráficos, anéis, trilha de missões, botões 0–10, filtros (`aria-pressed`) e interruptor (`role="switch"`).
- Tabelas com `caption` e cabeçalhos com `scope`.
- Contraste AA nos botões com texto branco (corrigido na revisão).
- Botões 0–10 maiores no celular; layout de 360 px a desktop.
- `prefers-reduced-motion` desliga animações.

## Pendências conhecidas
Da seção "Pendentes" do `specs/01-astra-mvp/tasks.md` (classificadas como menores, não bloqueiam a demo):
- [ ] Gráfico acessível por teclado e toque. Hoje a leitura ponto a ponto só funciona com mouse; a tabela de registros abaixo cobre o conteúdo.
- [ ] `aria-live` do Respirar anunciar só a troca de fase (hoje anuncia a contagem) e botão "Recomeçar".
- [ ] Selo "(demo)" na ofensiva, no XP de base, na liga e no "Dia 46".
- [ ] Link oficial do Bio-Monitor (CSA) a confirmar pela equipe: {{link oficial do Bio-Monitor}}.

Também em aberto no `tasks.md`: G3 (esta documentação) e G4 (hub do projeto no cofre + log).

Observações encontradas ao documentar (não estão no `tasks.md`):
- "Sincronizar agora" no conector `cenario-demo` não gera registro novo, mas mostra "Nova leitura simulada recebida".
- O estado de qualidade `unverified` e a origem `authorized_external` existem no contrato, mas nada na demo os produz; o status `requer_autorizacao` não é usado por nenhum conector.
- A fala de offline do Astrido perde prioridade para a fala do sono em queda (antes do check-in matinal).
- A semana da ofensiva na Jornada mostra os 6 dias anteriores sempre acesos (história fictícia).
- A função `clearLocalData()` existe em `store.tsx` mas não é chamada; o reinício usa a ação `reset`.
- O FHIR exportado não foi validado num validador oficial.

## Fora do MVP
Login real, backend, conexão real com sensores e estudos, diagnóstico, alerta automático à Terra, IA generativa decidindo saúde, texto livre, edição/remoção de registro, PWA instalável, tradução.

## Roadmap (fases da base, §33, com o status atual)
| Fase | Entrega | Gate | Status |
|---|---|---|---|
| 0 · Especificação | Documento, fontes, cenário | Revisão da equipe; confirmar regra de dataset | **Feita**: PDF transcrito em `specs/00-base`; specs do MVP aprovadas em 2026-11-14. Regra de dataset do desafio: {{confirmar se o desafio exige um recurso de dados NASA específico}}. |
| 1 · Demo local | React/TS, check-in, IndexedDB, tendência, fontes | Testes unitários; rede desligada; dados rotulados | **Feita, com escopo ampliado** (todos os sinais simulados, gamificação, central de integrações, FHIR). 249 testes passando; roteiro offline verificado no navegador. Pendências menores acima. |
| 2 · Usabilidade | Teste formativo | Revisão humana | **A fazer.** Nenhum teste com usuários foi feito; as escalas 0–10 seguem como hipótese. |
| 3 · Integração | API Node/PostgreSQL, fonte de dados, sync real, origem `authorized_external` | Permissão, segurança, auditoria, contrato de dados | **A fazer.** Pré-requisitos de segurança da base (§28) ainda não iniciados. |
| 4 · Operacional | Só com aprovação de autoridades | Validação clínica e regulação | **Fora do alcance do hackathon.** |
