import React from 'react';

export function Badge({ level }) {
  if (!level) return null;
  const lv = typeof level === 'string' ? level.toLowerCase() : '';
  if (lv === 'critical' || lv === 'red') return <span className="badge-critical">Critical</span>;
  if (lv === 'warning' || lv === 'warn' || lv === 'amber') return <span className="badge-warning">Warning</span>;
  return <span className="badge-safe">Safe</span>;
}

export function RiskBar({ score }) {
  const pct = Math.min(100, Math.max(0, score || 0));
  const color = pct > 60 ? '#ff4444' : pct > 35 ? '#ffb800' : '#00ff88';
  const shadow = pct > 60 ? 'rgba(255,68,68,0.5)' : pct > 35 ? 'rgba(255,184,0,0.5)' : 'rgba(0,255,136,0.5)';
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted">Risk Score</span>
        <span className="font-mono font-bold" style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${shadow}` }} />
      </div>
    </div>
  );
}

export function StatusDot({ status }) {
  const map = {
    Active: 'bg-warn animate-pulse',
    Resolved: 'bg-safe',
    'Follow-up': 'bg-neon animate-pulse',
    Online: 'bg-safe animate-pulse',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] || 'bg-muted'}`} />;
}
