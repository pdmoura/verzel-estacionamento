import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estacionamento.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Estacionamento Rotativo — Praça Central',
    template: '%s · Estacionamento Rotativo',
  },
  description:
    'Reserva de vagas em tempo real, lista de espera com promoção automática, ranking de setores e histórico rastreável. NestJS + Prisma + PostgreSQL + Next.js.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Estacionamento Rotativo — Praça Central',
    description:
      'Reserva de vagas em tempo real, lista de espera FIFO com promoção automática, ranking e histórico de eventos.',
    siteName: 'Estacionamento Rotativo',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1120' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh">
        {children}
        <Toaster richColors position="top-right" closeButton toastOptions={{ duration: 4500 }} />
      </body>
    </html>
  );
}
