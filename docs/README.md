# Documentação técnica do Astra

**Astra** é um prontuário eletrônico de saúde (EHR) **gamificado**, no estilo Duolingo e GymRats, feito para tripulantes em missão espacial. Ele junta num só lugar a telemetria de sensores (frequência cardíaca, pressão, SpO₂, glicose, radiação, CO₂ da cabine...) e os autorrelatos do tripulante (sono, energia, humor, estresse, propósito), e transforma o cuidado diário com **corpo, mente e espírito** em missões, XP, ofensiva e conquistas, guiadas pelo mascote **Astrido**, uma estrela. Também tem uma **central de integrações** com conectores simulados (Bio-Monitor, ECLSS, dosímetro, ARCHeR, CANS...) e exporta o prontuário em **HL7 FHIR R4**.

É um **MVP do NASA Space Apps Challenge 2026** (desafio *Create Health Monitoring Software for Astronauts on Space Missions*). Roda inteiro no navegador, funciona offline, usa **dados simulados rotulados** e **não é dispositivo médico**.

## Índice

| Documento | Para quem | O que tem |
|---|---|---|
| [arquitetura.md](arquitetura.md) | Dev, banca técnica | Camadas, diagrama, pastas, fluxo de um check-in, decisões técnicas |
| [modelo-de-dados.md](modelo-de-dados.md) | Dev | `Observation`, `SyncEvent`, `AppState`, catálogo dos 19 indicadores, 9 conectores, 5 referências NASA/CSA |
| [regras-de-negocio.md](regras-de-negocio.md) | Dev, revisor | Tendência, faixa, ingestão, gamificação, Astrido, sincronização, FHIR |
| [telas.md](telas.md) | Dev, design | Cada rota: objetivo, componentes, ações e requisitos atendidos |
| [desenvolvimento.md](desenvolvimento.md) | Dev | Como rodar, testar, gerar build, adicionar indicador/conector/missão, convenções |
| [seguranca-privacidade-e-limites.md](seguranca-privacidade-e-limites.md) | Todos | O que o Astra é e não é, salvaguardas, pendências, roadmap |
| [apresentacao.md](apresentacao.md) | Equipe | Pitch de 45 s, roteiro de demo clicável, perguntas da banca |

## Outras fontes
- Especificações (método spec-driven): [`../specs/README.md`](../specs/README.md)
  - Base da equipe (transcrição do PDF): [`../specs/00-base/especificacao-tecnica.md`](../specs/00-base/especificacao-tecnica.md)
  - MVP: [`requirements.md`](../specs/01-astra-mvp/requirements.md) · [`design.md`](../specs/01-astra-mvp/design.md) · [`tasks.md`](../specs/01-astra-mvp/tasks.md)
- Código: [`../src/`](../src/)

> Esta documentação descreve o **código como está** (versão `0.1.0` do `package.json`), não o plano. Quando código e spec divergem, o texto diz isso explicitamente.
