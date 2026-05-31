import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInstance, runSchedule, getScheduleHistory } from '../api/services';
import { PageHeader, Badge, Spinner } from '../components/common/UI';

const DIM_LABELS = ['CPU', 'RAM', 'GPU', 'Net'];

export default function InstanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: instData, isLoading } = useQuery({
    queryKey: ['instance', id],
    queryFn: () => getInstance(id),
  });

  const { data: histData } = useQuery({
    queryKey: ['schedule-history', id],
    queryFn: () => getScheduleHistory(id),
  });

  const scheduleMutation = useMutation({
    mutationFn: (algorithm) => runSchedule({ instanceId: id, algorithm }),
    onSuccess: (data) => {
      const s = data.data;
      if (s.feasible) {
        toast.success(`Scheduled! Penalty: ${s.penalty?.toFixed(2)}`);
      } else {
        toast.error(`Infeasible: ${s.violationReason}`);
      }
    },
    onError: (err) => toast.error(err?.message || 'Scheduling failed'),
  });

  const inst = instData?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size={32} />
      </div>
    );
  }

  if (!inst) {
    return (
      <div className="p-4 sm:p-6 text-slate-400">
        Instance not found
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        onClick={() => navigate('/instances')}
      >
        <ArrowLeft size={14} />
        Back to Instances
      </button>

      {/* Header */}
      <PageHeader
        title={inst.name}
        subtitle={
          inst.description ||
          `n=${inst.n} tasks · K=${inst.K} slots · density=${inst.conflictDensity}`
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {[
              'priority-greedy',
              'dsatur',
              'simulated-annealing',
              'tabu-search',
            ].map((algo) => (
              <button
                key={algo}
                className="btn-primary text-[10px] sm:text-xs flex items-center gap-1 whitespace-nowrap"
                onClick={() => scheduleMutation.mutate(algo)}
                disabled={scheduleMutation.isPending}
              >
                <Play size={12} />
                {algo.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tasks', value: inst.n },
          { label: 'Slots', value: inst.K },
          { label: 'Conflicts', value: inst.conflicts?.length ?? 0 },
          { label: 'Seed', value: inst.seed },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white font-mono">
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Slot Capacities */}
      <div className="card mb-5 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Slot Capacities
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-[500px] w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left py-2 pr-4 text-slate-400">
                  Slot
                </th>

                {DIM_LABELS.map((d) => (
                  <th
                    key={d}
                    className="text-right py-2 px-3 text-slate-400"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(inst.capacities || []).map((cap, s) => (
                <tr
                  key={s}
                  className="border-b border-surface-border last:border-0"
                >
                  <td className="py-2 pr-4 text-slate-300">
                    Slot {s}
                  </td>

                  {cap.map((v, d) => (
                    <td
                      key={d}
                      className="py-2 px-3 text-right text-brand-300"
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule History */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">
          Schedule History
        </h3>

        {scheduleMutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
            <Spinner size={14} />
            Running scheduler...
          </div>
        )}

        <div className="space-y-2">
          {(histData?.data || []).map((s) => (
            <div
              key={s._id}
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 py-3 border-b border-surface-border last:border-0"
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Badge variant={s.feasible ? 'success' : 'danger'}>
                  {s.feasible ? '✓ Feasible' : '✗ Infeasible'}
                </Badge>

                <span className="text-xs font-mono text-slate-400 break-all">
                  {s.algorithm}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-slate-400">
                {s.feasible && (
                  <span className="font-mono">
                    P={s.penalty?.toFixed(2)}
                  </span>
                )}

                <span>{s.runtimeMs}ms</span>

                <span>
                  {new Date(s.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {!histData?.data?.length && !scheduleMutation.isPending && (
            <p className="text-sm text-slate-500 text-center py-4">
              No schedules yet. Run an algorithm above.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}