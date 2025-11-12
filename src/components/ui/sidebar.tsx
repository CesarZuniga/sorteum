"use client";

import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Sidebar Context ---
interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!isMobile) {
      setIsOpen(true); // Open sidebar by default on desktop
    } else {
      setIsOpen(false); // Close sidebar by default on mobile
    }
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// --- Sidebar Main Component ---
interface SidebarProps extends React.ComponentProps<"aside"> {}

export function Sidebar({ className, children }: SidebarProps) { // Exportación con nombre
  const { isOpen, isMobile } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        isMobile && !isOpen && "hidden", // Hide completely on mobile if closed
        className
      )}
    >
      {children}
    </aside>
  );
}

// --- Sidebar Inset (for main content) ---
export function SidebarInset({ className, children }: React.ComponentProps<"div">) {
  const { isOpen, isMobile } = useSidebar();
  return (
    <div
      className={cn(
        "flex-1 transition-all duration-300",
        !isMobile && (isOpen ? "ml-64" : "ml-16"),
        className
      )}
    >
      {children}
    </div>
  );
}

// --- Sidebar Trigger (for mobile toggle) ---
export function SidebarTrigger({ className, children, ...props }: React.ComponentProps<typeof Button>) {
  const { isOpen, setIsOpen } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsOpen(!isOpen)}
      className={cn("h-8 w-8", className)}
      {...props}
    >
      {children}
    </Button>
  );
}


// --- Sidebar Header ---
export function SidebarHeader({ className, children }: React.ComponentProps<"div">) {
  const { isOpen } = useSidebar();
  return (
    <div
      className={cn(
        "flex h-14 items-center border-b px-4",
        !isOpen && "justify-center",
        className
      )}
    >
      {children}
    </div>
  );
}

// --- Sidebar Content ---
export function SidebarContent({ className, children }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex-1 overflow-auto py-2", className)}>
      {children}
    </div>
  );
}

// --- Sidebar Footer ---
export function SidebarFooter({ className, children }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mt-auto border-t p-2", className)}>
      {children}
    </div>
  );
}

// --- Sidebar Menu ---
export function SidebarMenu({ className, children }: React.ComponentProps<"nav">) {
  return (
    <nav className={cn("grid items-start px-2 text-sm font-medium lg:px-4", className)}>
      {children}
    </nav>
  );
}

// --- Sidebar Menu Item ---
export function SidebarMenuItem({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("relative", className)}>{children}</div>;
}

// --- Sidebar Menu Button ---
const sidebarMenuButtonVariants = cva(
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-primary",
  {
    variants: {
      isActive: {
        true: "bg-sidebar-accent text-sidebar-accent-foreground hover:text-sidebar-accent-foreground",
        false: "",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
);

interface SidebarMenuButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  tooltip?: {
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
  };
}

export const SidebarMenuButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  SidebarMenuButtonProps
>(({ className, isActive, asChild = false, tooltip, children, ...props }, ref) => {
  const Comp = asChild ? Slot : Button;
  const { isOpen } = useSidebar();

  const button = (
    <Comp
      className={cn(sidebarMenuButtonVariants({ isActive }), className)}
      variant="ghost"
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  );

  if (!isOpen && tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side={tooltip.side || "right"}>{tooltip.children}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
});
SidebarMenuButton.displayName = "SidebarMenuButton";