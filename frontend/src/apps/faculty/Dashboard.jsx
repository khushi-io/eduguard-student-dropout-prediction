import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Calendar, BookOpen, MessageSquare,
  BarChart2, CheckSquare, AlertTriangle,
  RefreshCw, ChevronRight, Users, X, Plus, Send
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import { Badge, RiskBar } from '../../components/shared/Badge';
import { Toast, useToast } from '../../components/shared/Toast';
import Modal from '../../components/shared/Modal';

const API = 'http://localhost:5000';
const MCA_SUBJECTS = ['MCA-101 Data Structures', 'MCA-102 OOPs with Java', 'MCA-103 DBMS', 'MCA-104 Computer Networks'];
const EXAM_TYPES = [
  { value: 'internal',    label: 'Internal Exam', max: 30 },
  { value: 'lab',         label: 'Lab Practical',  max: 25 },
  { value: 'assignment',  label: 'Assignment',     max: 25 },
  { value: 'test',        label: 'Unit Test',      max: 20 },
];

export default function FacultyDashboard() {
  const { token } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('attendance');
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [marksRecords, setMarksRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendance state
  const [className, setClassName] = useState('MCA-101 Data Structures');
  const [markedDate, setMarkedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Marks state
  const [marksForm, setMarksForm] = useState({ student_id: '', subject: MCA_SUBJECTS[0], exam_type: 'internal', marks_obtained: '', max_marks: 30 });

  // Remarks state
  const [remarkForm, setRemarkForm] = useState({ student_id: '', remark_type: 'behavior', content: '', is_flagged: false });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch(`${API}/api/students`, { headers }).then(r => r.json()),
        fetch(`${API}/api/faculty/history`, { headers }).then(r => r.json()),
        fetch(`${API}/api/faculty/remarks`, { headers }).then(r => r.json()),
        fetch(`${API}/api/faculty/marks`, { headers }).then(r => r.json()),
      ]);
      const sList = Array.isArray(r1) ? r1 : [];
      setStudents(sList);
      setHistory(Array.isArray(r2) ? r2 : []);
      setRemarks(Array.isArray(r3) ? r3 : []);
      setMarksRecords(Array.isArray(r4) ? r4 : []);

      // Initialize attendance map
      const init = {};
      sList.forEach(s => { init[s.id] = 'Present'; });
      setAttendance(init);
    } catch { addToast('Failed to load data', 'error'); }
    setLoading(false);
  };

  const navItems = [
    { id: 'attendance', label: 'Attendance',       icon: Calendar },
    { id: 'marks',      label: 'Marks Entry',      icon: BarChart2 },
    { id: 'remarks',    label: 'Student Remarks',  icon: MessageSquare },
    { id: 'history',    label: 'Class History',    icon: ClipboardList },
  ];

  // ── ATTENDANCE SUBMIT ────────────────────────────────────────────────
  const submitAttendance = async () => {
    setSubmitting(true);
    const records = Object.entries(attendance).map(([id, status]) => ({ student_id: parseInt(id), status }));
    try {
      const r = await fetch(`${API}/api/faculty/attendance`, {
        method: 'POST', headers,
        body: JSON.stringify({ class_name: className, marked_date: markedDate, records })
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) fetchAll();
    } catch { addToast('Submission failed', 'error'); }
    setSubmitting(false);
  };

  const toggleAttendance = (id) => {
    setAttendance(prev => ({ ...prev, [id]: prev[id] === 'Present' ? 'Absent' : 'Present' }));
  };

  // ── MARKS SUBMIT ────────────────────────────────────────────────────
  const submitMarks = async () => {
    if (!marksForm.student_id || !marksForm.marks_obtained) {
      addToast('Fill in all fields', 'error'); return;
    }
    try {
      const r = await fetch(`${API}/api/faculty/marks`, {
        method: 'POST', headers,
        body: JSON.stringify({ records: [{ ...marksForm, marks_obtained: +marksForm.marks_obtained }] })
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) { setMarksForm({ student_id: '', subject: MCA_SUBJECTS[0], exam_type: 'internal', marks_obtained: '', max_marks: 30 }); fetchAll(); }
    } catch { addToast('Failed to save marks', 'error'); }
  };

  // ── REMARK SUBMIT ───────────────────────────────────────────────────
  const submitRemark = async () => {
    if (!remarkForm.student_id || !remarkForm.content) {
      addToast('Fill in all fields', 'error'); return;
    }
    try {
      const r = await fetch(`${API}/api/faculty/remark`, {
        method: 'POST', headers,
        body: JSON.stringify(remarkForm)
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) { setRemarkForm({ student_id: '', remark_type: 'behavior', content: '', is_flagged: false }); fetchAll(); }
    } catch { addToast('Failed to save remark', 'error'); }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount = students.length - presentCount;

  if (loading) return (
    <div className="page-wrap items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border border-t-neon animate-spin mx-auto mb-4" />
        <p className="text-muted font-mono text-sm">LOADING CLASS DATA...</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrap">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="main-content p-6">

        {/* ── ATTENDANCE ──────────────────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Mark Attendance</h2>
                <p className="text-sm text-muted">MCA Department · {students.length} students enrolled</p>
              </div>
              <div className="flex gap-3">
                <StatCard label="Present" value={presentCount} color="safe"   icon={CheckSquare} />
                <StatCard label="Absent"  value={absentCount}  color="danger" icon={AlertTriangle} />
              </div>
            </div>

            {/* Session Config */}
            <div className="glass-card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white">Session Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Subject / Class</label>
                  <select value={className} onChange={e => setClassName(e.target.value)} className="select-dark">
                    {MCA_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Date</label>
                  <input type="date" value={markedDate} onChange={e => setMarkedDate(e.target.value)} className="input-dark" />
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Student Roll</h3>
                <div className="flex gap-2">
                  <button onClick={() => { const all = {}; students.forEach(s => { all[s.id] = 'Present'; }); setAttendance(all); }}
                    className="text-xs text-safe border border-safe/30 px-3 py-1 rounded hover:bg-safe/10 transition-colors">All Present</button>
                  <button onClick={() => { const all = {}; students.forEach(s => { all[s.id] = 'Absent'; }); setAttendance(all); }}
                    className="text-xs text-danger border border-danger/30 px-3 py-1 rounded hover:bg-danger/10 transition-colors">All Absent</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {students.map((s, i) => {
                  const isPresent = attendance[s.id] === 'Present';
                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => toggleAttendance(s.id)}
                      className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200"
                      style={{
                        background: isPresent ? 'rgba(0,255,136,0.05)' : 'rgba(255,68,68,0.05)',
                        border: `1px solid ${isPresent ? 'rgba(0,255,136,0.2)' : 'rgba(255,68,68,0.2)'}`
                      }}
                    >
                      {/* Toggle */}
                      <div className={`w-11 h-6 rounded-full flex items-center px-1 transition-all duration-300 ${isPresent ? 'bg-safe/30' : 'bg-danger/30'}`}>
                        <motion.div animate={{ x: isPresent ? 20 : 0 }}
                          className={`w-4 h-4 rounded-full ${isPresent ? 'bg-safe' : 'bg-danger'}`}
                          style={{ boxShadow: isPresent ? '0 0 8px rgba(0,255,136,0.5)' : '0 0 8px rgba(255,68,68,0.5)' }}
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{s.name}</span>
                          <span className="text-xs font-mono text-muted">{s.roll_number}</span>
                          {s.dropout_risk_score > 60 && <span className="badge-critical text-[10px]">High Risk</span>}
                        </div>
                        <p className="text-xs text-muted mt-0.5">Attendance: {s.attendance_pct}% · {s.absences} absences</p>
                      </div>

                      <span className={`text-xs font-bold ${isPresent ? 'text-safe' : 'text-danger'}`}>
                        {isPresent ? 'PRESENT' : 'ABSENT'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={submitAttendance} disabled={submitting}
                className="btn-neon mt-5 w-full flex items-center justify-center gap-2 h-11"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── MARKS ENTRY ─────────────────────────────────────────────── */}
        {activeTab === 'marks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Marks Entry</h2>

            {/* Form */}
            <div className="glass-card p-6 flex flex-col gap-4 max-w-xl">
              <h3 className="text-sm font-bold text-white">Enter Marks</h3>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student</label>
                <select value={marksForm.student_id} onChange={e => setMarksForm(f => ({ ...f, student_id: e.target.value }))} className="select-dark">
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Subject</label>
                <select value={marksForm.subject} onChange={e => setMarksForm(f => ({ ...f, subject: e.target.value }))} className="select-dark">
                  {MCA_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Exam Type</label>
                <select value={marksForm.exam_type} onChange={e => {
                  const et = EXAM_TYPES.find(t => t.value === e.target.value);
                  setMarksForm(f => ({ ...f, exam_type: e.target.value, max_marks: et?.max || 30 }));
                }} className="select-dark">
                  {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} (/{t.max})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Marks Obtained</label>
                  <input type="number" min={0} max={marksForm.max_marks} placeholder="e.g. 24"
                    value={marksForm.marks_obtained}
                    onChange={e => setMarksForm(f => ({ ...f, marks_obtained: e.target.value }))}
                    className="input-dark" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Max Marks</label>
                  <input type="number" value={marksForm.max_marks} readOnly className="input-dark opacity-60" />
                </div>
              </div>

              <button onClick={submitMarks} className="btn-neon flex items-center gap-2 self-start">
                <Plus size={16} /> Save Marks
              </button>
            </div>

            {/* Recent marks records */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Recent Marks Records</h3>
              {marksRecords.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No marks records yet.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Subject</th><th>Type</th><th>Marks</th><th>%</th></tr></thead>
                  <tbody>
                    {marksRecords.slice(0, 20).map(r => {
                      const student = students.find(s => s.id === r.student_id);
                      return (
                        <tr key={r.id}>
                          <td className="text-white font-medium">{student?.name || `ID:${r.student_id}`}</td>
                          <td className="text-xs font-mono text-muted">{r.subject}</td>
                          <td><span className="badge-safe text-[10px]">{r.exam_type}</span></td>
                          <td className="font-mono">{r.marks_obtained}/{r.max_marks}</td>
                          <td className={r.percentage < 50 ? 'text-danger font-mono' : r.percentage < 70 ? 'text-warn font-mono' : 'text-safe font-mono'}>
                            {r.percentage}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── REMARKS ─────────────────────────────────────────────────── */}
        {activeTab === 'remarks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Student Remarks</h2>

            {/* Form */}
            <div className="glass-card p-6 flex flex-col gap-4 max-w-xl">
              <h3 className="text-sm font-bold text-white">Log a Remark</h3>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student</label>
                <select value={remarkForm.student_id} onChange={e => setRemarkForm(f => ({ ...f, student_id: e.target.value }))} className="select-dark">
                  <option value="">— Select Student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Remark Type</label>
                <select value={remarkForm.remark_type} onChange={e => setRemarkForm(f => ({ ...f, remark_type: e.target.value, is_flagged: ['concern','intervention'].includes(e.target.value) }))} className="select-dark">
                  <option value="improvement">⬆ Improvement</option>
                  <option value="behavior">📋 Behavior Note</option>
                  <option value="concern">⚠ Concern (Flags counsellor)</option>
                  <option value="intervention">🚨 Intervention Needed</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Remark Content</label>
                <textarea rows={3} value={remarkForm.content}
                  onChange={e => setRemarkForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Describe your observation about this student..."
                  className="input-dark resize-none" />
              </div>

              {['concern', 'intervention'].includes(remarkForm.remark_type) && (
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}>
                  <AlertTriangle size={14} className="text-warn flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warn">This remark will be flagged and automatically visible in the Counsellor's feed.</p>
                </div>
              )}

              <button onClick={submitRemark} className="btn-neon flex items-center gap-2 self-start">
                <Send size={16} /> Submit Remark
              </button>
            </div>

            {/* Remarks list */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">All Remarks ({remarks.length})</h3>
              {remarks.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No remarks logged yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {remarks.map(r => {
                    const colors = {
                      improvement: { bg: 'rgba(0,255,136,0.05)', border: 'rgba(0,255,136,0.2)', text: '#00ff88' },
                      behavior:    { bg: 'rgba(0,212,255,0.05)', border: 'rgba(0,212,255,0.2)', text: '#00d4ff' },
                      concern:     { bg: 'rgba(255,184,0,0.05)', border: 'rgba(255,184,0,0.2)', text: '#ffb800' },
                      intervention:{ bg: 'rgba(255,68,68,0.05)', border: 'rgba(255,68,68,0.2)', text: '#ff4444' },
                    };
                    const c = colors[r.remark_type] || colors.behavior;
                    return (
                      <div key={r.id} className="p-4 rounded-lg" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-white">{r.student_name}</span>
                          <div className="flex items-center gap-2">
                            {r.is_flagged && <span className="badge-critical text-[10px]">FLAGGED</span>}
                            <span className="text-[10px] font-mono" style={{ color: c.text }}>{r.remark_type.toUpperCase()}</span>
                          </div>
                        </div>
                        <p className="text-xs text-light">{r.content}</p>
                        <p className="text-[10px] text-muted mt-1.5 font-mono">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── HISTORY ─────────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Class History</h2>
            {history.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center justify-center gap-3">
                <Calendar size={40} className="text-border" />
                <p className="text-muted text-sm">No attendance history yet. Start marking attendance above.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((session, i) => (
                  <motion.div key={session.date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold text-white">{new Date(session.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-xs text-muted">{session.total_students} students · {session.present_count} present · {session.absent_count} absent</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="badge-safe">{session.present_count} Present</span>
                        {session.absent_count > 0 && <span className="badge-critical">{session.absent_count} Absent</span>}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full rounded-full bg-safe transition-all"
                        style={{ width: `${session.total_students > 0 ? (session.present_count / session.total_students * 100) : 0}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {session.records?.filter(r => r.status === 'Absent').map(r => (
                        <span key={r.student_id} className="badge-critical text-[10px]">{r.name}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}


      </main>
    </div>
  );
}
