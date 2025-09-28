import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import Navbar from '@/components/Navbar';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

export const metadata: Metadata = {
  title: 'SmartPresence',
  description: 'A smart attendance system',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen flex flex-col bg-background font-sans antialiased", inter.variable)}>
        <Navbar />
        <main className="flex-grow">{children}</main>
        <footer className="w-full py-4 px-4 sm:px-8 md:px-12 mt-auto">
          <div className="container mx-auto text-center text-sm text-muted-foreground">
            Copyright © {new Date().getFullYear()} SmartPresence. Developed by Rohit Kokane.
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
