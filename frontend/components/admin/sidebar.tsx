'use client';

import {
  Building2,
  CalendarCheck2,
  CarFront,
  ExternalLink,
  History,
  Hourglass,
  LayoutDashboard,
  Menu,
  Trophy,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { API_URL } from '@/lib/api';
import { useHealth } from '@/lib/hooks';

export const NAV = [
  { href: '/admin', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/admin/setores', label: 'Setores', icon: Building2 },
  { href: '/admin/reservas', label: 'Reservas', icon: CalendarCheck2 },
  { href: '/admin/espera', label: 'Lista de espera', icon: Hourglass },
  { href: '/admin/ranking', label: 'Ranking', icon: Trophy },
  { href: '/admin/historico', label: 'Histórico', icon: History },
];

function ApiStatus() {
  const { data, error } = useHealth();
  const ok = !!data && !error;
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span
        className={cn('size-2 rounded-full', ok ? 'bg-emerald-400' : error ? 'bg-rose-400' : 'bg-amber-400 animate-pulse')}
        aria-hidden
      />
      {ok ? `API online · ${data.latencyMs} ms` : error ? 'API indisponível' : 'Verificando API…'}
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Seções do painel">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-brand text-white shadow-md shadow-brand/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-5 py-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/40">
        <CarFront className="size-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-base font-bold text-white">Praça Central</span>
        <span className="block text-xs text-slate-400">Estacionamento rotativo</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-3 border-t border-white/10 p-4">
      <ApiStatus />
      <div className="flex flex-col gap-1 text-xs">
        <Link href="/reserva" className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
          <CarFront className="size-3.5" /> Portal do motorista
        </Link>
        <a
          href={`${API_URL}/docs`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white"
        >
          <ExternalLink className="size-3.5" /> Documentação da API
        </a>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b1437] lg:flex" aria-label="Menu lateral">
      <Brand />
      <NavLinks />
      <SidebarFooter />
    </aside>
  );
}

export function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-bold text-text">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
            <CarFront className="size-4" aria-hidden />
          </span>
          Praça Central
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-xl text-text hover:bg-surface-2"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50 motion-safe:animate-[fade-in_150ms_ease-out]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#0b1437] shadow-2xl motion-safe:animate-[slide-in_200ms_ease-out]">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar menu"
                className="flex size-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <SidebarFooter />
          </div>
        </div>
      )}
    </>
  );
}
