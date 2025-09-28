'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BookUser } from 'lucide-react';

export default function Navbar() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'students';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BookUser className="h-6 w-6" />
            <span className="font-bold">StudentApp</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/?view=students"
              className={cn(
                'transition-colors hover:text-foreground/80',
                view === 'students' ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              Students Details
            </Link>
            <Link
              href="/?view=attendance"
              className={cn(
                'transition-colors hover:text-foreground/80',
                view === 'attendance' ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              Attendance Record
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
