'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet'; // Importamos SheetContent
import { Menu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- Contexto para el estado de la barra lateral ---
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      const mobileBreakpoint = 768; // Punto de quiebre 'md' de Tailwind
      const currentIsMobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(currentIsMobile);
      if (!currentIsMobile) {
        setIsOpen(true); // La barra lateral siempre está abierta en escritorio
      } else {
        setIsOpen(false); // La barra lateral está cerrada por defecto en móvil
      }
    };

    handleResize(); // Establecer estado inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar debe usarse dentro de un SidebarProvider');
  }
  return context;
}

// --- Componentes de la barra lateral ---

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  const { isOpen, setIsOpen, isMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground border-r-sidebar-border">
          <div className={cn("flex h-full flex-col", className)} {...props}>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Vista de escritorio
  return (
    <aside
      className={cn(
        "hidden md:flex sticky top-0 h-screen w-64 flex-shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div className={cn("flex h-14 items-center border-b px-4", className)} {...props}>
      {children}
    </div>
  );
}

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarContent({ className, children, ...props }: SidebarContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)} {...props}>
      {children}
    </div>
  );
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarFooter({ className, children, ...props }: SidebarFooterProps) {
  return (
    <div className={cn("border-t p-4", className)} {...props}>
      {children}
    </div>
  );
}

interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {}

export function SidebarMenu({ className, children, ...props }: SidebarMenuProps) {
  return (
    <ul className={cn("space-y-1", className)} {...props}>
      {children}
    </ul>
  );
}

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {}

export function SidebarMenuItem({ className, children, ...props }: SidebarMenuItemProps) {
  return (
    <li className={cn("", className)} {...props}>
      {children}
    </li>
  );
}

interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  isActive?: boolean;
  tooltip?: {
    children: React.ReactNode;
    side?: 'top' | 'right' | 'bottom' | 'left';
  };
}

export function SidebarMenuButton({ isActive, tooltip, className, children, ...props }: SidebarMenuButtonProps) {
  const buttonClasses = cn(
    "w-full justify-start",
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
    className
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" className={buttonClasses} {...props}>
              {children}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltip.side || 'right'}>
            {tooltip.children}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button variant="ghost" className={buttonClasses} {...props}>
      {children}
    </Button>
  );
}

interface SidebarTriggerProps extends React.ComponentPropsWithoutRef<typeof Button> {}

export function SidebarTrigger({ className, ...props }: SidebarTriggerProps) {
  const { setIsOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      onClick={() => setIsOpen(true)}
      {...props}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

interface SidebarInsetProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SidebarInset({ className, children, ...props }: SidebarInsetProps) {
  const { isMobile } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col",
        !isMobile && "md:ml-64", // Aplicar margen solo en escritorio
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}