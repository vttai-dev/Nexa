import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { RootLayoutShell } from '@/components/layout/root-layout';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'Nexa — Nền tảng tri thức kỹ thuật', template: '%s | Nexa' },
  description: 'Nền tảng chia sẻ kiến thức kỹ thuật cộng đồng',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geist.className} min-h-screen antialiased bg-background`}>
        <Providers>
          <RootLayoutShell>{children}</RootLayoutShell>
        </Providers>
      </body>
    </html>
  );
}
