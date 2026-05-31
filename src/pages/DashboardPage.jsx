import { useQuery } from '@tanstack/react-query';
import {
  Server,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import {
  getInstances,
  getSchedulerStats,
} from '../api/services';

import {
  PageHeader,
  StatCard,
  Spinner,
  Badge,
} from '../components/common/UI';

const ALGO_COLORS = {
  'priority-greedy': '#0ea5e9',
  dsatur: '#8b5cf6',
  'simulated-annealing': '#10b981',
  'tabu-search': '#f59e0b',
};

export default function DashboardPage() {
  const { data: instances, isLoading: instLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: () => getInstances({ limit: 5 }),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['scheduler-stats'],
    queryFn: getSchedulerStats,
  });

  const statusBadge = (status) => {
    const map = {
      ready: 'info',
      scheduled: 'success',
      draft: 'default',
      archived: 'warning',
    };

    return (
      <Badge variant={map[status] || 'default'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="MSME Credit Pipeline Scheduling Overview"
      />

      {/* Statistics */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Schedules"
            value={stats?.data?.total ?? 0}
            icon={Zap}
            color="brand"
          />

          <StatCard
            label="Feasible"
            value={stats?.data?.feasible ?? 0}
            icon={CheckCircle}
            color="green"
          />

          <StatCard
            label="Infeasible"
            value={stats?.data?.infeasible ?? 0}
            icon={XCircle}
            color="red"
          />

          <StatCard
            label="Instances"
            value={instances?.total ?? 0}
            icon={Server}
            color="yellow"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Chart */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Algorithm Usage
          </h3>

          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="w-full h-[260px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.data?.byAlgo || []}>
                  <XAxis
                    dataKey="_id"
                    tick={{
                      fontSize: 11,
                      fill: '#94a3b8',
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: '#94a3b8',
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{
                      color: '#e2e8f0',
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[4, 4, 0, 0]}
                  >
                    {(stats?.data?.byAlgo || []).map(
                      (entry) => (
                        <Cell
                          key={entry._id}
                          fill={
                            ALGO_COLORS[entry._id] ||
                            '#64748b'
                          }
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Instances */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Recent Instances
          </h3>

          {instLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2">
              {(instances?.data || []).map((inst) => (
                <div
                  key={inst._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3 border-b border-surface-border last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">
                      {inst.name}
                    </p>

                    <p className="text-xs text-slate-500 font-mono">
                      n={inst.n} · K={inst.K}
                    </p>
                  </div>

                  <div className="self-start sm:self-auto">
                    {statusBadge(inst.status)}
                  </div>
                </div>
              ))}

              {!instances?.data?.length && (
                <p className="text-sm text-slate-500 text-center py-6">
                  No instances yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}