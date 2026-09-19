import type { Metadata } from 'next';
import { MobileTopbar, Sidebar } from '@/components/admin/sidebar';

export const metadata: Metadata = {
  title: 'Painel de gestão',
  robots: { index: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <MobileTopbar />
      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
