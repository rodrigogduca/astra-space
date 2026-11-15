# Astra · saúde do tripulante

**Astra** é um prontuário eletrônico de saúde (EHR) **gamificado**, no estilo Duolingo e GymRats, para astronautas em missão. Projeto do **NASA Space Apps Challenge 2026**, desafio [*Create Health Monitoring Software for Astronauts on Space Missions*](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

> MVP de hackathon: roda no navegador, offline, com **dados simulados rotulados**. **Não é dispositivo médico** e não está conectado a nenhum sistema real da NASA ou da CSA.

## O conceito
- **Prontuário único**: 19 indicadores (sinais vitais, glicose, radiação, CO₂ da cabine, sono, água, treino, mente e espírito), cada um com origem visível, faixa de referência com fonte e cor neutra.
- **Insight explicável**: o que mudou entre o primeiro e o último registro, com ids, datas e regra versionada, sem diagnóstico e sem misturar dado simulado com manual.
- **Jornada gamificada**: 9 missões diárias para corpo, mente e espírito, XP, níveis, ofensiva, conquistas, desafios semanais e liga da tripulação (só XP). O XP vem do hábito, nunca do valor de um sinal.
- **Astrido**, a estrela mascote, que descreve os registros e oferece check-in, detalhe ou apoio humano.
- **Central de integrações**: Bio-Monitor, ECLSS, dosímetro, ARED, ARCHeR, CANS... como conectores `SIMULADO` ou `ROADMAP`, e exportação **HL7 FHIR R4**.
- **Offline-first**: tudo salvo no IndexedDB e enviado por uma fila simulada (PENDING → READY → SYNCED / FAILED).

## Como rodar
```bash
npm install
npm run dev       # servidor de desenvolvimento (Vite)
npm test          # 249 testes (Vitest)
npm run build     # checa tipos e gera dist/
npm run preview   # serve o build
```
Para apresentar, comece em **Fila → Reiniciar demo**.

## Documentação
- [`docs/`](docs/README.md): arquitetura, modelo de dados, regras, telas, guia de desenvolvimento, limites e roteiro da banca.
- [`specs/`](specs/README.md): especificação base da equipe e requisitos, design e tarefas do MVP.

Stack: React 19 · TypeScript 7 · Vite 8 · IndexedDB (`idb-keyval`) · Vitest. Sem backend.

Equipe: {{nomes e papéis do time}}
