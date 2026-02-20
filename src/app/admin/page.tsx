'use client';

import { DashboardCharts } from '@/components/admin/dashboard-charts';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('Admin');
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">{t('dashboardTitle')}</h1>
      <DashboardCharts />
    </div>
  );
}
