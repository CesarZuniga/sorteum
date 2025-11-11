import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { createSupabaseServerClient } from '@/integrations/supabase/server'; // Import server client

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    redirect('/login');
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