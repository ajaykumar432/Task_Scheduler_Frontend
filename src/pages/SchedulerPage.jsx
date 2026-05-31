import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import { getInstances, runSchedule } from "../api/services";

import { PageHeader, Spinner } from "../components/common/UI";

const ALGORITHMS = [
  {
    id: "priority-greedy",
    label: "Priority Greedy",
    desc: "Fast · Good baseline",
  },
  {
    id: "dsatur",
    label: "DSATUR Variant",
    desc: "Conflict-aware coloring",
  },
  {
    id: "simulated-annealing",
    label: "Simulated Annealing",
    desc: "Best quality · Slower",
  },
  {
    id: "tabu-search",
    label: "Tabu Search",
    desc: "Avoids cycling · Robust",
  },
];

const ALGO_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];

export default function SchedulerPage() {
  const [selected, setSelected] = useState({
    instanceId: "",
    algorithm: "priority-greedy",
  });

  const [result, setResult] = useState(null);

  const { data: instances } = useQuery({
    queryKey: ["instances"],
    queryFn: () => getInstances({ limit: 100 }),
  });

  const mutation = useMutation({
    mutationFn: runSchedule,
    onSuccess: (data) => {
      setResult(data.data);

      if (data.data.feasible) {
        toast.success("Schedule found!");
      } else {
        toast.error("No feasible schedule found");
      }
    },
    onError: (err) => toast.error(err?.message || "Scheduler error"),
  });

  const penaltyData = result?.penaltyBreakdown
    ? [
        {
          name: "Delay",
          value: result.penaltyBreakdown.delayPenalty,
        },
        {
          name: "Imbalance",
          value: result.penaltyBreakdown.loadImbalancePenalty,
        },
        {
          name: "SLA Risk",
          value: result.penaltyBreakdown.slaRiskPenalty,
        },
        {
          name: "GPU Frag",
          value: result.penaltyBreakdown.gpuFragmentationPenalty,
        },
      ]
    : [];

  const utilizationData =
    result?.slotUtilization?.map((row, i) => ({
      slot: `S${i}`,
      CPU: row[0],
      RAM: row[1],
      GPU: row[2],
      Net: row[3],
    })) || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Scheduler"
        subtitle="Run scheduling algorithms on your instances"
      />

      {/* Configuration */}
      <div className="card p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Instance */}
          <div>
            <label className="label">Instance</label>

            <select
              className="input w-full"
              value={selected.instanceId}
              onChange={(e) =>
                setSelected((prev) => ({
                  ...prev,
                  instanceId: e.target.value,
                }))
              }
            >
              <option value="">Select an instance...</option>

              {(instances?.data || []).map((inst) => (
                <option key={inst._id} value={inst._id}>
                  {inst.name} (n={inst.n}, K={inst.K})
                </option>
              ))}
            </select>
          </div>

          {/* Algorithms */}
          <div>
            <label className="label">Algorithm</label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALGORITHMS.map((algo) => (
                <button
                  key={algo.id}
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      algorithm: algo.id,
                    }))
                  }
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selected.algorithm === algo.id
                      ? "border-brand-500 bg-brand-500/10 text-brand-300"
                      : "border-surface-border text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <p className="text-xs font-semibold">{algo.label}</p>

                  <p className="text-xs opacity-60 mt-1">{algo.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          className="btn-primary mt-5 flex items-center justify-center gap-2 w-full sm:w-auto"
          onClick={() => mutation.mutate(selected)}
          disabled={!selected.instanceId || mutation.isPending}
        >
          {mutation.isPending ? (
            <>
              <Spinner size={14} />
              Running...
            </>
          ) : (
            <>
              <Play size={14} />
              Run Scheduler
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Status */}
          <div
            className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
              result.feasible
                ? "border-emerald-600/40 bg-emerald-500/5"
                : "border-red-600/40 bg-red-500/5"
            }`}
          >
            {result.feasible ? (
              <CheckCircle
                size={22}
                className="text-emerald-400 flex-shrink-0"
              />
            ) : (
              <XCircle size={22} className="text-red-400 flex-shrink-0" />
            )}

            <div>
              <p className="font-semibold text-sm text-white">
                {result.feasible
                  ? "Feasible Schedule Found"
                  : "No Feasible Schedule"}
              </p>

              <p className="text-xs text-slate-400">
                {result.feasible
                  ? `Penalty: ${result.penalty?.toFixed(4)} · Runtime: ${
                      result.runtimeMs
                    }ms · Algorithm: ${result.algorithm}`
                  : result.violationReason}
              </p>
            </div>
          </div>

          {result.feasible && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Penalty Chart */}
              <div className="card p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">
                  Penalty Breakdown
                </h3>

                <div className="h-[260px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={penaltyData} layout="vertical">
                      <XAxis
                        type="number"
                        tick={{
                          fontSize: 10,
                          fill: "#94a3b8",
                        }}
                      />

                      <YAxis
                        dataKey="name"
                        type="category"
                        width={80}
                        tick={{
                          fontSize: 11,
                          fill: "#94a3b8",
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid #334155",
                          fontSize: 12,
                        }}
                      />

                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {penaltyData.map((_, i) => (
                          <Cell key={i} fill={ALGO_COLORS[i % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Utilization Chart */}
              <div className="card p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">
                  Slot Utilization (%)
                </h3>

                <div className="h-[260px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={utilizationData.slice(0, 8)}>
                      <PolarGrid stroke="#334155" />

                      <PolarAngleAxis
                        dataKey="slot"
                        tick={{
                          fontSize: 11,
                          fill: "#94a3b8",
                        }}
                      />

                      <Radar
                        name="CPU"
                        dataKey="CPU"
                        stroke="#0ea5e9"
                        fill="#0ea5e9"
                        fillOpacity={0.2}
                      />

                      <Radar
                        name="GPU"
                        dataKey="GPU"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assignment */}
              <div className="card p-4 sm:p-5 xl:col-span-2">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">
                  Task Assignment
                </h3>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {Object.entries(result.assignment || {}).map(
                    ([task, slot]) => (
                      <div
                        key={task}
                        className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-lg font-mono text-xs"
                      >
                        <span className="text-slate-300">{task}</span>

                        <span className="text-slate-500">→</span>

                        <span className="text-brand-400">S{slot}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
