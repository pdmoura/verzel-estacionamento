'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Board } from '@/components/landing/board';
import { Closing } from '@/components/landing/closing';
import { RankingStrip } from '@/components/landing/ranking';
import { Replay } from '@/components/landing/replay';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useHealth } from '@/lib/hooks';

const REPO_URL = 'https://github.com/pdmoura/verzel-estacionamento';

/* The page's chrome is the product's chrome: a status line, not a marketing bar. */
function StatusLine() {
  const { data, error } = useHealth();
  const ok = !!data && !error;
  return (
    <p className="hidden items-center gap-2 font-mono text-xs text-muted md:flex" aria-live="polite">
      <span className={cn('size-1.5 rounded-full', ok ? 'bg-emerald-500' : error ? 'bg-rose-500' : 'bg-amber-500')} aria-hidden />
      {ok ? `API online, ${data.latencyMs} ms` : error ? 'API indisponível' : 'Verificando API'}
    </p>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-text">
            <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg" priority />
            Praça Central
          </Link>
          <StatusLine />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <Link href="/admin" className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              Painel
            </Link>
            <a href="#reservar" className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong active:scale-[0.98]">
              Reservar vaga
            </a>
          </nav>
        </div>
      </header>

      <main>
        <Board />
        <Replay />
        <RankingStrip />

        {/* the place itself: one photo, in its own column, with a caption */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:py-24">
            <figure className="lg:col-span-7">
              <Image
                src="/hero-parking.jpg"
                alt="Vagas demarcadas ao lado da praça, com árvores e alguns carros estacionados"
                width={1536}
                height={1024}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="aspect-[3/2] w-full rounded-2xl object-cover"
              />
              <figcaption className="mt-3 text-sm text-muted">O pátio rotativo, no entorno da praça.</figcaption>
            </figure>
            <div className="lg:col-span-5 lg:pt-6">
              <h2 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">Uma placa, uma reserva</h2>
              <p className="mt-4 max-w-[44ch] leading-relaxed text-muted">
                A cota de cada setor é respeitada dentro de uma transação serializável no banco, com nova tentativa em caso de conflito. Duas pessoas reservando a última vaga ao mesmo tempo nunca ultrapassam a cota.
              </p>
              <p className="mt-4 max-w-[44ch] leading-relaxed text-muted">
                Quem chega com o setor lotado entra na fila. Cancelou alguém, a primeira placa da fila recebe a vaga e o histórico guarda o motivo.
              </p>
            </div>
          </div>
        </section>

        <Closing />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Feito por{' '}
            <a href="https://www.pedrow.tech" target="_blank" rel="noreferrer" className="font-semibold text-text hover:underline">
              Pedro Alves
            </a>{' '}
            para o desafio técnico da Verzel. NestJS, Prisma, PostgreSQL e Next.js.
          </p>
          <p className="flex gap-4">
            <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="hover:text-text">
              Documentação da API
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-text">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
