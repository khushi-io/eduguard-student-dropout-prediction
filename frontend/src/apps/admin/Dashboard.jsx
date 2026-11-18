import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Radio, BarChart3, Users, Upload, Settings,
  AlertTriangle, TrendingUp, UserCheck, Activity, Download,
  RefreshCw, ChevronRight, Bell, Target, Zap, Brain
} from 'lucide-react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import { Badge, RiskBar } from '../../components/shared/Badge';
import { Toast, useToast } from '../../components/shared/Toast';
import Modal from '../../components/shared/Modal';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const API = 'http://localhost:5000';
const chartDefaults = {
  plugins: { legend: { labels: { color: '#a8c4e0', font: { family: 'Inter', size: 11 } } } },
  scales: {
    x: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080' } },
    y: { grid: { color: 'rgba(26,45,77,0.8)' }, ticks: { color: '#4a6080' } }
  }
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [radar, setRadar] = useState(null);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDot, setSelectedDot] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const fileRef = useRef();

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API}/api/admin/radar`, { headers }).then(r => r.json()),
        fetch(`${API}/api/admin/stats`, { headers }).then(r => r.json()),
        fetch(`${API}/api/students`, { headers }).then(r => r.json()),
        fetch(`${API}/api/admin/notifications`, { headers }).then(r => r.json()),
      ]);
      setRadar(r1); setStats(r2); setStudents(Array.isArray(r3) ? r3 : []);
      setNotifications(Array.isArray(r4) ? r4 : []);
    } catch (e) { addToast('Failed to load data', 'error'); }
    setLoading(false);
  };

  const navItems = [
    { id: 'overview',  label: 'Overview',        icon: LayoutDashboard },
    { id: 'radar',     label: 'MCA Risk Radar',   icon: Radio },
    { id: 'reports',   label: 'Analytics',        icon: BarChart3 },
    { id: 'students',  label: 'Student Registry', icon: Users },
    { id: 'csv',       label: 'CSV Import/Export',icon: Upload },
    { id: 'settings',  label: 'Settings',         icon: Settings,  badge: notifications.length },
  ];

  const handleDownloadTemplate = () => {
    window.open(`${API}/api/admin/template-csv?token=${token}`, '_blank');
    addToast('Template downloading...', 'success');
  };

  const handleExport = async () => {
    const resp = await fetch(`${API}/api/admin/export-csv`, { headers });
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'mca_students_export.csv'; a.click();
    addToast('Export complete!', 'success');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const resp = await fetch(`${API}/api/admin/import-csv`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd
      });
      const data = await resp.json();
      setImportResult(data);
      addToast(data.message, resp.ok ? 'success' : 'error');
      if (resp.ok) fetchAll();
    } catch { addToast('Import failed', 'error'); }
    setCsvUploading(false);
  };

  if (loading) return (
    <div className="page-wrap items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border border-t-neon animate-spin mx-auto mb-4" />
        <p className="text-muted font-mono text-sm">LOADING MCA DATA...</p>
      </div>
    </div>
  );

  const overview = stats?.overview || {};

  return (
    <div className="page-wrap">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="main-content p-6">

        {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Command Overview</h2>
                <p className="text-sm text-muted">MCA Department · Real-time student intelligence</p>
              </div>
              <button onClick={fetchAll} className="btn-ghost flex items-center gap-2 text-xs">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Students"    value={overview.total_students || 0}  icon={Users}         color="neon"   delay={0} />
              <StatCard label="Critical Risk"     value={overview.critical || 0}         icon={AlertTriangle} color="danger" delay={0.05} sub="Risk > 60%" />
              <StatCard label="Warning Zone"      value={overview.warning || 0}          icon={Zap}           color="warn"   delay={0.1} sub="Risk 35-60%" />
              <StatCard label="Attendance Risk"   value={overview.attendance_risk || 0}  icon={Activity}      color="warn"   delay={0.15} sub="< 75% attendance" />
              <StatCard label="Low Marks"         value={overview.low_marks || 0}        icon={Target}        color="danger" delay={0.2} sub="Internal < 15/30" />
              <StatCard label="Sentiment Alerts"  value={overview.sentiment_alerts || 0} icon={Brain}         color="purple" delay={0.25} sub="Negative mood logs" />
            </div>

            {/* Live Alert Feed */}
            {notifications.length > 0 && (
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bell size={16} className="text-danger animate-pulse" />
                  <h3 className="text-sm font-bold text-white">Live Alerts</h3>
                  <span className="badge-critical ml-auto">{notifications.length} unread</span>
                </div>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.15)' }}>
                      <AlertTriangle size={14} className="text-danger flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-light">{n.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Student Risk Table */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Student Risk Summary</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Roll No.</th><th>Risk Level</th><th>Attendance</th><th>Internal Marks</th><th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0,8).map(s => (
                    <tr key={s.id}>
                      <td className="text-white font-medium">{s.name}</td>
                      <td className="font-mono text-xs">{s.roll_number || '—'}</td>
                      <td><Badge level={s.risk_level} /></td>
                      <td className={s.attendance_pct < 75 ? 'text-danger' : 'text-safe'}>{s.attendance_pct}%</td>
                      <td className={s.internal_marks < 15 ? 'text-danger' : 'text-light'}>{s.internal_marks}/30</td>
                      <td><RiskBar score={s.dropout_risk_score} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── RADAR ─────────────────────────────────────────────────────── */}
        {activeTab === 'radar' && radar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white font-display">MCA Risk Radar</h2>
              <p className="text-sm text-muted">{radar.summary}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Critical" value={radar.critical_count} icon={AlertTriangle} color="danger" />
              <StatCard label="Warning"  value={radar.warning_count}  icon={Zap}           color="warn"   />
              <StatCard label="Safe"     value={radar.safe_count}     icon={UserCheck}     color="safe"   />
            </div>

            <div className="flex gap-5">
              {/* SVG Radar */}
              <div className="glass-card p-5 flex-1">
                <svg viewBox="0 0 500 500" className="w-full max-w-lg mx-auto">
                  {/* Background rings */}
                  {[50, 100, 150, 200].map(r => (
                    <circle key={r} cx={250} cy={250} r={r} fill="none" stroke="rgba(26,45,77,0.8)" strokeWidth="1" />
                  ))}
                  {/* Axis lines */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                    const rad = deg * Math.PI / 180;
                    return <line key={deg} x1={250} y1={250}
                      x2={250 + 200*Math.cos(rad)} y2={250 + 200*Math.sin(rad)}
                      stroke="rgba(26,45,77,0.5)" strokeWidth="1" />;
                  })}
                  {/* Ring labels */}
                  {[{r:70,t:'35%'},{r:130,t:'60%'},{r:195,t:'100%'}].map(l => (
                    <text key={l.r} x={250+l.r} y={247} fill="#4a6080" fontSize="8" fontFamily="Fira Code">{l.t}</text>
                  ))}
                  {/* Radar sweep */}
                  <line x1={250} y1={250} x2={250} y2={50} stroke="rgba(0,212,255,0.3)" strokeWidth="2"
                    className="animate-radar-sweep" style={{ transformOrigin: '250px 250px' }} />
                  <circle cx={250} cy={250} r={4} fill="#00d4ff" style={{ filter: 'drop-shadow(0 0 6px #00d4ff)' }} />

                  {/* Student dots */}
                  {radar.dots.map(dot => {
                    const color = dot.color === 'red' ? '#ff4444' : dot.color === 'amber' ? '#ffb800' : '#00ff88';
                    const glow = dot.color === 'red' ? 'rgba(255,68,68,0.8)' : dot.color === 'amber' ? 'rgba(255,184,0,0.8)' : 'rgba(0,255,136,0.8)';
                    return (
                      <g key={dot.id} onClick={() => setSelectedDot(dot)} style={{ cursor: 'pointer' }}>
                        {dot.color === 'red' && (
                          <circle cx={dot.x} cy={dot.y} r={12} fill={color} opacity={0.15}
                            className="animate-pulse-critical" />
                        )}
                        <circle cx={dot.x} cy={dot.y} r={dot.color === 'red' ? 7 : 5}
                          fill={color} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-3">
                  {[['#ff4444','Critical (>60%)'],['#ffb800','Warning (35-60%)'],['#00ff88','Safe (<35%)']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="w-3 h-3 rounded-full" style={{ background: c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>

              {/* Student detail panel */}
              <div className="w-72 glass-card p-5">
                {selectedDot ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{selectedDot.name}</h3>
                      <Badge level={selectedDot.risk_level} />
                    </div>
                    <p className="text-xs text-muted font-mono">{selectedDot.roll_number}</p>
                    <RiskBar score={selectedDot.risk_score} />
                    {[
                      ['Attendance', `${selectedDot.attendance_pct}%`],
                      ['Absences',   selectedDot.absences],
                      ['Int. Marks', `${selectedDot.internal_marks}/30`],
                    ].map(([k,v]) => (
                      <div key={k} className="flex justify-between text-xs border-b border-border pb-2">
                        <span className="text-muted">{k}</span>
                        <span className="text-white font-mono">{v}</span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                    <Radio size={32} className="text-border" />
                    <p className="text-sm text-muted">Click a student dot on the radar to view details</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── REPORTS ───────────────────────────────────────────────────── */}
        {activeTab === 'reports' && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-white font-display">Analytics & Reports</h2>

            <div className="grid grid-cols-2 gap-5">
              {/* Risk per student bar chart */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Dropout Risk per Student</h3>
                <Bar data={{
                  labels: stats.risk_per_student?.map(s => s.name.split(' ')[0]) || [],
                  datasets: [{
                    label: 'Risk Score',
                    data: stats.risk_per_student?.map(s => s.risk) || [],
                    backgroundColor: stats.risk_per_student?.map(s =>
                      s.risk > 60 ? 'rgba(255,68,68,0.6)' : s.risk > 35 ? 'rgba(255,184,0,0.6)' : 'rgba(0,255,136,0.6)'
                    ),
                    borderColor: stats.risk_per_student?.map(s =>
                      s.risk > 60 ? '#ff4444' : s.risk > 35 ? '#ffb800' : '#00ff88'
                    ),
                    borderWidth: 1, borderRadius: 4
                  }]
                }} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
              </div>

              {/* Attendance distribution doughnut */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Attendance Distribution</h3>
                <Doughnut data={{
                  labels: Object.keys(stats.attendance_distribution || {}),
                  datasets: [{
                    data: Object.values(stats.attendance_distribution || {}),
                    backgroundColor: ['rgba(255,68,68,0.7)','rgba(255,100,0,0.7)','rgba(255,184,0,0.7)','rgba(0,180,255,0.7)','rgba(0,255,136,0.7)'],
                    borderColor: 'transparent'
                  }]
                }} options={{ plugins: chartDefaults.plugins, cutout: '60%' }} />
              </div>

              {/* Dropout trend line */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Dropout Rate Trend (Year-on-Year)</h3>
                <Line data={{
                  labels: stats.dropout_trend?.labels || [],
                  datasets: [{
                    label: 'Dropout Rate %',
                    data: stats.dropout_trend?.rates || [],
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0,212,255,0.1)',
                    borderWidth: 2, tension: 0.4, fill: true,
                    pointBackgroundColor: '#00d4ff'
                  }]
                }} options={chartDefaults} />
              </div>

              {/* Marks distribution */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-white mb-4">Internal Marks Distribution</h3>
                <Bar data={{
                  labels: Object.keys(stats.marks_distribution || {}),
                  datasets: [{
                    label: 'Students',
                    data: Object.values(stats.marks_distribution || {}),
                    backgroundColor: 'rgba(0,212,255,0.5)',
                    borderColor: '#00d4ff', borderWidth: 1, borderRadius: 4
                  }]
                }} options={chartDefaults} />
              </div>
            </div>

            {/* AI Model Metrics */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Brain size={16} className="text-neon" /> AI Prediction Engine Metrics
              </h3>
              <div className="grid grid-cols-6 gap-3">
                {Object.entries(stats.model_metrics || {}).filter(([k]) => k !== 'best_model').map(([k, v]) => (
                  <div key={k} className="text-center p-3 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    <div className="text-lg font-bold font-mono text-neon">{v}%</div>
                    <div className="text-xs text-muted uppercase tracking-wider mt-1">{k.replace('_',' ')}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-3 font-mono">Model: {stats.model_metrics?.best_model}</p>
            </div>
          </motion.div>
        )}

        {/* ── STUDENTS ──────────────────────────────────────────────────── */}
        {activeTab === 'students' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Student Registry</h2>
            <div className="glass-card p-5">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Roll No.</th><th>Sem</th>
                    <th>Attendance</th><th>Int. Marks</th><th>Lab</th>
                    <th>Risk Level</th><th>Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td className="text-muted text-xs">{i+1}</td>
                      <td className="text-white font-medium">{s.name}</td>
                      <td className="font-mono text-xs text-muted">{s.roll_number || '—'}</td>
                      <td className="text-center">{s.semester}</td>
                      <td className={s.attendance_pct < 75 ? 'text-danger font-mono' : 'text-safe font-mono'}>{s.attendance_pct}%</td>
                      <td className={s.internal_marks < 15 ? 'text-danger font-mono' : 'text-light font-mono'}>{s.internal_marks}/30</td>
                      <td className="text-light font-mono">{s.lab_marks}/25</td>
                      <td><Badge level={s.risk_level} /></td>
                      <td className="w-32"><RiskBar score={s.dropout_risk_score} /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ── CSV ───────────────────────────────────────────────────────── */}
        {activeTab === 'csv' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 max-w-2xl">
            <h2 className="text-2xl font-bold text-white font-display">CSV Import / Export</h2>

            {/* Export */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-2">Export All Data</h3>
              <p className="text-sm text-muted mb-4">Download a full CSV of all MCA student profiles including risk scores, marks, and attendance.</p>
              <button onClick={handleExport} className="btn-neon flex items-center gap-2">
                <Download size={16} /> Export Students CSV
              </button>
            </div>

            {/* Template */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-2">Download CSV Template</h3>
              <p className="text-sm text-muted mb-4">Get the standard import template with all required column headers and a sample row.</p>
              <button onClick={handleDownloadTemplate} className="btn-ghost flex items-center gap-2">
                <Download size={16} /> Download Template
              </button>
            </div>

            {/* Import */}
            <div className="glass-card p-6">
              <h3 className="text-base font-bold text-white mb-2">Import Student Data</h3>
              <p className="text-sm text-muted mb-4">Upload a CSV file matching the template. Existing students will be updated; new emails will be created.</p>
              <input type="file" accept=".csv" ref={fileRef} onChange={handleImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={csvUploading}
                className="btn-neon flex items-center gap-2">
                {csvUploading ? <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
                {csvUploading ? 'Importing...' : 'Upload CSV File'}
              </button>

              {importResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-lg" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <p className="text-sm font-semibold text-safe">{importResult.message}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted">
                    <span>New: <strong className="text-white">{importResult.imported}</strong></span>
                    <span>Updated: <strong className="text-white">{importResult.updated}</strong></span>
                    <span>Skipped: <strong className="text-warn">{importResult.skipped}</strong></span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        {activeTab === 'settings' && <AdminSettings token={token} addToast={addToast} />}
      </main>
    </div>
  );
}

function AdminSettings({ token, addToast }) {
  const [high, setHigh] = useState(60);
  const [medium, setMedium] = useState(35);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/settings', { headers })
      .then(r => r.json()).then(d => { if (d.high) { setHigh(d.high); setMedium(d.medium); } });
  }, []);

  const save = async () => {
    const r = await fetch('http://localhost:5000/api/admin/settings', {
      method: 'POST', headers, body: JSON.stringify({ high, medium })
    });
    const d = await r.json();
    addToast(d.message, r.ok ? 'success' : 'error');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 max-w-lg">
      <h2 className="text-2xl font-bold text-white font-display">Platform Settings</h2>
      <div className="glass-card p-6 flex flex-col gap-5">
        <h3 className="text-sm font-bold text-white">Risk Score Thresholds</h3>
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Critical Threshold (%)</label>
          <input type="number" min={1} max={100} value={high}
            onChange={e => setHigh(+e.target.value)} className="input-dark" />
          <p className="text-xs text-muted mt-1">Students above this score are marked Critical (red).</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Warning Threshold (%)</label>
          <input type="number" min={1} max={100} value={medium}
            onChange={e => setMedium(+e.target.value)} className="input-dark" />
          <p className="text-xs text-muted mt-1">Students above this score are marked Warning (amber).</p>
        </div>
        <button onClick={save} className="btn-neon self-start">Save Settings</button>
      </div>
    </motion.div>
  );
}
