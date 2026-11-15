# Specs do Astra: como trabalhamos

Desenvolvimento guiado por especificação (spec-driven). Nada vira código sem estar numa spec aprovada.

```
specs/
├── 00-base/especificacao-tecnica.md   ← transcrição do PDF da equipe (contexto, não se edita)
└── 01-astra-mvp/
    ├── requirements.md                ← O QUÊ: histórias e critérios de aceite (EARS)
    ├── design.md                      ← COMO: arquitetura, dados, telas, regras
    └── tasks.md                       ← PASSOS: tarefas pequenas, com dono (frente) e requisito
```

## Fluxo por frentes (agentes)
| # | Frente | Quem | Entrada → saída | Gate para seguir |
|---|---|---|---|---|
| 1 | **Planejamento** | Orquestrador (Claude principal) | PDF + visão da equipe → `requirements.md`, `design.md`, `tasks.md` | Specs completas e rastreáveis |
| 2 | **Aprovação** | 🧑 Equipe (humano) | Specs → "aprovado" ou ajustes | "Sim" explícito no chat |
| 3 | **Desenvolvimento** | Agentes `dev-*` em paralelo, um por frente de tarefas | Tarefas → código + testes | `npm run build` e `npm test` passam |
| 4 | **Revisão** | Agente `revisor` | Diff → achados contra os requisitos e as regras de segurança da base | Nenhum achado bloqueante |
| 5 | **Verificação** | Orquestrador | App rodando no navegador → roteiro de demo | Roteiro da banca funciona de ponta a ponta |
| 6 | **Documentação** | Agente `documentador` | Código final → `docs/` técnico | Doc bate com o código |

Regras para qualquer agente:
- Toda mudança cita o requisito (`REQ-x.y`) que atende. Requisito novo volta para a frente 1 e passa pela 2.
- Nunca inventar número clínico: faixa de referência só com fonte escrita no catálogo.
- Todo dado simulado leva o selo `SIMULADO`. Ausência é `null`, nunca `0`.
- Nada de `git commit`/`push`: a equipe commita.
