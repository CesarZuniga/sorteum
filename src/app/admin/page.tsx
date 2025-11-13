import { DashboardMetrics } from '@/components/admin/dashboard-metrics';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('Admin');
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">{t('dashboardTitle')}</h1>
      <DashboardMetrics />
      
      {/* Additional dashboard components like recent activity or charts could go here */}
    </div>
  );
}