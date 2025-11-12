'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui'; // Importando desde el index.ts
import { useSession } from '@/components/SessionProvider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login');
    }
  }, [session, isLoading, router]);

  if (isLoading || !session) {
    return <div className="flex items-center justify-center min-h-screen">Loading admin area...</div>;
  }

  return (
    <SidebarProvider>
      <div className="md:flex">
        <AdminSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
             <SidebarTrigger className="md:hidden"/>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}