import api from './axios';

// ── Instances ──────────────────────────────────────────────────────
export const getInstances = (params) => api.get('/instances', { params }).then(r => r.data);
export const getInstance = (id) => api.get(`/instances/${id}`).then(r => r.data);
export const generateInstance = (body) => api.post('/instances/generate', body).then(r => r.data);
export const createInstance = (body) => api.post('/instances', body).then(r => r.data);
export const deleteInstance = (id) => api.delete(`/instances/${id}`).then(r => r.data);

// ── Scheduler ──────────────────────────────────────────────────────
export const runSchedule = (body) => api.post('/scheduler/run', body).then(r => r.data);
export const getScheduleHistory = (instanceId) => api.get(`/scheduler/history/${instanceId}`).then(r => r.data);
export const getSchedulerStats = () => api.get('/scheduler/stats/overview').then(r => r.data);

// ── Benchmarks ─────────────────────────────────────────────────────
export const runBenchmark = (body) => api.post('/benchmarks/run', body).then(r => r.data);
export const getBenchmarks = () => api.get('/benchmarks').then(r => r.data);
export const getBenchmark = (id) => api.get(`/benchmarks/${id}`).then(r => r.data);
export const getBenchmarkSuite = () => api.get('/benchmarks/suite').then(r => r.data);

// ── Tasks ──────────────────────────────────────────────────────────
export const getTasks = (instanceId) => api.get('/tasks', { params: { instanceId } }).then(r => r.data);
