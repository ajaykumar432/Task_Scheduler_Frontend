import { Loader2 } from 'lucide-react';

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-400 ${className}`} />;
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, icon: Icon, color = 'brand' }) {
  const colors = {
    brand: 'text-brand-400 bg-brand-400/10',
    green: 'text-emerald-400 bg-emerald-400/10',
    red:   'text-red-400 bg-red-400/10',
    yellow:'text-yellow-400 bg-yellow-400/10',
  };
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default:  'bg-slate-700 text-slate-300',
    success:  'bg-emerald-500/20 text-emerald-400',
    danger:   'bg-red-500/20 text-red-400',
    warning:  'bg-yellow-500/20 text-yellow-400',
    info:     'bg-brand-500/20 text-brand-400',
  };
  return <span className={`badge ${variants[variant]}`}>{children}</span>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-surface-border rounded-xl flex items-center justify-center mb-3">
        <span className="text-2xl">📭</span>
      </div>
      <p className="text-slate-200 font-medium">{title}</p>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Select({ label, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className="input" {...props} />
    </div>
  );
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className="input" {...props} />
    </div>
  );
}
