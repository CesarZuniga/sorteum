'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Ticket, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui'; // Importando desde el index.ts
import { Logo } from '../logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client-utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page after logout
  };

  const menuItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/admin/raffles',
      label: 'Raffles',
      icon: Ticket,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <div className="flex items-center gap-2">
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                </Link>
              </SidebarMenuButton>
          </SidebarMenuItem>)
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={{ children: 'Log Out', side: 'right' }}
            >
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                {/* Envuelto en un div para que el Button tenga un único hijo */}
                <div className="flex items-center gap-2"> 
                  <LogOut />
                  <span>Log Out</span>
                </div>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}