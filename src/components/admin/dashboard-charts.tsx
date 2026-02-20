'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Ticket, Activity, TrendingUp, Users, RefreshCw, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Raffle, Ticket as TicketType, TicketStatusCounts } from '@/lib/definitions';
import { getRaffles, getTicketsByRaffleId } from '@/lib/data';
import { useTranslations } from 'next-intl';
import { FadeIn } from '@/components/fade-in';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, isAfter } from 'date-fns';

const REFRESH_INTERVAL = 30_000; // 30 seconds

type RaffleWithCounts = {
  raffle: Raffle;
  counts: TicketStatusCounts;
  tickets: TicketType[];
};

export function DashboardCharts() {
  const t = useTranslations('Admin');
  const [rafflesData, setRafflesData] = useState<RaffleWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const raffles = await getRaffles();
      const results = await Promise.all(
        raffles.map(async (raffle) => {
          const tickets = await getTicketsByRaffleId(raffle.id);
          // Compute counts client-side from fetched tickets (avoids 4 extra HEAD queries per raffle)
          const counts: TicketStatusCounts = { available: 0, reserved: 0, paid: 0, winner: 0, total: tickets.length };
          for (const ticket of tickets) {
            if (ticket.status in counts) {
              counts[ticket.status]++;
            }
          }
          return { raffle, counts, tickets };
        })
      );
      setRafflesData(results);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  // -- Aggregated metrics --
  const metrics = useMemo(() => {
    const totalRevenue = rafflesData.reduce((acc, { raffle, counts }) => {
      return acc + counts.paid * raffle.price;
    }, 0);
    const totalPaid = rafflesData.reduce((acc, { counts }) => acc + counts.paid, 0);
    const totalReserved = rafflesData.reduce((acc, { counts }) => acc + counts.reserved, 0);
    const totalTickets = rafflesData.reduce((acc, { counts }) => acc + counts.total, 0);
    const activeRaffles = rafflesData.filter(({ raffle }) => raffle.active).length;
    const conversionRate = totalTickets > 0 ? ((totalPaid + totalReserved) / totalTickets) * 100 : 0;

    return { totalRevenue, totalPaid, totalReserved, totalTickets, activeRaffles, conversionRate };
  }, [rafflesData]);

  // -- Revenue by raffle (bar chart) --
  const revenueByRaffle = useMemo(() => {
    return rafflesData
      .map(({ raffle, counts }) => ({
        name: raffle.name.length > 20 ? raffle.name.substring(0, 20) + '...' : raffle.name,
        fullName: raffle.name,
        paid: counts.paid * raffle.price,
        reserved: counts.reserved * raffle.price,
      }))
      .sort((a, b) => (b.paid + b.reserved) - (a.paid + a.reserved))
      .slice(0, 8);
  }, [rafflesData]);

  // -- Ticket status distribution (pie chart) --
  const ticketDistribution = useMemo(() => {
    const available = rafflesData.reduce((acc, { counts }) => acc + counts.available, 0);
    const reserved = rafflesData.reduce((acc, { counts }) => acc + counts.reserved, 0);
    const paid = rafflesData.reduce((acc, { counts }) => acc + counts.paid, 0);
    const winner = rafflesData.reduce((acc, { counts }) => acc + counts.winner, 0);

    return [
      { name: 'available', value: available, fill: 'hsl(var(--muted-foreground))' },
      { name: 'reserved', value: reserved, fill: 'hsl(45, 93%, 47%)' },
      { name: 'paid', value: paid, fill: 'hsl(142, 71%, 45%)' },
      { name: 'winner', value: winner, fill: 'hsl(var(--primary))' },
    ].filter((d) => d.value > 0);
  }, [rafflesData]);

  // -- Sales activity over last 14 days (area chart) --
  const salesActivity = useMemo(() => {
    const today = startOfDay(new Date());
    const days: { date: string; paid: number; reserved: number }[] = [];

    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i);
      days.push({ date: format(day, 'MMM dd'), paid: 0, reserved: 0 });
    }

    for (const { tickets } of rafflesData) {
      for (const ticket of tickets) {
        if (ticket.purchaseDate) {
          const ticketDay = startOfDay(new Date(ticket.purchaseDate));
          const daysAgo = Math.floor((today.getTime() - ticketDay.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 14) {
            const idx = 13 - daysAgo;
            if (ticket.status === 'paid' || ticket.status === 'winner') {
              days[idx].paid++;
            }
          }
        }
        if (ticket.reservationExpiresAt && ticket.status === 'reserved') {
          const ticketDay = startOfDay(new Date(ticket.reservationExpiresAt));
          const daysAgo = Math.floor((today.getTime() - ticketDay.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo >= 0 && daysAgo < 14) {
            const idx = 13 - daysAgo;
            days[idx].reserved++;
          }
        }
      }
    }

    return days;
  }, [rafflesData]);

  // -- Chart configs --
  const revenueChartConfig: ChartConfig = {
    paid: { label: t('chartPaidRevenue'), color: 'hsl(142, 71%, 45%)' },
    reserved: { label: t('chartReservedRevenue'), color: 'hsl(45, 93%, 47%)' },
  };

  const pieChartConfig: ChartConfig = {
    available: { label: t('raffleMetricsAvailableTickets'), color: 'hsl(var(--muted-foreground))' },
    reserved: { label: t('raffleMetricsReservedTickets'), color: 'hsl(45, 93%, 47%)' },
    paid: { label: t('raffleMetricsPaidTickets'), color: 'hsl(142, 71%, 45%)' },
    winner: { label: t('chartWinners'), color: 'hsl(var(--primary))' },
  };

  const activityChartConfig: ChartConfig = {
    paid: { label: t('chartPaidTickets'), color: 'hsl(142, 71%, 45%)' },
    reserved: { label: t('raffleMetricsReservedTickets'), color: 'hsl(45, 93%, 47%)' },
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Top metrics row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('chartLastUpdated')}: {format(lastRefresh, 'HH:mm:ss')}</span>
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('chartRefresh')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { title: t('totalRevenue'), value: formatCurrency(metrics.totalRevenue), icon: DollarSign, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
          { title: t('activeRaffles'), value: metrics.activeRaffles, icon: Activity, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
          { title: t('ticketsSold'), value: metrics.totalPaid, icon: Ticket, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400' },
          { title: t('chartConversionRate'), value: `${metrics.conversionRate.toFixed(1)}%`, icon: TrendingUp, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
        ].map((metric, i) => (
          <FadeIn key={metric.title} delay={i * 80}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${metric.iconBg}`}>
                  <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue by Raffle - Bar Chart */}
        <FadeIn delay={100} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t('chartRevenueByRaffle')}</CardTitle>
              <CardDescription>{t('chartRevenueByRaffleDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByRaffle.length > 0 ? (
                <ChartContainer config={revenueChartConfig} className="aspect-auto h-[300px] w-full">
                  <BarChart data={revenueByRaffle} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span>{formatCurrency(value as number)}</span>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="paid" fill="var(--color-paid)" radius={[4, 4, 0, 0]} stackId="revenue" />
                    <Bar dataKey="reserved" fill="var(--color-reserved)" radius={[4, 4, 0, 0]} stackId="revenue" />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message={t('chartNoData')} />
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Ticket Distribution - Pie Chart */}
        <FadeIn delay={200} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">{t('chartTicketDistribution')}</CardTitle>
              <CardDescription>{t('chartTicketDistributionDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketDistribution.length > 0 ? (
                <ChartContainer config={pieChartConfig} className="aspect-square h-[300px] w-full">
                  <PieChart>
                    <Pie
                      data={ticketDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {ticketDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <EmptyState message={t('chartNoData')} />
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Sales Activity - Area Chart */}
      <FadeIn delay={300}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('chartSalesActivity')}</CardTitle>
            <CardDescription>{t('chartSalesActivityDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={activityChartConfig} className="aspect-auto h-[250px] w-full">
              <AreaChart data={salesActivity} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradReserved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(45, 93%, 47%)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stroke="hsl(142, 71%, 45%)"
                  fill="url(#gradPaid)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="reserved"
                  stroke="hsl(45, 93%, 47%)"
                  fill="url(#gradReserved)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Raffle Performance Table */}
      <FadeIn delay={400}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('chartRafflePerformance')}</CardTitle>
            <CardDescription>{t('chartRafflePerformanceDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {rafflesData.length > 0 ? (
              <div className="space-y-4">
                {rafflesData
                  .sort((a, b) => (b.counts.paid * b.raffle.price) - (a.counts.paid * a.raffle.price))
                  .map(({ raffle, counts }) => {
                    const soldPct = raffle.ticketCount > 0
                      ? ((counts.paid + counts.reserved) / raffle.ticketCount) * 100
                      : 0;
                    const revenue = counts.paid * raffle.price;
                    const isExpired = !isAfter(new Date(raffle.deadline), new Date());

                    return (
                      <div
                        key={raffle.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{raffle.name}</h4>
                            <Badge
                              variant={raffle.active ? 'default' : 'secondary'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {raffle.active ? t('active') : isExpired ? t('ended') : t('processing')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Ticket className="h-3 w-3" />
                              {counts.paid + counts.reserved}/{raffle.ticketCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(revenue)}
                            </span>
                            {counts.winner > 0 && (
                              <span className="flex items-center gap-1 text-primary">
                                <Trophy className="h-3 w-3" />
                                {counts.winner}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:w-48">
                          <Progress
                            value={soldPct}
                            className="h-2 flex-1 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-orange-400"
                          />
                          <span className="text-xs font-semibold w-10 text-right">{soldPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState message={t('chartNoData')} />
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded animate-shimmer" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-20 rounded animate-shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="h-5 w-40 rounded animate-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded animate-shimmer" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="h-5 w-40 rounded animate-shimmer" />
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full rounded animate-shimmer" />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-48 rounded animate-shimmer" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full rounded animate-shimmer" />
        </CardContent>
      </Card>
    </div>
  );
}
