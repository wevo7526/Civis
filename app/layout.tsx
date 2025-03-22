import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import ClientWrapper from './components/ClientWrapper';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { NotificationsBell } from './components/Notifications/NotificationsBell';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Civis',
  description: 'Civis - Empowering Community Engagement',
  icons: {
    icon: '/civislogo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="fixed top-4 right-4 z-50">
          <NotificationsBell />
        </div>
        {children}
        <ClientWrapper />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
