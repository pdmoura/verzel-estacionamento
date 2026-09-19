'use client';

import {
  ArrowRight,
  BookOpenText,
  CalendarCheck2,
  CarFront,
  Code2,
  History,
  Hourglass,
  LayoutDashboard,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/api';
import { useSectors } from '@/lib/hooks';

const REPO_URL = 'https://github.com/pdmoura/verzel-estacionamento';

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: 'Reserva com regras de negócio',
    text: 'Uma placa, uma reserva ativa. A vaga é descontada do setor dentro de uma transação serializável, com retry automático em caso de conflito.',
  },
  {
    icon: Hourglass,
    title: 'Lista de espera FIFO',
    text: 'Setor lotado? A placa entra na fila. Ao cancelar uma reserva, a primeira placa elegível é promovida automaticamente.',
  },
  {
    icon: Trophy,
    title: 'Ranking de setores',
    text: 'Setores ordenados pelo total de reservas, com desempate por nome, para entender onde a demanda se concentra.',
  },
  {
    icon: History,
    title: 'Histórico rastreável',
    text: 'Cada evento é registrado. Promoções apontam para o cancelamento que as originou e a trilha da fila acompanha a reserva.',
  },
  {
    icon: Zap,
    title: 'Tempo real',
    text: 'Painel e portal do motorista se atualizam sozinhos a cada 5 segundos, refletindo as ações de outros usuários.',
  },
  {
    icon: ShieldCheck,
    title: 'API documentada e protegida',
    text: 'OpenAPI (Swagger), validação de entrada com códigos de erro estáveis, rate limiting por IP e health check com latência do banco.',
  },
];

const STACK = ['NestJS 11', 'Prisma 6', 'PostgreSQL', 'Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'SWR', 'Swagger', 'GitHub Actions', 'Vercel', 'Supabase'];

function LiveAvailability() {
  const { data: sectors, error } = useSectors();
  if (error) return null;
  const available = sectors?.reduce((acc, s) => acc + s.availableSpots, 0);
  const total = sectors?.reduce((acc, s) => acc + s.reservableQuota, 0);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted shadow-sm">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      {sectors ? (
        <>
          <span className="font-semibold text-text tabular-nums">{available}</span> de {total} vagas livres agora · {sectors.length} setores
        </>
      ) : (
        'Consultando vagas…'
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-text">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/30">
              <CarFront className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              Praça Central
              <span className="block text-xs font-medium text-muted">Estacionamento rotativo</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text sm:inline-flex">
              API
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Repositório no GitHub" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text sm:inline-flex">
              <Code2 className="size-5" />
            </a>
            <Link href="/admin" className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              Painel
            </Link>
            <Link href="/reserva" className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/30 hover:bg-brand-strong">
              Reservar
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_60%)]" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <LiveAvailability />
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">
                Reserve sua vaga na praça <span className="text-brand">antes de sair de casa</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted sm:text-lg">
                Sistema de gestão do estacionamento rotativo da praça central: reservas por setor, lista de espera com promoção automática, ranking de ocupação e histórico completo de eventos.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/reserva" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-base font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-strong">
                  <CarFront className="size-5" /> Reservar uma vaga
                </Link>
                <Link href="/admin" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-base font-semibold text-text hover:bg-surface-2">
                  <LayoutDashboard className="size-5" /> Abrir painel de gestão
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
              {[
                ['1', 'Escolha o setor', 'Veja as vagas livres e a tarifa de cada setor em tempo real.'],
                ['2', 'Informe placa e horário', 'Uma placa só pode ter uma reserva ativa por vez.'],
                ['3', 'Vaga garantida', 'Setor lotado? Entre na fila e seja promovido automaticamente.'],
              ].map(([n, title, text]) => (
                <div key={n} className="rounded-2xl border border-border bg-surface p-5 text-left shadow-sm">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-strong dark:text-blue-200">{n}</span>
                  <p className="mt-3 font-semibold text-text">{title}</p>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">O que o sistema faz</h2>
              <p className="mt-2 text-muted">Implementação completa das cinco histórias do desafio (setores, reservas, ranking, lista de espera e histórico), com as regras de concorrência tratadas no banco.</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:text-blue-200">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-semibold text-text">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Arquitetura</h2>
                <p className="mt-3 text-muted">
                  API REST em NestJS com Prisma sobre PostgreSQL. As operações que disputam vagas rodam em transações <em>serializable</em> com retry, garantindo que duas reservas simultâneas nunca ultrapassem a cota. O frontend em Next.js consome a API com SWR e polling, sem estado duplicado.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {STACK.map((s) => (
                    <span key={s} className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{s}</span>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
                    <Button variant="outline" icon={<BookOpenText className="size-4" />}>Documentação OpenAPI</Button>
                  </a>
                  <a href={REPO_URL} target="_blank" rel="noreferrer">
                    <Button variant="outline" icon={<Code2 className="size-4" />}>Código no GitHub</Button>
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-[#0b1437] p-6 font-mono text-xs leading-relaxed text-slate-300 shadow-xl sm:text-sm">
                <p className="text-slate-500"># cancelar reserva → promoção automática</p>
                <p><span className="text-emerald-400">POST</span> /reservations/42/cancel</p>
                <p className="mt-3 text-slate-500"># resposta</p>
                <p>{'{'}</p>
                <p className="pl-4">&quot;message&quot;: <span className="text-amber-300">&quot;Reserva cancelada com sucesso.&quot;</span>,</p>
                <p className="pl-4">&quot;promoted&quot;: <span className="text-sky-300">true</span></p>
                <p>{'}'}</p>
                <p className="mt-3 text-slate-500"># histórico da reserva promovida</p>
                <p><span className="text-emerald-400">GET</span> /reservations/43/history</p>
                <p className="pl-4">WAITLIST_JOINED → WAITLIST_PROMOTED <span className="text-slate-500">(origin: RESERVATION_CANCELLED #42)</span> → RESERVATION_CREATED</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <p>
            Desenvolvido por{' '}
            <a href="https://www.pedrow.tech" target="_blank" rel="noreferrer" className="font-semibold text-text hover:underline">
              Pedro Alves
            </a>{' '}
            · Desafio técnico Verzel
          </p>
          <div className="flex items-center gap-4">
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-text"><Code2 className="size-4" /> GitHub</a>
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-text">API <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
