import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-mono', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://praca-central-estacionamento.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Praça Central Estacionamento',
    template: '%s | Praça Central Estacionamento',
  },
  description:
    'Reserva de vagas por setor, lista de espera com promoção automática, ranking de setores e histórico de eventos do estacionamento rotativo da Praça Central.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title: 'Praça Central Estacionamento',
    description: 'Escolha um setor, reserve em poucos passos e acompanhe tudo pela placa.',
    siteName: 'Praça Central Estacionamento',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#f4f7fe',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plex.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Toaster richColors position="top-right" closeButton toastOptions={{ duration: 4500 }} />
      </body>
    </html>
  );
}
