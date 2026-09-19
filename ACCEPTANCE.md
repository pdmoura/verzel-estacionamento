# Critérios de aceite — verificação

Mapeamento de cada critério do desafio para onde ele é implementado e como foi verificado.
Legenda: **API** = regra no backend (`parking.service.ts`), **UI** = comportamento na interface, **e2e** = coberto por `backend/test/app.e2e-spec.ts`.

## ESTC-1 · Cadastro e listagem de setores

| Critério | Onde | Verificação |
|---|---|---|
| Cadastrar setor com nome, localização, cota e tarifa | `POST /sectors` · `/admin/setores` (modal "Novo setor") | e2e `should create a sector` · manual |
| Setor aparece na listagem sem recarregar | SWR `mutate('sectors')` após o cadastro + polling 5 s | manual |
| Tela principal exibe a lista de setores | `/admin/setores` (tabela/cards) · `/admin` (ocupação) · `/reserva` (cards) | manual |
| Nome vazio recusado com mensagem na tela | `EMPTY_NAME` (nome só com espaços também) · toast de erro · campo `required` | e2e `should reject empty name` |
| Cota < 1 recusada com mensagem | `INVALID_QUOTA` / `VALIDATION_ERROR` · toast · `min=1` | e2e `should reject quota < 1` |
| Tarifa negativa recusada com mensagem | `INVALID_RATE` / `VALIDATION_ERROR` · toast · `min=0` | e2e `should reject negative rate` |

## ESTC-2 · Reserva e cancelamento

| Critério | Onde | Verificação |
|---|---|---|
| Reservar registra placa, setor, chegada e diminui a cota em 1 | `POST /reservations` (transação serializable) | e2e `should create a reservation`, `should decrement available spots` |
| Tela reflete a nova cota após a reserva | `mutate('sectors')` + polling | manual (`/admin`, `/reserva`) |
| Placa vazia recusada com mensagem | `EMPTY_PLATE` · toast | e2e `should reject empty plate` |
| Data/hora no passado recusada com mensagem | `PAST_DATE` · toast · `min` no input | e2e `should reject past date` |
| Setor sem cota: recusado e motorista avisado | `NO_SPOTS` · painel amarelo oferecendo a lista de espera | e2e `should reject when no spots available` |
| Placa com reserva ativa não reserva de novo e é avisada | `PLATE_ACTIVE` · toast | e2e `should reject duplicate active plate` |
| Cancelar reserva ativa aumenta a cota em 1 | `POST /reservations/:id/cancel` | e2e `should cancel a reservation and return spot (no waitlist)` |

## ESTC-3 · Ranking

| Critério | Onde | Verificação |
|---|---|---|
| Setores ordenados pela quantidade de reservas | `GET /sectors/ranking` · `/admin/ranking` (pódio + tabela) | e2e `should return ranking ordered by reservation count` |
| Cada item mostra o total de reservas | coluna "Reservas" e pódio | manual |
| Sem reservas: estado vazio sem erro | `[]` na API · `EmptyState` na tela | e2e (retorno `[]`) · manual |

## ESTC-4 · Lista de espera

| Critério | Onde | Verificação |
|---|---|---|
| Ao tentar reservar em setor lotado, a entrada na fila é oferecida | `NO_SPOTS` → botão "Entrar na lista de espera" (`/reserva` e modal do painel) | manual |
| Entrar na fila registra placa, setor e chegada sem alterar a cota | `POST /sectors/:id/waitlist` | e2e `should join waitlist when sector is full` |
| Tela exibe a fila de cada setor na ordem de entrada | `/admin/espera` (chips por setor, posição 1º, 2º…) | e2e `should list waitlist in FIFO order` · manual |
| Placa com reserva ativa não entra na fila e é avisada | `PLATE_ACTIVE` · toast | e2e `should reject plate with active reservation from waitlist` |
| Placa já na fila do setor não entra de novo e é avisada | `ALREADY_WAITING` · toast | e2e `should reject duplicate waitlist entry` |
| Cancelar reserva com fila: primeira placa vira reserva ativa e sai da fila | promoção FIFO no cancelamento (`status: PROMOTED`, `reservationId`) | e2e `should promote first waitlist entry on cancellation` |
| Quando a fila é acionada, a cota permanece a mesma | não incrementa `availableSpots` quando `promoted` | e2e (mesmo teste) |
| Cancelar sem fila: cota aumenta em 1 | incremento apenas quando `!promoted` | e2e `should cancel a reservation and return spot` |
| Sair da fila por vontade própria; seguintes avançam mantendo a ordem | `DELETE /waitlist/:id` (`status: LEFT`), ordenação por `createdAt, id` | e2e `should allow voluntary leave from waitlist` |
| Setor sem fila: estado vazio sem erro | `EmptyState` "Fila vazia" | manual |

## ESTC-5 · Histórico da reserva

| Critério | Onde | Verificação |
|---|---|---|
| Cada reserva tem histórico do mais antigo ao mais recente | `GET /reservations/:id/history` (`orderBy createdAt asc`) · modal "Histórico" | e2e `should show reservation history with creation event` |
| Cada evento mostra data/hora e o que aconteceu | `Timeline` (badge do tipo + descrição + data) | manual |
| Criação aparece no histórico | `RESERVATION_CREATED` | e2e |
| Cancelamento aparece no histórico | `RESERVATION_CANCELLED` | e2e |
| Entrada na fila aparece no histórico | `WAITLIST_JOINED` (vinculado à reserva quando promovida) | e2e |
| Saída voluntária da fila aparece no histórico | `WAITLIST_LEFT` | manual (`/admin/historico`) |
| Promoção aparece e indica o cancelamento que a originou | `WAITLIST_PROMOTED` com `originEventId` → "Originado por: …" | e2e `should have promotion event with originEventId` |
| Reserva recém-criada exibe só o evento de criação, sem erro | histórico com 1 evento | e2e `should show reservation history with creation event` |

Suíte: `cd backend && npm run test:e2e -- --runInBand` (24 testes, todos verdes em 19/09/2026). CI: `.github/workflows/ci.yml`.
