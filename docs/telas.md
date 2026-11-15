# Telas

Rotas por hash, tratadas em `src/App.tsx` (função `Screen`). Rota desconhecida cai na Jornada. Ao trocar de tela, a página volta ao topo e o foco vai para o `<h1>` (leitor de tela percebe a mudança).

## Elementos globais (todas as telas)
| Elemento | Arquivo | O que faz | Requisitos |
|---|---|---|---|
| Faixa **MODO DEMO** | `App.tsx` | "MODO DEMO · dados simulados · não é dispositivo médico · NASA Space Apps 2026", dentro do cabeçalho fixo | REQ-10.1 |
| Aviso de armazenamento | `App.tsx` | Aparece se o IndexedDB falhar: "seus registros não serão guardados ao fechar" | REQ-8.1 |
| **TopBar** | `components/TopBar.tsx` | Logo com o Astrido, 6 abas (Jornada, Prontuário, Desafios, Integrações, NASA/CSA, Fila), 🔥 ofensiva (apagada se a meta de hoje ainda não foi batida), ⭐ XP, barra de nível, botão **Enlace on / Offline** | REQ-3.4, 8.2, 10.2 |
| **BottomNav** | `components/TopBar.tsx` | As mesmas 6 seções numa barra inferior no celular | REQ-10.2 |
| **Celebration** | `components/Celebration.tsx` | Toast com o Astrido animado e "+XP" por 2,6 s quando uma missão conclui | REQ-3.3 |
| **SupportDialog** | `components/SupportDialog.tsx` | Pedido de apoio: canal (cirurgião de voo, `SIMULADO`), o que será enviado (só o pedido de contato), aviso offline, confirmação. Foco preso no diálogo, Esc fecha, foco volta ao botão | REQ-9.1, 9.2, 10.3 |

---

## `#/` · Minha Jornada
**Objetivo:** tela inicial gamificada; dizer o que fazer hoje.

**Componentes**
- Cabeçalho "Dia 46 · Missão demo ASTRA-1" e contador "N de 9 missões hoje".
- **Astrido com balão de fala** (`astridoSays`) e botões de ação; balão com `aria-live`.
- **Trilha em zigue-zague** das 9 missões: nó redondo com anel de progresso (missões com meta), pilar, título, subtítulo, progresso ("750/2.000 mL"), "+XP" e botão. O Astrido pequeno fica ao lado da próxima missão.
- Painel lateral: **Metas de hoje** (3 anéis Corpo/Mente/Espírito), **Ofensiva** (contador + últimos 7 dias), **Liga da tripulação** (top 5, link "Ver tudo").

**Ações:** abrir check-in, noturno, respiração ou gratidão; "Sincronizar" (Sinais do dia); "+250 mL", "+30 min", "+15 min", "+5 min"; ações do Astrido (check-in, ver detalhe do sono, pedir apoio, ver fila).

**Requisitos:** REQ-3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 6.3, 9.1.

Nota: na semana da ofensiva, os 6 dias anteriores aparecem sempre acesos (história fictícia da demo); só "hoje" reflete o estado real.

## `#/prontuario` · Meu Prontuário
**Objetivo:** ver todos os sinais num só lugar.

**Componentes**
- Cabeçalho do tripulante: "Polaris · DEMO-01", "Missão demo ASTRA-1 · dia 46", botão **🤝 Pedir apoio** e legenda dos selos (SIMULADO, MANUAL, AUSENTE, NÃO COLETADO).
- **Radiação acumulada da missão**: estimativa em mSv, barra contra 600 mSv, porcentagem, selo `SIMULADO`, "CANS não conectado".
- Grupos: Sinais vitais, Metabolismo, Radiação e ambiente, Sono/água/treino, Mente, Espírito. Pressão sistólica e diastólica aparecem num cartão só ("118/76").
- Cada cartão: ícone, nome, valor + unidade (ou "—"), posição na faixa em cor neutra (ou "valor anterior: ..." se o último registro veio vazio), minigráfico de 72 h, selo de origem, horário relativo e conector.

**Ações:** abrir o detalhe de qualquer indicador; pedir apoio.

**Requisitos:** REQ-1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 11.3.

## `#/prontuario/:código` · Detalhe do indicador
**Objetivo:** entender o que mudou e por quê o Astra está mostrando isso.

**Componentes**
- Voltar ao prontuário; cabeçalho com ícone, nome, unidade, pilar, sensor fictício, valor atual, selo de origem, data e conector; bloco da **faixa** com fonte ("referência geral, não personalizada" ou `HIPÓTESE ASTRA`), ou a nota de escala.
- **Gráfico** (`LineChart`, SVG) com janelas **24 h / 72 h / 7 d** e a faixa sombreada em azul-claro. Leitura do ponto ao passar o mouse. Para pressão, dois gráficos (sistólica e diastólica).
- **Insight** (selo `INTERPRETAÇÃO DO SISTEMA`): frase com valores inicial e final, datas, Δ e direção; ids dos registros usados; regra `describeTrend` versão `trend-v1`; origem; aviso de quantos registros de outra origem ficaram de fora. Estados "Dados insuficientes para tendência" e "Tendência não calculada" quando for o caso.
- "**Por que estou vendo isto?**" e "**O que isto não significa?**" (`<details>`).
- **Tabela de registros** (20 mais recentes da janela): horário, valor, origem, conector, qualidade, sincronização.
- **Contexto NASA/CSA**: cartões das referências do indicador com `FATO DA FONTE`, limitação e "Abrir fonte ↗".

**Ações:** trocar janela; "Fazer check-in" (só em indicadores de autorrelato); "🤝 Pedir apoio".

**Requisitos:** REQ-2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 11.3.

## `#/checkin` e `#/noturno` · Check-in
**Objetivo:** registrar autorrelatos em 2 passos, sem texto livre.

**Componentes**
- **Matinal:** sono (stepper de 0,5 h, 0–14 h, atalho "Usar 7 h"), energia 0–10 (obrigatória), humor 0–10 (opcional, "Pular"), "Você se sente diferente do habitual?" (Não / Sim, quero registrar / Quero ver apoio disponível).
- **Noturno:** estresse e propósito 0–10, ambos opcionais, mas pelo menos um precisa ser respondido.
- Passo 2 — **Revisar antes de salvar:** tabela com campo, valor, unidade, horário e origem (`MANUAL` ou `AUSENTE`) + nota "campos pulados são salvos como ausentes, nunca como zero".
- Tela final: Astrido animado, "+XP" (ou aviso de que o XP já foi contado hoje), onde o dado foi salvo e se a fila está offline.

**Ações:** Revisar, Voltar e editar, Salvar, Fazer outro registro, Ver no prontuário. Escolher "Quero ver apoio disponível" abre o diálogo de apoio depois de salvar.

**Requisitos:** REQ-5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 9.1, 8.3.

## `#/respirar` · Pausa de respiração
**Objetivo:** missão de 60 s guiada (inspira 4 s, solta 6 s, 6 ciclos) com o Astrido calmo dentro de um círculo que cresce e encolhe.

**Ações:** Começar, Concluir (só no fim), **Pular (demo)**, Voltar.

**Requisitos:** REQ-3.1. Pendências de acessibilidade em [seguranca-privacidade-e-limites.md](seguranca-privacidade-e-limites.md#pendências-conhecidas).

## `#/gratidao` · Três gratidões
**Objetivo:** escolher exatamente 3 de 10 opções prontas (sem texto livre).

**Ações:** marcar/desmarcar (as outras ficam desabilitadas ao chegar em 3), Salvar. Depois de feito, mostra as escolhas de hoje.

**Requisitos:** REQ-3.1, 5.6.

## `#/desafios` · Desafios
**Objetivo:** progresso de longo prazo.

**Componentes:** cartão de nível (nome, XP, ofensiva, barra até o próximo nível); **Desafios da semana** (4 barras, dias restantes); **Conquistas** (10, ganho/bloqueado com cadeado); **Liga Órbita Baixa** (ranking, sua posição, zona de promoção dos 3 primeiros, aviso de privacidade).

**Requisitos:** REQ-6.1, 6.2, 6.3, 3.4, 3.6.

## `#/integracoes` · Central de integrações
**Objetivo:** mostrar de onde viriam os dados e exportar o prontuário.

**Componentes**
- Fluxo em 4 passos: Conectores → Validação → Prontuário → Exportação FHIR.
- Aviso fixo: "**Nenhum conector está ligado a sistemas reais da NASA/CSA.**"
- Resumo: 9 conectores, contagem por status.
- Cartão por conector: nome, instituição, tipo, status, o que mede, chips dos indicadores (levam ao detalhe), **última leitura**, **quantidade de registros**, nota da fonte, "Abrir fonte ↗" (quando há referência) e **Sincronizar agora** (só `SIMULADO`).
- **Exportar prontuário (HL7 FHIR R4):** número de recursos, aviso de inválidos excluídos, nota sobre `SIMULADO` em `meta.tag` e LOINC, botão **⬇️ Baixar JSON** e prévia das primeiras 40 linhas.

**Requisitos:** REQ-11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7.

Nota: "Sincronizar agora" no conector `cenario-demo` atualiza a "última leitura", mas não gera registro novo (o simulador "ao vivo" não tem valores para autorrelatos), embora a tela mostre "Nova leitura simulada recebida".

## `#/contexto` · Contexto NASA/CSA
**Objetivo:** biblioteca de evidências citáveis.

**Componentes:** aviso fixo "**Contexto, não causalidade:** estas fontes explicam temas; não são dataset integrado nem medem você"; filtro por hazard (Todos + 5); contador de fontes; cartão por referência (instituição, `FATO DA FONTE`, tipo, título, seção, data, afirmação, hazards, limitação); link para o desafio do Space Apps no rodapé.

**Ações:** filtrar; **Abrir fonte ↗**; **Entendi — voltar ao dado** (vai ao prontuário).

**Requisitos:** REQ-7.1, 7.2, 7.3.

## `#/linha-do-tempo` · Linha do tempo e fila
**Objetivo:** ver o que está salvo, o que está na fila e controlar a simulação do enlace.

**Componentes**
- Cartão do **enlace**: estado online/offline, botão **Ficar offline / Reconectar**, interruptor **Simular falha no próximo envio**, contadores PENDING / READY / SYNCED / FAILED.
- Filtros **📋 Registros** e **📤 Fila** (abre em Fila).
- **Fila:** eventos mais recentes primeiro, com ícone do tipo, estado, horário, tentativas, chave de idempotência abreviada e **↻ Tentar novamente** nos FAILED.
- **Registros:** check-ins e leituras "ao vivo" agrupados por horário e conector (o histórico simulado não aparece aqui).
- **Legenda de origens:** MANUAL, SIMULADO, EXTERNO AUTORIZADO, AUSENTE.
- **Zona de perigo:** **🔄 Reiniciar demo** com confirmação ("Sim, apagar e reiniciar").

**Requisitos:** REQ-8.1, 8.2, 8.3, 8.4, 8.5, 8.6.

## Responsividade e acessibilidade (todas as telas)
- De 360 px a desktop: abas no topo no desktop, barra inferior abaixo de 820 px; colunas viram uma só abaixo de 900 px (REQ-10.2).
- Foco visível (`:focus-visible` com contorno azul), rótulos ARIA nos gráficos, anéis e botões de escala, `aria-pressed` nos filtros, `role="switch"` no interruptor de falha, tabelas com `caption` e `scope` (REQ-10.3).
- `prefers-reduced-motion` desliga animações.
- Fonte e mascote embutidos: funciona sem internet depois de carregado (REQ-10.4).
