import './globals.css';
import type { Metadata } from 'next';
import ToasterProvider from '@/components/providers/ToasterProvider';

export const metadata: Metadata = {
  title: 'Maikanwa Clothing',
  description: 'Tailoring + Fabrics + Ready-made + Caps + Shoes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider />
        {children}
      </body>
    </html>
  );
}
