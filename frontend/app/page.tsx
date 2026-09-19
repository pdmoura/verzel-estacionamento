'use client';

import { ArrowRight, BookOpenText, Code2, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Timeline } from '@/components/timeline';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/empty-state';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useHistory, useSectors } from '@/lib/hooks';

const REPO_URL = 'https://github.com/pdmoura/verzel-estacionamento';

/* Real component, real data: the same sectors the driver portal reserves against. */
function LiveSectors() {
  const { data: sectors, error } = useSectors();

  if (error) {
    return <p className="text-sm text-muted">Não foi possível carregar os setores agora.</p>;
  }
  if (!sectors) {
    return (
      <ul className="divide-y divide-border">
        {[1, 2, 3, 4].map((i) => (
          <li key={i} className="py-4">
            <Skeleton className="h-6 w-2/3" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {sectors.map((s) => {
        const full = s.availableSpots === 0;
        return (
          <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:gap-8">
            <div className="min-w-0">
              <p className="font-semibold text-text">{s.name}</p>
              {s.location && <p className="truncate text-sm text-muted">{s.location}</p>}
            </div>
            <p className="hidden text-sm text-muted tabular-nums sm:block">{formatMoney(s.hourlyRate)} por hora</p>
            {full ? (
              <Badge tone="danger">Lotado</Badge>
            ) : (
              <p className="text-sm tabular-nums">
                <span className="text-xl font-semibold text-text">{s.availableSpots}</span>
                <span className="text-muted"> de {s.reservableQuota} livres</span>
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* Real component, real data: the last events recorded by the API. */
function RecentEvents() {
  const { data: history, error } = useHistory();
  if (error) return <p className="text-sm text-muted">Não foi possível carregar o histórico agora.</p>;
  if (!history) return <Skeleton className="h-40" />;
  const recent = [...history].reverse().slice(0, 4);
  if (recent.length === 0) return <p className="text-sm text-muted">Nenhum evento registrado ainda.</p>;
  return <Timeline events={recent} compact />;
}

const STEPS = [
  ['Escolha o setor', 'Cada setor mostra quantas vagas ainda estão livres e a tarifa por hora.'],
  ['Informe a placa e o horário', 'Uma placa só pode ter uma reserva ativa por vez.'],
  ['Chegue e apresente a placa', 'Se o setor lotar, você entra na fila e recebe a vaga assim que alguém cancelar.'],
];

const ADMIN_ITEMS = [
  ['Setores', 'Cota de vagas e tarifa por setor.'],
  ['Reservas', 'Busca por placa, filtro por status e cancelamento.'],
  ['Ranking', 'Setores ordenados pela procura.'],
  ['Histórico', 'Cada promoção aponta para o cancelamento que a originou.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-text">
            <Image src="/logo.png" alt="" width={36} height={36} className="size-9 rounded-xl" priority />
            Praça Central
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text sm:inline-flex">
              API
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text sm:inline-flex">
              GitHub
            </a>
            <Link href="/admin" className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              Painel
            </Link>
            <Link href="/reserva" className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong active:scale-[0.98]">
              Reservar vaga
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero: asymmetric split, copy left, photo right */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-20">
          <div className="lg:col-span-6">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-5xl xl:text-6xl">
              Reserve sua vaga na praça antes de sair de casa
            </h1>
            <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-muted">
              Veja as vagas livres por setor, garanta a sua e entre na fila quando o setor lotar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/reserva" className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-white hover:bg-brand-strong active:scale-[0.98]">
                Reservar vaga
              </Link>
              <Link href="/admin" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 text-base font-semibold text-text hover:bg-surface-2 active:scale-[0.98]">
                <LayoutDashboard className="size-5" strokeWidth={1.75} aria-hidden />
                Painel de gestão
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <Image
              src="/hero-parking.jpg"
              alt="Estacionamento ao lado de uma praça arborizada, com vagas demarcadas e alguns carros estacionados"
              width={1536}
              height={1024}
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[3/2] w-full rounded-2xl object-cover"
            />
          </div>
        </section>

        {/* Live availability: real data, plain rows */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Vagas livres agora</h2>
                <p className="mt-3 max-w-[40ch] text-muted">Atualizado a cada cinco segundos, com os mesmos dados que o portal usa para reservar.</p>
              </div>
              <div className="lg:col-span-8">
                <LiveSectors />
              </div>
            </div>
          </div>
        </section>

        {/* How it works: vertical steps with a second photo */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-24">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <Image
              src="/driver-phone.jpg"
              alt="Motorista dentro do carro consultando o celular antes de estacionar"
              width={1024}
              height={1280}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="aspect-[4/5] w-full rounded-2xl object-cover"
            />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-7">
            <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Como funciona</h2>
            <ol className="mt-8 space-y-8">
              {STEPS.map(([title, text]) => (
                <li key={title} className="border-l-2 border-brand pl-5">
                  <p className="text-lg font-semibold text-text">{title}</p>
                  <p className="mt-1 max-w-[52ch] text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Waitlist explained with the real event feed */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
            <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Quando o setor lota, a fila resolve</h2>
            <p className="mt-3 max-w-[60ch] text-muted">
              A placa entra na lista de espera do setor. Quando uma reserva é cancelada, a primeira placa da fila recebe a vaga e o histórico registra qual cancelamento causou a promoção.
            </p>
            <div className="mt-10 rounded-2xl border border-border bg-bg p-5 sm:p-8">
              <p className="mb-6 text-sm font-medium text-muted">Últimos eventos registrados</p>
              <RecentEvents />
            </div>
          </div>
        </section>

        {/* Admin capabilities: 2-column plain rows */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Para quem administra</h2>
              <p className="mt-3 max-w-[40ch] text-muted">Um painel com tudo o que o caderno da guarita não conseguia responder.</p>
              <Link href="/admin" className="mt-6 inline-flex items-center gap-2 font-semibold text-brand hover:underline">
                Abrir o painel <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>
            <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {ADMIN_ITEMS.map(([title, text]) => (
                <div key={title} className="border-t border-border pt-4">
                  <dt className="font-semibold text-text">{title}</dt>
                  <dd className="mt-1 text-muted">{text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Tech, in one paragraph */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Por dentro</h2>
            <p className="mt-3 max-w-[65ch] leading-relaxed text-muted">
              API em NestJS com Prisma sobre PostgreSQL. Reservas e cancelamentos rodam em transações serializáveis com retry, então duas reservas simultâneas nunca ultrapassam a cota. O site em Next.js consome a API com SWR. Documentação OpenAPI, testes de integração em CI e deploy na Vercel com Supabase.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className={cn('inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-bg px-4 text-sm font-semibold text-text hover:bg-surface-2')}>
                <BookOpenText className="size-4" strokeWidth={1.75} aria-hidden /> Documentação da API
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className={cn('inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-bg px-4 text-sm font-semibold text-text hover:bg-surface-2')}>
                <Code2 className="size-4" strokeWidth={1.75} aria-hidden /> Código no GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Desenvolvido por{' '}
            <a href="https://www.pedrow.tech" target="_blank" rel="noreferrer" className="font-semibold text-text hover:underline">
              Pedro Alves
            </a>{' '}
            para o desafio técnico da Verzel.
          </p>
          <p>Praça Central, estacionamento rotativo.</p>
        </div>
      </footer>
    </div>
  );
}
