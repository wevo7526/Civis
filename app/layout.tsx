import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import "./globals.css";
import ClientWrapper from './components/ClientWrapper';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { RemindersProvider } from './components/Reminders/RemindersProvider';
import { NotificationsBell } from './components/Notifications/NotificationsBell';

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
        <RemindersProvider>
          <div className="fixed top-4 right-4 z-50">
            <NotificationsBell />
          </div>
          {children}
        </RemindersProvider>
        <ClientWrapper />
      </body>
    </html>
  );
}
