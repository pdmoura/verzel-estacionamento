# Estacionamento Rotativo — Praça Central

Sistema completo de gestão de vagas para o estacionamento rotativo da praça central: cadastro de setores, reservas com regras de concorrência, lista de espera FIFO com promoção automática, ranking de setores e histórico rastreável de eventos.

**Demo ao vivo**

| | URL |
|---|---|
| Aplicação (landing, portal do motorista e painel) | https://praca-central-estacionamento.vercel.app |
| API REST | https://praca-central-api.vercel.app |
| Documentação OpenAPI (Swagger) | https://praca-central-api.vercel.app/docs |
| Health check | https://praca-central-api.vercel.app/health |

[![CI](https://github.com/pdmoura/verzel-estacionamento/actions/workflows/ci.yml/badge.svg)](https://github.com/pdmoura/verzel-estacionamento/actions/workflows/ci.yml)

## Funcionalidades

- **Setores (ESTC-1)** — nome, localização, cota de vagas reserváveis e tarifa por hora.
- **Reservas (ESTC-2)** — uma placa só pode ter uma reserva ativa; a vaga é descontada do setor dentro de uma transação *serializable* com retry automático em conflito (`P2034`). Cancelar devolve a vaga **ou** promove a fila.
- **Ranking (ESTC-3)** — setores ordenados pelo total de reservas, desempate por nome.
- **Lista de espera (ESTC-4)** — só para setor lotado, sem duplicidade por placa, ordem FIFO. Ao cancelar uma reserva, a primeira placa elegível vira reserva ativa automaticamente.
- **Histórico (ESTC-5)** — todo evento fica registrado; promoções apontam para o cancelamento que as originou (`originEventId`) e a trilha da fila acompanha a reserva promovida.
- **Portal do motorista** — escolha de setor com vagas em tempo real, reserva, entrada na fila e consulta/cancelamento por placa.
- **Painel de gestão** — visão geral, setores, reservas com busca e filtro, filas por setor, ranking e linha do tempo; tudo com polling de 5 s.

## Stack

| Camada | Tecnologias |
|---|---|
| API | NestJS 11 · Prisma 6 · PostgreSQL 16 · class-validator · @nestjs/swagger · @nestjs/throttler |
| Web | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · SWR · lucide-react · sonner |
| Infra | Vercel (web + API serverless) · Supabase Postgres (pooler) · GitHub Actions (CI) · Docker Compose (Postgres local) |

## Arquitetura

```
┌──────────────────┐   fetch + SWR (polling 5s)   ┌─────────────────────────────┐
│  Next.js (web)   │ ───────────────────────────► │  NestJS API (/api/index.js) │
│  /  /reserva     │                              │  ValidationPipe · Throttler │
│  /admin/*        │ ◄─────────────────────────── │  Swagger em /docs           │
└──────────────────┘          JSON                └──────────────┬──────────────┘
                                                                 │ Prisma
                                                                 ▼
                                                  ┌─────────────────────────────┐
                                                  │ PostgreSQL (Supabase pooler)│
                                                  │ Sector · Reservation ·      │
                                                  │ WaitlistEntry · HistoryEvent│
                                                  └─────────────────────────────┘
```

- Regras de negócio ficam em `backend/src/parking.service.ts`; DTOs e validação de formato em `backend/src/dto.ts`.
- Erros seguem sempre o contrato `{ statusCode, code, message }` (`EMPTY_PLATE`, `PAST_DATE`, `PLATE_ACTIVE`, `NO_SPOTS`, `SECTOR_HAS_SPOTS`, `ALREADY_WAITING`, `VALIDATION_ERROR`, ...).
- O mesmo `createApp()` (`backend/src/app.factory.ts`) sobe o servidor local e a função serverless na Vercel.

## Rodando localmente

Pré-requisitos: Node.js 20+, Docker.

```bash
# 1. Banco
docker compose up -d

# 2. API (http://localhost:3001, docs em /docs)
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed        # setores de exemplo
npm run start:dev

# 3. Web (http://localhost:3000)
cd ../frontend
npm install
npm run dev               # usa http://localhost:3001 por padrão
```

## Testes e qualidade

```bash
cd backend
npm run test:e2e -- --runInBand   # 24 testes de integração cobrindo ESTC-1..5
npm run lint
```

O workflow em `.github/workflows/ci.yml` sobe um PostgreSQL, aplica as migrations, compila e roda a suíte e2e da API, além de fazer o type-check e o build do frontend a cada push.

## API

Documentação interativa em `/docs` (OpenAPI 3). Resumo:

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status da API e latência do banco |
| `GET` | `/sectors` | Listar setores |
| `POST` | `/sectors` | Cadastrar setor |
| `GET` | `/sectors/ranking` | Ranking de setores |
| `GET` | `/reservations?plate=&status=` | Listar reservas (filtros opcionais) |
| `POST` | `/reservations` | Criar reserva |
| `POST` | `/reservations/:id/cancel` | Cancelar reserva (promove a fila) |
| `GET` | `/reservations/:id/history` | Histórico da reserva |
| `GET` | `/waitlist` | Todas as placas aguardando |
| `GET` | `/sectors/:id/waitlist` | Lista de espera do setor |
| `POST` | `/sectors/:id/waitlist` | Entrar na lista de espera |
| `DELETE` | `/waitlist/:id` | Sair da lista de espera |
| `GET` | `/history` | Histórico global |

Limite de 120 requisições/minuto por IP.

## Deploy

Os dois projetos Vercel estão ligados ao repositório GitHub (branch `master`), cada um com o **Root Directory** apontando para a sua pasta (`backend` e `frontend`). Sem isso o Vercel compila a raiz vazia do repositório e o site responde 404. O GitHub Actions só roda lint, build e testes; o deploy acontece pela integração Git do Vercel a cada push.

**API (Vercel, pasta `backend`)** — `vercel.json` compila com `prisma generate && nest build` e roteia tudo para `api/index.js`. Variáveis: `DATABASE_URL` (pooler de transação, porta 6543, `?pgbouncer=true&connection_limit=1`), `DIRECT_URL` (pooler de sessão, porta 5432, usado pelo `prisma migrate deploy`) e opcionalmente `FRONTEND_URL` (origens extras para CORS, separadas por vírgula).

**Web (Vercel, pasta `frontend`)** — variáveis `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL`.

Migrations em produção: `cd backend && DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy`.

## Estrutura

```
backend/
  api/index.js          # entrada serverless (Vercel)
  prisma/               # schema, migrations, seed
  src/
    app.factory.ts      # createApp(): CORS, ValidationPipe, Swagger
    dto.ts              # DTOs + validação
    parking.service.ts  # regras de negócio e transações
    parking.controller.ts
    health.controller.ts
  test/app.e2e-spec.ts
frontend/
  app/                  # rotas: /, /reserva, /admin/*
  components/           # ui/ (design system), forms/, timeline, modais
  lib/                  # api client, hooks SWR, formatação, tipos
```

---

Desenvolvido por [Pedro Alves](https://www.pedrow.tech) como resposta ao desafio técnico da Verzel.
