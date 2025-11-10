
import { DashboardMetrics } from '@/components/admin/dashboard-metrics';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      <DashboardMetrics />
      
      {/* Additional dashboard components like recent activity or charts could go here */}
    </div>
  );
}
