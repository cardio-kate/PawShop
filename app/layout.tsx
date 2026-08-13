import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PawShop — cat food and accessories',
    template: '%s — PawShop',
  },
  description: 'PawShop — online store for cat food and accessories, shipping across the EU.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface font-sans text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
