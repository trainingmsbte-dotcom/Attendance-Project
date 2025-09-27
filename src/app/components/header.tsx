import type { FC } from "react";
import { School } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header: FC = () => {
  return (
    <header className="bg-card border-b border-border/40 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <div className="bg-primary/10 p-2 rounded-lg">
                <School className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Smart School System
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
