'use client';

import { Building2, CalendarDays, Clock3, ExternalLink, Home, Menu, RotateCcw, Star, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { API_URL } from '@/lib/api';
import { useHealth } from '@/lib/hooks';

export const NAV = [
  { href: '/admin', label: 'Visão geral', icon: Home },
  { href: '/admin/setores', label: 'Setores', icon: Building2 },
  { href: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
  { href: '/admin/espera', label: 'Lista de espera', icon: Clock3 },
  { href: '/admin/ranking', label: 'Ranking', icon: Star },
  { href: '/admin/historico', label: 'Histórico', icon: RotateCcw },
];

export function ApiStatus({ className }: { className?: string }) {
  const { data, error } = useHealth();
  const ok = !!data && !error;
  return (
    <p className={cn('flex items-center gap-2 text-sm font-medium', ok ? 'text-[#22c55e]' : error ? 'text-rose-400' : 'text-amber-400', className)} aria-live="polite">
      <span className={cn('size-2.5 rounded-full', ok ? 'bg-[#22c55e]' : error ? 'bg-rose-400' : 'bg-amber-400 animate-pulse')} aria-hidden />
      {ok ? `API online · ${data.latencyMs} ms` : error ? 'API indisponível' : 'Verificando API'}
    </p>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1.5 px-4 pt-6" aria-label="Seções do painel">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-4 rounded-xl px-4 py-3.5 text-[17px] transition-colors',
              active ? 'bg-brand font-semibold text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3.5 px-6 pt-7">
      <Image src="/logo.png" alt="" width={60} height={60} className="size-[60px] shrink-0 rounded-2xl" priority />
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-[22px] font-bold text-white">Praça Central</span>
        <span className="block text-base text-slate-300">Estacionamento</span>
      </span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="mx-7 mt-auto space-y-3 border-t border-white/15 pb-8 pt-6">
      <ApiStatus />
      <div className="flex flex-col gap-2 text-[15px] text-slate-200">
        <Link href="/reserva" className="inline-flex items-center gap-2 hover:text-white">
          Portal do motorista <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden />
        </Link>
        <a href={`${API_URL}/docs`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
          Documentação da API <ExternalLink className="size-4" strokeWidth={1.75} aria-hidden />
        </a>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[285px] flex-col bg-sidebar lg:flex" aria-label="Menu lateral">
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
          <Image src="/logo.png" alt="" width={32} height={32} className="size-8 rounded-lg" priority />
          Praça Central
        </Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" aria-expanded={open} className="flex size-10 items-center justify-center rounded-xl text-text hover:bg-surface-2">
          <Menu className="size-6" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/50 motion-safe:animate-[fade-in_150ms_ease-out]" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[285px] max-w-[85vw] flex-col bg-sidebar shadow-2xl motion-safe:animate-[slide-in_200ms_ease-out]">
            <div className="flex items-start justify-between pr-3">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu" className="mt-7 flex size-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/10">
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
