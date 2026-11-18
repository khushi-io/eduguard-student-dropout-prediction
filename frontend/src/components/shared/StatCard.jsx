import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color = 'neon', trend, sub, delay = 0 }) {
  const colorMap = {
    neon:    { text: 'text-neon',    glow: 'shadow-neon',    bg: 'bg-neon/10',    border: 'border-neon/20' },
    safe:    { text: 'text-safe',    glow: 'shadow-safe',    bg: 'bg-safe/10',    border: 'border-safe/20' },
    danger:  { text: 'text-danger',  glow: 'shadow-danger',  bg: 'bg-danger/10',  border: 'border-danger/20' },
    warn:    { text: 'text-warn',    glow: 'shadow-warn',    bg: 'bg-warn/10',    border: 'border-warn/20' },
    purple:  { text: 'text-purple-400', glow: '', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  };
  const c = colorMap[color] || colorMap.neon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`stat-card border ${c.border} relative overflow-hidden`}
    >
      {/* Glow accent top */}
      <div className={`absolute top-0 left-0 right-0 h-px ${c.bg}`} style={{ background: `linear-gradient(90deg, transparent, ${color === 'neon' ? '#00d4ff' : color === 'safe' ? '#00ff88' : color === 'danger' ? '#ff4444' : '#ffb800'}, transparent)` }} />

      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
          {Icon && <Icon size={20} className={c.text} />}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-danger' : trend < 0 ? 'text-safe' : 'text-muted'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className={`text-2xl font-bold font-mono ${c.text}`}>{value}</div>
        <div className="text-xs text-muted mt-0.5 font-medium uppercase tracking-wider">{label}</div>
        {sub && <div className="text-xs text-light mt-1 opacity-70">{sub}</div>}
      </div>
    </motion.div>
  );
}
