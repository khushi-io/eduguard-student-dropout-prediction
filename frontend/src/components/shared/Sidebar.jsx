import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Cpu } from 'lucide-react';
import { useAuth } from '../../AuthContext';

const roleColors = {
  Admin: 'text-neon',
  Faculty: 'text-blue-400',
  Counselor: 'text-emerald-400',
  HOD: 'text-purple-400',
  Student: 'text-safe',
};

const roleBadge = {
  Admin: 'SYSTEM ADMIN',
  Faculty: 'FACULTY',
  Counselor: 'COUNSELLOR',
  HOD: 'HOD',
  Student: 'STUDENT',
};

export default function Sidebar({ navItems, activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const roleColor = roleColors[user?.role] || 'text-neon';
  const badge = roleBadge[user?.role] || user?.role?.toUpperCase();

  return (
    <div className="sidebar-container">
      {/* Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
            <Cpu size={18} className="text-navy" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wider">MCA INTELLIGENCE</div>
            <div className="text-xs text-muted font-mono">EduGuard v2.0</div>
          </div>
        </div>

        {/* User chip */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-border text-xs font-bold text-neon">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.username}</div>
            <div className={`text-[10px] font-bold tracking-widest font-mono ${roleColor}`}>{badge}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto sidebar-nav">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange(item.id)}
            className={`nav-item w-full ${activeTab === item.id ? 'active' : ''}`}
          >
            <item.icon size={16} className="flex-shrink-0" />
            <span>{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <span className="ml-auto badge-critical text-[10px] px-1.5 py-0.5">{item.badge}</span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-[10px] text-muted font-mono mb-3">
          MCA DEPT · SYSTEM ONLINE
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-safe ml-2 animate-pulse"></span>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-danger hover:bg-danger/5 transition-all duration-200">
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
