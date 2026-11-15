---
spec: 02-redesign-visual
status: em-andamento
atualizado: 2026-11-15
base: specs/01-astra-mvp (comportamento e regras não mudam)
skills: design-taste-frontend (direção "One motif", seed 1436348759), frontend-design
---
# Redesign visual do Astra

## Pedido da equipe (2026-11-15)
"Não gostei muito do visual." Sem emojis: ícones e imagens. Mascote mais bonito. Caixas e informações soltas devem ser organizadas. **Modo escuro como padrão**, com **estrelas ao fundo**, e a jornada em que o Astrido **percorre planetas, um por missão**.

## Requisitos
- **RV-1 Tema:** escuro por padrão; alternador claro/escuro no topo, lembrado no navegador (falha silenciosa se o armazenamento não existir).
- **RV-2 Céu:** campo de estrelas fixo atrás de todas as telas no tema escuro; poucas estrelas cintilam; desligado com `prefers-reduced-motion`.
- **RV-3 Jornada orbital:** cada uma das 9 missões é um planeta desenhado em SVG, com nome e aparência próprios; uma rota orbital liga os planetas; o Astrido fica pousado no planeta da próxima missão; planetas visitados ganham uma bandeira/estrela. Toque no planeta faz a ação da missão.
- **RV-4 Ícones:** nenhum emoji na interface. Ícones da biblioteca `lucide-react` por nome (`domain/icons.ts` → `components/Icon.tsx`).
- **RV-5 Imagens reais:** 6 fotos de domínio público da NASA (Wikimedia Commons) em `public/img/`, com crédito visível no rodapé. Nenhuma é apresentada como dado do tripulante.
- **RV-6 Astrido novo:** estrela de pontas arredondadas, rosto simples (olhos ovais com brilho, sorriso), sem braços e pernas; humores mantidos.
- **RV-7 Organização:** conteúdo agrupado em painéis com cabeçalho; nada de cartões soltos lado a lado sem relação; espaçamento consistente.
- **RV-8 Regras de casa (skill):** sem gradientes, sem sombras em elementos parados (só diálogo, menu e comemoração), sem rótulos em caixa alta espaçada, sem monoespaçada, sem violeta, uma forma de botão (pílula), um raio de canto por nível.
- **RV-9 Nada de comportamento muda:** 249 testes continuam passando; selos de origem, `null` ≠ 0 e linguagem não diagnóstica seguem valendo.

## Tokens
| Papel | Escuro (padrão) | Claro |
|---|---|---|
| Fundo (espaço profundo) | `#0A1033` | `#F4F6FB` |
| Superfície 1 (órbita) | `#131B45` | `#FFFFFF` |
| Superfície 2 | `#1C2659` | `#E8ECF6` |
| Texto (luz estelar) | `#F3EFE6` | `#0E1433` |
| Texto 2 | `#AEB7DA` | `#4A5478` |
| Destaque único (estrela) | `#FFC83D` | `#B07A00` para texto, `#FFC83D` para preenchimento |
| Corpo / Mente / Espírito | `#5CCB8F` / `#5AA9F0` / `#F290B4` | mesmas, escurecidas para texto |

Tipo: **Schibsted Grotesk** (400, 600, 800), embutida via `@fontsource`. Números tabulares nos dados.

## Imagens (todas NASA, domínio público, via Wikimedia Commons)
| Arquivo | Onde |
|---|---|
| `iss-56-earth-s-limb-during-an.jpg` (nascer do sol no limbo da Terra) | Jornada, faixa do topo |
| `iss-43-earth-view-from-the-cupola.jpg` (Terra pela Cúpula) | Respirar / missão "Olhar pela Cúpula" |
| `iss-46-northern-india-at-night.jpg` (Terra à noite) | Prontuário, cabeçalho |
| `sts-135-final-flyaround-of-iss-1.jpg` (a ISS) | Integrações, topo |
| `cupola-iss-open-shutters.jpg` (Cúpula aberta) | Contexto NASA/CSA, topo |
| `aurora-australis-from-iss.jpg` (aurora austral) | Desafios, cartão de nível |
Créditos: `src/assets-credits.json` → componente `Credits` no rodapé.

## Tarefas
### Fundação (orquestrador)
- [ ] F1 Tokens claro/escuro, tema padrão escuro, alternador · RV-1, RV-8
- [ ] F2 `Starfield` · RV-2
- [ ] F3 Novo `Astrido` · RV-6
- [ ] F4 `domain/icons.ts` + `components/Icon.tsx`; emojis do domínio trocados por nomes de ícone · RV-4
- [ ] F5 Topo, barra inferior, selos, diálogo, comemoração e rodapé com créditos no novo estilo · RV-5, RV-7
### Frentes (agentes em paralelo)
- [ ] R-B Jornada orbital + `Planet` + Respirar + Gratidão · RV-3
- [ ] R-C Prontuário + Detalhe do indicador · RV-7
- [ ] R-D Check-in + Contexto + Desafios + Linha do tempo · RV-7
- [ ] R-H Integrações · RV-7
### Rodada 2 (pedido da equipe, 2026-11-15)
"A barra de navegação está com muitas informações", "fundo mais animado", "mascote mais bonito e detalhado", "informações confusas e jogadas", "menos poluído, mais refinado e profissional", "no mobile o rodapé deve ser fixo", "nos planetas não precisa seguir uma ordem".
- **RV-10 Navegação enxuta:** topo = marca + seções + um único resumo (ofensiva e XP juntos) + menu compacto com tema e enlace. Nada mais.
- **RV-11 Céu vivo:** estrelas em 3 camadas com deriva lenta (paralaxe), cintilação e estrela cadente ocasional; tudo desligado com `prefers-reduced-motion`.
- **RV-12 Astrido detalhado:** sombreado em facetas chapadas, olhos com íris e brilhos, sobrancelhas, bracinhos, bochechas; continua sem gradiente.
- **RV-13 Jornada sem ordem obrigatória:** check-in matinal abre o dia, check-in noturno fecha; as outras 7 missões são planetas em órbita em volta do Astrido (sistema solar), marcáveis em qualquer ordem. No celular, órbita vira grade.
- **RV-14 Menos poluição:** cada item mostra no máximo título + 1 linha de apoio; notas repetidas saem; nada de rótulo acima de título (eyebrow); parágrafos com no máximo ~70 caracteres por linha.
- **RV-15 Barra inferior fixa no celular** (já é `position: fixed`; garantir que nada a sobrescreva).

- [ ] F6 Navegação enxuta, céu vivo, Astrido detalhado, medida de texto · RV-10, RV-11, RV-12, RV-15
- [ ] R2-B Jornada sistema solar · RV-13, RV-14
- [ ] R2-C/D/H Telas mais limpas + achados do inspetor · RV-14

### Fechamento
- [ ] Lint e inspetor da skill, capturas em 3 larguras, crítica e ajustes
- [ ] Testes e build verdes; docs atualizados
