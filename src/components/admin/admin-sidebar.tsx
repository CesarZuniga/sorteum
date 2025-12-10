'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, Ticket, HelpCircle, CreditCard } from 'lucide-react'; // Importar CreditCard
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '../logo';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client-utils';
import { useTranslations } from 'next-intl'; // Import useTranslations

export function AdminSidebar() {
  const t = useTranslations('Admin'); // Initialize translations
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Redirect to login page after logout
  };

  const menuItems = [
    {
      href: '/admin',
      label: t('dashboardTitle'), // Use translation
      icon: LayoutDashboard,
    },
    {
      href: '/admin/raffles',
      label: t('rafflesTitle'), // Use translation
      icon: Ticket,
    },
    {
      href: '/admin/faqs', // Nueva ruta para FAQs
      label: t('faqsTitle'), // Nueva traducción
      icon: HelpCircle, // Nuevo icono
    },
    {
      href: '/admin/payment-methods', // Nueva ruta para métodos de pago
      label: t('paymentMethodsTitle'), // Nueva traducción
      icon: CreditCard, // Nuevo icono
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
              tooltip={{ children: t('logout'), side: 'right' }} // Use translation for tooltip
            >
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                <div className="flex items-center gap-2"> 
                  <LogOut />
                  <span>{t('logout')}</span> {/* Use translation for text */}
                </div>
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}