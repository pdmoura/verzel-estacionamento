import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praca-central-estacionamento.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Estacionamento Rotativo da Praça Central',
    template: '%s | Praça Central',
  },
  description:
    'Reserva de vagas por setor, lista de espera com promoção automática, ranking de setores e histórico de eventos do estacionamento rotativo da praça central.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Estacionamento Rotativo da Praça Central',
    description: 'Reserve sua vaga por setor, entre na fila quando o setor lotar e acompanhe tudo em tempo real.',
    siteName: 'Praça Central',
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
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Toaster richColors position="top-right" closeButton toastOptions={{ duration: 4500 }} />
      </body>
    </html>
  );
}
