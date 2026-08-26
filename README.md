# Estacionamento Rotativo — Praça Central

Sistema de gestão de vagas, reservas, lista de espera e ranking para o estacionamento rotativo da praça central.

## Stack

- **Backend:** NestJS + Prisma ORM + PostgreSQL
- **Frontend:** Next.js (App Router) + Bootstrap 5
- **Banco:** PostgreSQL 16 (Docker Compose local / Neon produção)

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- npm

## Setup Local

### 1. Banco de dados

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run start:dev
```

A API estará disponível em `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/sectors` | Listar setores |
| `POST` | `/sectors` | Cadastrar setor |
| `GET` | `/reservations` | Listar reservas |
| `POST` | `/reservations` | Criar reserva |
| `POST` | `/reservations/:id/cancel` | Cancelar reserva |
| `GET` | `/sectors/ranking` | Ranking de setores |
| `GET` | `/sectors/:id/waitlist` | Lista de espera do setor |
| `POST` | `/sectors/:id/waitlist` | Entrar na lista de espera |
| `DELETE` | `/waitlist/:id` | Sair da lista de espera |
| `GET` | `/history` | Histórico global |
| `GET` | `/reservations/:id/history` | Histórico da reserva |

## Deploy (Render + Neon)

### Backend (Render Web Service)

- **Root:** `backend`
- **Build:** `npm ci && npx prisma generate && npm run build`
- **Start:** `npm run start:prod`
- **Variáveis:** `DATABASE_URL`, `FRONTEND_URL`, `PORT`

### Frontend (Render Web Service)

- **Root:** `frontend`
- **Build:** `npm ci && npm run build`
- **Start:** `npm start`
- **Variáveis:** `NEXT_PUBLIC_API_URL` (definir antes do build)

### Banco (Neon)

Usar connection string PostgreSQL direta em `DATABASE_URL`.
Antes do primeiro deploy, executar:

```bash
cd backend
npx prisma migrate deploy
```

## Testes

```bash
cd backend
npm run test:e2e -- --runInBand
```
