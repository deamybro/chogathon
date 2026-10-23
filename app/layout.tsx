import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import { WalletProvider } from '@/context/WalletContext';
import WalletModal from '@/components/WalletModal';
import GachaMintModal from '@/components/GachaMintModal';
import DepletedCartridgeModal from '@/components/DepletedCartridgeModal';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CHOG969 — The Living Cartridge Arcade',
  description:
    'Every Chog NFT is a unique playable 60-second arcade cartridge. Plug in any Chog, survive its dream.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#050508] text-zinc-100 font-sans arcade-grid-bg">
        <WalletProvider>
          <Suspense fallback={<div className="h-16 w-full border-b border-emerald-500/20 bg-black/85" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <WalletModal />
          <GachaMintModal />
          <DepletedCartridgeModal />
        </WalletProvider>
      </body>
    </html>
  );
}
