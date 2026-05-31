import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getInstances,
  generateInstance,
  deleteInstance,
} from '../api/services';
import {
  PageHeader,
  Badge,
  EmptyState,
  Spinner,
} from '../components/common/UI';

export default function InstancesPage() {
  const [showGen, setShowGen] = useState(false);

  const [form, setForm] = useState({
    n: 20,
    K: 5,
    conflictDensity: 0.3,
    seed: 42,
    name: '',
  });

  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: () => getInstances({ limit: 50 }),
  });

  const genMutation = useMutation({
    mutationFn: generateInstance,
    onSuccess: () => {
      toast.success('Instance generated!');
      qc.invalidateQueries({ queryKey: ['instances'] });
      setShowGen(false);
    },
    onError: (err) =>
      toast.error(err?.message || 'Generation failed'),
  });

  const delMutation = useMutation({
    mutationFn: deleteInstance,
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['instances'] });
    },
  });

  const statusVariant = {
    ready: 'info',
    scheduled: 'success',
    draft: 'default',
    archived: 'warning',
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Instances"
        subtitle="Manage scheduling problem instances"
        actions={
          <button
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={() => setShowGen(!showGen)}
          >
            <Wand2 size={14} />
            Generate
          </button>
        }
      />

      {/* Generate Form */}
      {showGen && (
        <div className="card p-4 sm:p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">
            Generate Instance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                key: 'name',
                label: 'Name (optional)',
                type: 'text',
              },
              {
                key: 'n',
                label: 'Tasks (n)',
                type: 'number',
                min: 1,
                max: 200,
              },
              {
                key: 'K',
                label: 'Slots (K)',
                type: 'number',
                min: 1,
                max: 20,
              },
              {
                key: 'conflictDensity',
                label: 'Conflict Density',
                type: 'number',
                step: 0.05,
                min: 0,
                max: 1,
              },
              {
                key: 'seed',
                label: 'Seed',
                type: 'number',
              },
            ].map(({ key, label, ...rest }) => (
              <div key={key}>
                <label className="label">{label}</label>

                <input
                  className="input w-full"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  {...rest}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-5">
            <button
              className="btn-primary flex items-center justify-center gap-2"
              onClick={() => genMutation.mutate(form)}
              disabled={genMutation.isPending}
            >
              <Plus size={14} />
              {genMutation.isPending
                ? 'Generating...'
                : 'Generate'}
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowGen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !data?.data?.length ? (
          <EmptyState
            title="No instances yet"
            description="Generate your first problem instance to get started"
            action={
              <button
                className="btn-primary"
                onClick={() => setShowGen(true)}
              >
                Generate Instance
              </button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="block lg:hidden p-4 space-y-4">
              {data.data.map((inst) => (
                <div
                  key={inst._id}
                  className="border border-surface-border rounded-xl p-4 bg-surface-card"
                >
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <h3 className="font-medium text-slate-200 break-words">
                      {inst.name}
                    </h3>

                    <Badge
                      variant={
                        statusVariant[inst.status] || 'default'
                      }
                    >
                      {inst.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Tasks</p>
                      <p className="text-slate-200 font-mono">
                        {inst.n}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Slots</p>
                      <p className="text-slate-200 font-mono">
                        {inst.K}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Density</p>
                      <p className="text-slate-200 font-mono">
                        {inst.conflictDensity}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Created</p>
                      <p className="text-slate-200 text-xs">
                        {new Date(
                          inst.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                      onClick={() =>
                        navigate(`/instances/${inst._id}`)
                      }
                    >
                      <Eye size={14} />
                      View
                    </button>

                    <button
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      onClick={() =>
                        delMutation.mutate(inst._id)
                      }
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    {[
                      'Name',
                      'Tasks (n)',
                      'Slots (K)',
                      'Density',
                      'Status',
                      'Created',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {data.data.map((inst) => (
                    <tr
                      key={inst._id}
                      className="border-b border-surface-border last:border-0 hover:bg-surface-border/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-200 max-w-[220px] truncate">
                        {inst.name}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        {inst.n}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300">
                        {inst.K}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-400">
                        {inst.conflictDensity}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            statusVariant[inst.status] ||
                            'default'
                          }
                        >
                          {inst.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(
                          inst.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-slate-400 hover:text-brand-400 transition-colors"
                            onClick={() =>
                              navigate(
                                `/instances/${inst._id}`
                              )
                            }
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            onClick={() =>
                              delMutation.mutate(inst._id)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}