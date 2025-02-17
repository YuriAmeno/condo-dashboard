import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Footer } from './footer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function BaseLayout() {
  const [open, setOpen] = useState(false);

  const handleNavigate = () => {
    setOpen(false); // Close sheet when navigation occurs
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="p-0 w-[280px] sm:w-[350px]"
          >
            <nav className="h-full">
              <Sidebar 
                className="w-full border-r-0" 
                onNavigate={handleNavigate}
              />
            </nav>
          </SheetContent>
        </Sheet>
      </Header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:block w-64 shrink-0" />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container py-6 px-4 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}