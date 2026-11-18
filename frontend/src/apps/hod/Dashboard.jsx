import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Users, TrendingDown, Award, UserCheck,
  RefreshCw, ChevronRight, AlertTriangle, Activity,
  Archive, Send, BarChart3
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import { Badge, RiskBar } from '../../components/shared/Badge';
import { Toast, useToast } from '../../components/shared/Toast';
import Modal from '../../components/shared/Modal';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:5000';

export default function HODDashboard() {
  const { token } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('brief');
  const [brief, setBrief] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [students, setStudents] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({ student_id: '', counselor_id: '' });
  const [archiveModal, setArchiveModal] = useState(null);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/api/hod/weekly-brief`, { headers }).then(r => r.json()),
        fetch(`${API}/api/admin/users?role=Counselor`, { headers }).then(r => r.json()),
        fetch(`${API}/api/students`, { headers }).then(r => r.json()),
      ]);
      setBrief(r1);
      setCounselors(Array.isArray(r2) ? r2 : []);
      const sList = Array.isArray(r3) ? r3 : [];
      setStudents(sList);

      // Build archive from past weeks (simulated from data)
      setArchives([
        { week: `Week ${(r1?.masthead?.week?.replace('Week ','') || 21) - 1}`, date: 'Previous Week', health: Math.max(60, (r1?.health_score || 75) - 5), attention: (r1?.interventions_active || 0) + 2, critical: (r1?.critical_count || 0) + 1 },
        { week: `Week ${(r1?.masthead?.week?.replace('Week ','') || 21) - 2}`, date: '2 Weeks Ago',   health: Math.max(55, (r1?.health_score || 75) - 9), attention: (r1?.interventions_active || 0) + 4, critical: (r1?.critical_count || 0) + 2 },
      ]);
    } catch { addToast('Failed to load briefing', 'error'); }
    setLoading(false);
  };

  const assignCounselor = async () => {
    if (!assignData.student_id || !assignData.counselor_id) {
      addToast('Select both a student and counsellor', 'error'); return;
    }
    try {
      const r = await fetch(`${API}/api/hod/assign-counselor`, {
        method: 'POST', headers, body: JSON.stringify({ student_id: +assignData.student_id, counselor_id: +assignData.counselor_id })
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) { setAssignModal(false); setAssignData({ student_id: '', counselor_id: '' }); fetchAll(); }
    } catch { addToast('Assignment failed', 'error'); }
  };

  const navItems = [
    { id: 'brief',   label: 'Weekly Briefing',  icon: Newspaper },
    { id: 'assign',  label: 'Assign Counsellor', icon: UserCheck },
    { id: 'archive', label: 'Archive',           icon: Archive },
  ];

  if (loading) return (
    <div className="page-wrap items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border border-t-neon animate-spin mx-auto mb-4" />
        <p className="text-muted font-mono text-sm">LOADING DEPARTMENT BRIEF...</p>
      </div>
    </div>
  );

  const sparkline = brief?.sparkline || [12, 15, 18, 14, 16, 15, 13, 11];

  return (
    <div className="page-wrap">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Assign Counsellor Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Counsellor to Student">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student</label>
            <select value={assignData.student_id} onChange={e => setAssignData(d => ({ ...d, student_id: e.target.value }))} className="select-dark">
              <option value="">— Select Student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.dropout_risk_score}% risk)</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Counsellor</label>
            <select value={assignData.counselor_id} onChange={e => setAssignData(d => ({ ...d, counselor_id: e.target.value }))} className="select-dark">
              <option value="">— Select Counsellor —</option>
              {counselors.map(c => <option key={c.id} value={c.id}>{c.username} ({c.email})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={assignCounselor} className="btn-neon flex-1 flex items-center justify-center gap-2">
              <Send size={16} /> Assign Counsellor
            </button>
            <button onClick={() => setAssignModal(false)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Archive Detail Modal */}
      <Modal isOpen={!!archiveModal} onClose={() => setArchiveModal(null)} title={archiveModal ? `${archiveModal.week} — Department Report` : ''}>
        {archiveModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted">{archiveModal.date}</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Dept Health', `${archiveModal.health}%`, 'text-safe'],
                ['Attention Needed', archiveModal.attention, 'text-warn'],
                ['Critical Count', archiveModal.critical, 'text-danger'],
              ].map(([k, v, c]) => (
                <div key={k} className="p-4 rounded-lg text-center" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                  <div className={`text-2xl font-bold font-mono ${c}`}>{v}</div>
                  <div className="text-xs text-muted mt-1">{k}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted text-center py-2">Archived report data for this period.</p>
          </div>
        )}
      </Modal>

      <main className="main-content p-6">

        {/* ── WEEKLY BRIEF ────────────────────────────────────────────── */}
        {activeTab === 'brief' && brief && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">

            {/* Masthead */}
            <div className="glass-card p-6" style={{ borderTop: '2px solid #00d4ff' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-neon tracking-[4px] uppercase">Intelligence Report</span>
                    <span className="text-xs font-mono text-muted">·</span>
                    <span className="text-xs font-mono text-muted">{brief.masthead?.date}</span>
                  </div>
                  <h1 className="text-3xl font-black text-white font-display tracking-tight">
                    {brief.masthead?.department}
                  </h1>
                  <p className="text-sm text-muted mt-0.5">{brief.masthead?.week} Weekly Intelligence Briefing</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black font-mono" style={{ color: brief.health_score > 70 ? '#00ff88' : brief.health_score > 50 ? '#ffb800' : '#ff4444' }}>
                    {brief.health_score}
                  </div>
                  <div className="text-xs text-muted uppercase tracking-wider">Dept Health Score</div>
                </div>
              </div>

              {/* Headline */}
              <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}>
                <div className="flex items-center gap-2 text-warn font-bold text-base">
                  <AlertTriangle size={18} />
                  {brief.headline}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total Students"  value={brief.total_students}       icon={Users}         color="neon"   delay={0} />
              <StatCard label="Critical Risk"   value={brief.critical_count}       icon={AlertTriangle} color="danger" delay={0.05} />
              <StatCard label="Active Sessions" value={brief.active_sessions || 0} icon={Activity}      color="warn"   delay={0.1} />
              <StatCard label="Improved MTD"    value={brief.improved_this_month}  icon={TrendingDown}  color="safe"   delay={0.15} sub="vs last month" />
            </div>

            {/* Sparkline + Priority Students */}
            <div className="flex gap-5">
              {/* Risk trend sparkline */}
              <div className="glass-card p-5 flex-1">
                <h3 className="text-sm font-bold text-white mb-4">8-Week Risk Trend</h3>
                <Line
                  data={{
                    labels: Array.from({ length: 8 }, (_, i) => `W${(brief.masthead?.week?.replace('Week ','') || 21) - 7 + i}`),
                    datasets: [{
                      label: 'At-Risk Count',
                      data: sparkline,
                      borderColor: '#00d4ff',
                      backgroundColor: 'rgba(0,212,255,0.1)',
                      borderWidth: 2, tension: 0.4, fill: true,
                      pointBackgroundColor: '#00d4ff', pointRadius: 3
                    }]
                  }}
                  options={{
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080', font: { size: 10 } } },
                      y: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080', font: { size: 10 } } }
                    }
                  }}
                />
              </div>

              {/* Priority students */}
              <div className="glass-card p-5 w-96">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Priority Students</h3>
                  <button onClick={() => setAssignModal(true)} className="btn-neon text-xs flex items-center gap-1.5">
                    <UserCheck size={13} /> Assign
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {brief.priority_students?.map((s, i) => (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-lg"
                      style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{s.name}</span>
                        <span className="badge-critical">{s.risk_score}%</span>
                      </div>
                      <p className="text-xs text-muted">{s.reason}</p>
                      {s.assigned_counselor_id ? (
                        <p className="text-[10px] text-safe mt-1.5 font-mono">✓ Counsellor assigned</p>
                      ) : (
                        <button onClick={() => { setAssignData({ student_id: String(s.id), counselor_id: '' }); setAssignModal(true); }}
                          className="text-[10px] text-warn mt-1.5 hover:text-white transition-colors">
                          ⚡ Assign counsellor →
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dropout rate change banner */}
            <div className="glass-card p-4 flex items-center gap-4"
                 style={{ borderLeft: '3px solid #00ff88', background: 'rgba(0,255,136,0.03)' }}>
              <TrendingDown size={20} className="text-safe flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-white">Dropout rate trending down: <span className="text-safe">{brief.dropout_rate_change}</span> this month</p>
                <p className="text-xs text-muted">Counselling interventions are having measurable impact on student retention.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ASSIGN COUNSELLOR (standalone) ─────────────────────────── */}
        {activeTab === 'assign' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 max-w-xl">
            <h2 className="text-2xl font-bold text-white font-display">Assign Counsellors</h2>
            <div className="glass-card p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Select Student</label>
                <select value={assignData.student_id} onChange={e => setAssignData(d => ({ ...d, student_id: e.target.value }))} className="select-dark">
                  <option value="">— Select Student —</option>
                  {students.sort((a, b) => b.dropout_risk_score - a.dropout_risk_score).map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.dropout_risk_score}% risk</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Assign Counsellor</label>
                <select value={assignData.counselor_id} onChange={e => setAssignData(d => ({ ...d, counselor_id: e.target.value }))} className="select-dark">
                  <option value="">— Select Counsellor —</option>
                  {counselors.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                </select>
              </div>
              <button onClick={assignCounselor} className="btn-neon self-start flex items-center gap-2">
                <Send size={16} /> Assign Counsellor
              </button>
            </div>

            {/* Student assignment status table */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Current Assignments</h3>
              <table className="data-table">
                <thead><tr><th>Student</th><th>Risk</th><th>Counsellor</th></tr></thead>
                <tbody>
                  {students.filter(s => s.dropout_risk_score > 35).map(s => (
                    <tr key={s.id}>
                      <td className="text-white font-medium">{s.name}</td>
                      <td><Badge level={s.risk_level} /></td>
                      <td>
                        {s.assigned_counselor_id
                          ? <span className="text-safe text-xs">✓ Assigned</span>
                          : <span className="text-danger text-xs">⚡ Unassigned</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── ARCHIVE ─────────────────────────────────────────────────── */}
        {activeTab === 'archive' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Weekly Archive</h2>
            {/* Current week */}
            <div className="glass-card p-5 cursor-pointer hover:border-neon/30 transition-colors border border-border"
                 onClick={() => setArchiveModal({ week: brief?.masthead?.week, date: 'Current Week', health: brief?.health_score, attention: brief?.interventions_active, critical: brief?.critical_count })}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="badge-safe mb-2 inline-block">CURRENT</span>
                  <h3 className="text-base font-bold text-white">{brief?.masthead?.week} — {brief?.masthead?.date}</h3>
                  <p className="text-xs text-muted mt-0.5">Dept Health: {brief?.health_score}% · {brief?.critical_count} critical</p>
                </div>
                <ChevronRight size={20} className="text-muted" />
              </div>
            </div>
            {archives.map(a => (
              <div key={a.week} className="glass-card p-5 cursor-pointer hover:border-neon/30 transition-colors border border-border"
                   onClick={() => setArchiveModal(a)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{a.week} — {a.date}</h3>
                    <p className="text-xs text-muted mt-0.5">Dept Health: {a.health}% · {a.critical} critical</p>
                  </div>
                  <ChevronRight size={20} className="text-muted" />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
