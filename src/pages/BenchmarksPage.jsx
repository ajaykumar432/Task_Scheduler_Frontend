import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { runBenchmark, getBenchmarks, getBenchmark } from "../api/services";

import {
  PageHeader,
  Badge,
  Spinner,
  EmptyState,
} from "../components/common/UI";

const ALGORITHMS = [
  { id: "priority-greedy", label: "Priority Greedy" },
  { id: "dsatur", label: "DSATUR" },
  { id: "simulated-annealing", label: "Simulated Annealing" },
  { id: "tabu-search", label: "Tabu Search" },
];

export default function BenchmarksPage() {
  const [algorithm, setAlgorithm] = useState("priority-greedy");
  const [selectedId, setSelectedId] = useState(null);

  const qc = useQueryClient();

  const { data: benchmarks, isLoading } = useQuery({
    queryKey: ["benchmarks"],
    queryFn: getBenchmarks,
  });

  const { data: detail } = useQuery({
    queryKey: ["benchmark", selectedId],
    queryFn: () => getBenchmark(selectedId),
    enabled: !!selectedId,
  });

  const mutation = useMutation({
    mutationFn: runBenchmark,
    onSuccess: (data) => {
      toast.success("Benchmark complete!");
      qc.invalidateQueries({ queryKey: ["benchmarks"] });
      setSelectedId(data.data._id);
    },
    onError: (err) => toast.error(err?.message || "Benchmark failed"),
  });

  const runs = detail?.data?.runs || [];

  const penaltyData = runs.map((r) => ({
    n: r.n,
    penalty: r.penalty,
    name: `n=${r.n} K=${r.K}`,
  }));

  const runtimeData = runs.map((r) => ({
    n: r.n,
    ms: r.runtimeMs,
    name: `n=${r.n} K=${r.K}`,
  }));

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Benchmarks"
        subtitle="Run the official 9-instance benchmark suite"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
              className="input text-sm w-full sm:w-auto"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              {ALGORITHMS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            <button
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              onClick={() =>
                mutation.mutate({
                  algorithm,
                  name: `${algorithm} - ${new Date().toLocaleTimeString()}`,
                })
              }
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Spinner size={14} />
                  Running...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Run Benchmark
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Sidebar */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Previous Runs
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : !benchmarks?.data?.length ? (
            <EmptyState title="No benchmarks yet" description="Run one above" />
          ) : (
            <div className="divide-y divide-surface-border max-h-[600px] overflow-y-auto">
              {benchmarks.data.map((b) => (
                <button
                  key={b._id}
                  className={`w-full text-left px-4 py-3 hover:bg-surface-border/40 transition-colors ${
                    selectedId === b._id ? "bg-brand-600/10" : ""
                  }`}
                  onClick={() => setSelectedId(b._id)}
                >
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {b.name}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>

                  <div className="mt-2">
                    <Badge
                      variant={b.status === "completed" ? "success" : "warning"}
                    >
                      {b.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="xl:col-span-2 space-y-4">
          {!selectedId ? (
            <div className="card flex items-center justify-center h-48">
              <p className="text-slate-500 text-sm text-center px-4">
                Select a benchmark to view results
              </p>
            </div>
          ) : !detail ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <>
              {/* Results Table */}
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-surface-border">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Results
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[700px] w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-surface-border">
                        {[
                          "n",
                          "K",
                          "Density",
                          "Feasible",
                          "Penalty",
                          "Runtime",
                          "Ratio",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {runs.map((r, i) => (
                        <tr
                          key={i}
                          className="border-b border-surface-border last:border-0 hover:bg-surface-border/20"
                        >
                          <td className="px-3 py-2 text-slate-300">{r.n}</td>

                          <td className="px-3 py-2 text-slate-300">{r.K}</td>

                          <td className="px-3 py-2 text-slate-400">
                            {r.density}
                          </td>

                          <td className="px-3 py-2">
                            {r.feasible ? (
                              <CheckCircle
                                size={14}
                                className="text-emerald-400"
                              />
                            ) : (
                              <XCircle size={14} className="text-red-400" />
                            )}
                          </td>

                          <td className="px-3 py-2 text-brand-300">
                            {r.penalty?.toFixed(2)}
                          </td>

                          <td className="px-3 py-2 text-slate-400">
                            {r.runtimeMs}ms
                          </td>

                          <td className="px-3 py-2 text-slate-400">
                            {r.empiricalRatio ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-4">
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                    Penalty vs n
                  </p>

                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={penaltyData}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />

                        <XAxis
                          dataKey="n"
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                          }}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            fontSize: 11,
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="penalty"
                          stroke="#0ea5e9"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-4">
                  <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                    Runtime vs n
                  </p>

                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={runtimeData}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />

                        <XAxis
                          dataKey="n"
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                          }}
                        />

                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "#94a3b8",
                          }}
                        />

                        <Tooltip
                          contentStyle={{
                            background: "#1e293b",
                            border: "1px solid #334155",
                            fontSize: 11,
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="ms"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
