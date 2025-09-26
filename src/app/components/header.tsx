import type { FC } from "react";
import { CheckSquare } from "lucide-react";

const Header: FC = () => {
  return (
    <header className="bg-card border-b shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold font-headline text-foreground">
              AttendEase
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
