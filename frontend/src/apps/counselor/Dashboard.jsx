import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, Plus, Bell, BarChart2,
  Search, ChevronRight, Clock, CheckCircle,
  AlertTriangle, Calendar, MessageCircle, RefreshCw, Heart, Send
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/shared/Sidebar';
import StatCard from '../../components/shared/StatCard';
import { Badge, RiskBar, StatusDot } from '../../components/shared/Badge';
import { Toast, useToast } from '../../components/shared/Toast';
import Modal from '../../components/shared/Modal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API = 'http://localhost:5000';
const SESSION_STATUSES = ['Active', 'Resolved', 'Follow-up'];

export default function CounselorDashboard() {
  const { token } = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const [activeTab, setActiveTab] = useState('huddle');
  const [huddle, setHuddle] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [outcomes, setOutcomes] = useState(null);
  const [facultyRemarks, setFacultyRemarks] = useState([]);
  const [vitalFile, setVitalFile] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [vitalLoading, setVitalLoading] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    student_id: '', diagnosis: '', action_taken: '',
    student_response: '', follow_up_date: '', session_status: 'Active', notes: ''
  });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        fetch(`${API}/api/counselor/today`, { headers }).then(r => r.json()),
        fetch(`${API}/api/students`, { headers }).then(r => r.json()),
        fetch(`${API}/api/counselor/sessions`, { headers }).then(r => r.json()),
        fetch(`${API}/api/counselor/outcomes`, { headers }).then(r => r.json()),
        fetch(`${API}/api/faculty/remarks?flagged=true`, { headers }).then(r => r.json()),
      ]);
      setHuddle(Array.isArray(r1) ? r1 : []);
      setStudents(Array.isArray(r2) ? r2 : []);
      setSessions(Array.isArray(r3) ? r3 : []);
      setOutcomes(r4);
      setFacultyRemarks(Array.isArray(r5) ? r5 : []);
    } catch { addToast('Failed to load data', 'error'); }
    setLoading(false);
  };

  const navItems = [
    { id: 'huddle',   label: "Today's Huddle",     icon: Users,         badge: huddle.length },
    { id: 'vital',    label: 'Student Vital Files', icon: FileText },
    { id: 'session',  label: 'Log Session',         icon: Plus },
    { id: 'chat',     label: 'Counsellor Chat',     icon: MessageCircle },
    { id: 'outcomes', label: 'Outcomes Tracker',    icon: BarChart2 },
  ];

  const fetchVitalFile = async (studentId) => {
    setVitalLoading(true);
    try {
      const r = await fetch(`${API}/api/counselor/vital-file/${studentId}`, { headers });
      const d = await r.json();
      setVitalFile(d);
    } catch { addToast('Failed to load vital file', 'error'); }
    setVitalLoading(false);
  };

  const submitSession = async () => {
    if (!sessionForm.student_id || !sessionForm.action_taken) {
      addToast('Student and action taken are required', 'error'); return;
    }
    try {
      const r = await fetch(`${API}/api/counselor/session`, {
        method: 'POST', headers, body: JSON.stringify(sessionForm)
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) {
        setSessionModal(false);
        setSessionForm({ student_id: '', diagnosis: '', action_taken: '', student_response: '', follow_up_date: '', session_status: 'Active', notes: '' });
        fetchAll();
      }
    } catch { addToast('Failed to log session', 'error'); }
  };

  const updateSession = async (id, status) => {
    try {
      const r = await fetch(`${API}/api/counselor/session/${id}`, {
        method: 'PUT', headers, body: JSON.stringify({ session_status: status })
      });
      const d = await r.json();
      addToast(d.message, r.ok ? 'success' : 'error');
      if (r.ok) fetchAll();
    } catch { addToast('Update failed', 'error'); }
  };

  const sendChatMessage = async () => {
    if (!selectedStudent || !chatMessage.trim()) return;
    try {
      const r = await fetch(`${API}/api/counselor/note`, {
        method: 'POST', headers, body: JSON.stringify({ student_id: selectedStudent.id, note: chatMessage })
      });
      const d = await r.json();
      if (r.ok) {
        setChatMessage('');
        fetchVitalFile(selectedStudent.id);
      } else {
        addToast(d.message || 'Failed to send message', 'error');
      }
    } catch { addToast('Failed to send message', 'error'); }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="page-wrap items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border-2 border-border border-t-neon animate-spin mx-auto mb-4" />
        <p className="text-muted font-mono text-sm">LOADING COUNSELLOR DATA...</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrap">
      <Sidebar navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Session Log Modal */}
      <Modal isOpen={sessionModal} onClose={() => setSessionModal(false)} title="Log Counselling Session" size="lg">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student</label>
            <select value={sessionForm.student_id} onChange={e => setSessionForm(f => ({ ...f, student_id: e.target.value }))} className="select-dark">
              <option value="">— Select Student —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.roll_number}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Diagnosis / Assessment</label>
            <textarea rows={2} value={sessionForm.diagnosis} onChange={e => setSessionForm(f => ({ ...f, diagnosis: e.target.value }))}
              placeholder="What is the core issue observed?" className="input-dark resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Action Taken *</label>
            <textarea rows={2} value={sessionForm.action_taken} onChange={e => setSessionForm(f => ({ ...f, action_taken: e.target.value }))}
              placeholder="What was done in this session?" className="input-dark resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student Response</label>
            <textarea rows={2} value={sessionForm.student_response} onChange={e => setSessionForm(f => ({ ...f, student_response: e.target.value }))}
              placeholder="How did the student respond?" className="input-dark resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Status</label>
              <select value={sessionForm.session_status} onChange={e => setSessionForm(f => ({ ...f, session_status: e.target.value }))} className="select-dark">
                {SESSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Follow-up Date</label>
              <input type="date" value={sessionForm.follow_up_date} onChange={e => setSessionForm(f => ({ ...f, follow_up_date: e.target.value }))} className="input-dark" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Additional Notes</label>
            <textarea rows={2} value={sessionForm.notes} onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any other observations..." className="input-dark resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={submitSession} className="btn-neon flex-1">Log Session</button>
            <button onClick={() => setSessionModal(false)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </div>
      </Modal>

      <main className="main-content p-6">

        {/* ── TODAY'S HUDDLE ──────────────────────────────────────────── */}
        {activeTab === 'huddle' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-display">Today's Priority Huddle</h2>
                <p className="text-sm text-muted">Students requiring immediate attention today</p>
              </div>
              <div className="flex gap-3">
                <button onClick={fetchAll} className="btn-ghost flex items-center gap-2 text-xs"><RefreshCw size={13} /> Refresh</button>
                <button onClick={() => setSessionModal(true)} className="btn-neon flex items-center gap-2 text-sm">
                  <Plus size={16} /> Log Session
                </button>
              </div>
            </div>

            {huddle.length === 0 ? (
              <div className="glass-card p-12 flex flex-col items-center gap-3">
                <CheckCircle size={40} className="text-safe" />
                <p className="text-base font-bold text-white">All clear for today!</p>
                <p className="text-sm text-muted text-center">No high-risk students pending attention. All priority students have been addressed.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {huddle.map((item, i) => {
                  const s = item.student;
                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-card p-5"
                      style={{ borderLeft: '3px solid #ff4444' }}
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
                          <AlertTriangle size={22} className="text-danger" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-base font-bold text-white">{s.name}</h3>
                            <span className="text-xs font-mono text-muted">{s.roll_number}</span>
                            <Badge level={s.risk_level} />
                            <span className="text-xs text-muted">Sem {s.semester}</span>
                          </div>
                          <p className="text-sm text-light mb-3">{item.summary}</p>
                          <RiskBar score={s.dropout_risk_score} />

                          {item.latest_faculty_remark && (
                            <div className="mt-3 p-3 rounded-lg" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)' }}>
                              <p className="text-xs text-warn font-semibold mb-0.5">Latest Faculty Remark</p>
                              <p className="text-xs text-light">{item.latest_faculty_remark.content}</p>
                            </div>
                          )}

                          <div className="flex gap-3 mt-4">
                            <button
                              onClick={() => { setSelectedStudent(s); fetchVitalFile(s.id); setActiveTab('vital'); }}
                              className="text-xs btn-ghost flex items-center gap-1.5">
                              <FileText size={13} /> View Vital File ({item.session_count} sessions)
                            </button>
                            <button onClick={() => { setSessionForm(f => ({ ...f, student_id: String(s.id) })); setSessionModal(true); }}
                              className="text-xs btn-neon flex items-center gap-1.5">
                              <Plus size={13} /> Log Session
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-right flex-shrink-0">
                          <div><span className="text-muted">Attendance:</span> <span className={s.attendance_pct < 75 ? 'text-danger font-mono' : 'text-safe font-mono'}>{s.attendance_pct}%</span></div>
                          <div><span className="text-muted">Int. Marks:</span> <span className="text-light font-mono">{s.internal_marks}/30</span></div>
                          <div><span className="text-muted">Mood:</span> <span className={s.sentiment_score < 0 ? 'text-danger font-mono' : 'text-safe font-mono'}>{s.sentiment_score > 0 ? '+' : ''}{s.sentiment_score}</span></div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── VITAL FILE ──────────────────────────────────────────────── */}
        {activeTab === 'vital' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Student Vital Files</h2>

            {/* Search */}
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-dark pl-10"
              />
            </div>

            <div className="flex gap-5">
              {/* Student list */}
              <div className="w-72 flex-shrink-0 glass-card p-4 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '75vh' }}>
                {filteredStudents.map(s => (
                  <motion.button key={s.id} whileHover={{ x: 3 }}
                    onClick={() => { setSelectedStudent(s); fetchVitalFile(s.id); }}
                    className={`flex items-center gap-3 p-3 rounded-lg text-left w-full transition-all ${selectedStudent?.id === s.id ? 'bg-neon/10 border border-neon/30' : 'hover:bg-border'}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                         style={{ background: s.dropout_risk_score > 60 ? 'rgba(255,68,68,0.15)' : s.dropout_risk_score > 35 ? 'rgba(255,184,0,0.15)' : 'rgba(0,255,136,0.1)',
                                  color: s.dropout_risk_score > 60 ? '#ff4444' : s.dropout_risk_score > 35 ? '#ffb800' : '#00ff88' }}>
                      {s.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                      <p className="text-[10px] text-muted font-mono">{s.roll_number} · {s.dropout_risk_score}% risk</p>
                    </div>
                    <Badge level={s.risk_level} />
                  </motion.button>
                ))}
              </div>

              {/* Vital file content */}
              <div className="flex-1 flex flex-col gap-4">
                {vitalLoading ? (
                  <div className="glass-card p-12 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-border border-t-neon rounded-full animate-spin" />
                  </div>
                ) : vitalFile ? (
                  <AnimatePresence mode="wait">
                    <motion.div key={vitalFile.student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white">{vitalFile.student.name}</h3>
                            <p className="text-xs text-muted font-mono">{vitalFile.student.roll_number} · Semester {vitalFile.student.semester}</p>
                          </div>
                          <div className="flex gap-3 items-center">
                            <Badge level={vitalFile.student.risk_level} />
                            <button onClick={() => { setSessionForm(f => ({ ...f, student_id: String(vitalFile.student.id) })); setSessionModal(true); }}
                              className="btn-neon text-xs flex items-center gap-1.5">
                              <Plus size={13} /> Log Session
                            </button>
                          </div>
                        </div>
                        <RiskBar score={vitalFile.student.dropout_risk_score} />
                        <div className="grid grid-cols-4 gap-3 mt-4">
                          {[
                            ['Attendance', `${vitalFile.student.attendance_pct}%`, vitalFile.student.attendance_pct < 75 ? 'danger' : 'safe'],
                            ['Int. Marks',  `${vitalFile.student.internal_marks}/30`, vitalFile.student.internal_marks < 15 ? 'danger' : 'safe'],
                            ['Sessions',   vitalFile.session_count, 'neon'],
                            ['Sentiment',  vitalFile.student.sentiment_score, vitalFile.student.sentiment_score < 0 ? 'danger' : 'safe'],
                          ].map(([k, v, c]) => (
                            <div key={k} className="text-center p-2.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                              <div className={`text-lg font-bold font-mono ${c === 'danger' ? 'text-danger' : c === 'safe' ? 'text-safe' : 'text-neon'}`}>{v}</div>
                              <div className="text-[10px] text-muted uppercase tracking-wider">{k}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Counselling Sessions */}
                      <div className="glass-card p-5">
                        <h4 className="text-sm font-bold text-white mb-3">Counselling History ({vitalFile.counselling_sessions.length})</h4>
                        {vitalFile.counselling_sessions.length === 0 ? (
                          <p className="text-xs text-muted">No sessions recorded yet.</p>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {vitalFile.counselling_sessions.map(session => (
                              <div key={session.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <StatusDot status={session.session_status} />
                                    <span className="text-xs font-semibold text-white">{new Date(session.session_date).toLocaleDateString()}</span>
                                    <span className="text-[10px] text-muted">{session.session_status}</span>
                                  </div>
                                  <select value={session.session_status}
                                    onChange={e => updateSession(session.id, e.target.value)}
                                    className="text-[10px] bg-transparent border border-border rounded px-1.5 py-0.5 text-muted cursor-pointer">
                                    {SESSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                                {session.diagnosis && <p className="text-xs text-muted mb-1"><span className="text-neon font-semibold">Diagnosis:</span> {session.diagnosis}</p>}
                                <p className="text-xs text-light mb-1"><span className="text-neon font-semibold">Action:</span> {session.action_taken}</p>
                                {session.student_response && <p className="text-xs text-muted"><span className="text-warn font-semibold">Response:</span> {session.student_response}</p>}
                                {session.follow_up_date && (
                                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-warn">
                                    <Calendar size={10} />
                                    <span>Follow-up: {session.follow_up_date}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Faculty Remarks for this student */}
                      {vitalFile.faculty_remarks.length > 0 && (
                        <div className="glass-card p-5">
                          <h4 className="text-sm font-bold text-white mb-3">Faculty Remarks</h4>
                          <div className="flex flex-col gap-2">
                            {vitalFile.faculty_remarks.map(r => (
                              <div key={r.id} className="p-3 rounded-lg text-xs" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)' }}>
                                <div className="flex items-center gap-2 mb-1">
                                  {r.is_flagged && <AlertTriangle size={11} className="text-danger" />}
                                  <span className="font-semibold text-warn">{r.remark_type.toUpperCase()}</span>
                                  <span className="text-muted font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-light">{r.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="glass-card p-12 flex flex-col items-center gap-3">
                    <FileText size={40} className="text-border" />
                    <p className="text-sm text-muted">Select a student to view their vital file</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── LOG SESSION (standalone) ─────────────────────────────────── */}
        {activeTab === 'session' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 max-w-2xl">
            <h2 className="text-2xl font-bold text-white font-display">Log Counselling Session</h2>
            <div className="glass-card p-6 flex flex-col gap-4">
              {Object.keys(sessionForm).map(key => {
                if (key === 'student_id') return (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Student *</label>
                    <select value={sessionForm[key]} onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))} className="select-dark">
                      <option value="">— Select Student —</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.roll_number}</option>)}
                    </select>
                  </div>
                );
                if (key === 'session_status') return (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Status</label>
                    <select value={sessionForm[key]} onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))} className="select-dark">
                      {SESSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                );
                if (key === 'follow_up_date') return (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Follow-up Date</label>
                    <input type="date" value={sessionForm[key]} onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))} className="input-dark" />
                  </div>
                );
                const labels = { diagnosis: 'Diagnosis / Assessment', action_taken: 'Action Taken *', student_response: 'Student Response', notes: 'Additional Notes' };
                if (!labels[key]) return null;
                return (
                  <div key={key}>
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">{labels[key]}</label>
                    <textarea rows={2} value={sessionForm[key]} onChange={e => setSessionForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={`Enter ${labels[key].toLowerCase()}...`} className="input-dark resize-none" />
                  </div>
                );
              })}
              <button onClick={submitSession} className="btn-neon self-start flex items-center gap-2">
                <CheckCircle size={16} /> Submit Session Log
              </button>
            </div>

            {/* Recent sessions */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Recent Sessions</h3>
              <div className="flex flex-col gap-3">
                {sessions.slice(0, 5).map(session => {
                  const student = students.find(s => s.id === session.student_id);
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      <StatusDot status={session.session_status} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{student?.name || `Student #${session.student_id}`}</p>
                        <p className="text-[10px] text-muted">{session.action_taken?.substring(0, 60)}...</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted">{new Date(session.session_date).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COUNSELLOR CHAT ─────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5 h-full">
            <div>
              <h2 className="text-2xl font-bold text-white font-display">Counsellor Chat Hub</h2>
              <p className="text-sm text-muted">Direct confidential messaging channel with MCA students</p>
            </div>

            <div className="flex gap-5 flex-1 min-h-0">
              {/* Left Pane: Student List */}
              <div className="w-72 flex-shrink-0 glass-card p-4 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '75vh' }}>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    placeholder="Search student to chat..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-dark pl-9 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  {filteredStudents.map(s => (
                    <motion.button key={s.id} whileHover={{ x: 2 }}
                      onClick={() => { setSelectedStudent(s); fetchVitalFile(s.id); }}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-left w-full transition-all ${selectedStudent?.id === s.id ? 'bg-neon/10 border border-neon/30' : 'hover:bg-border'}`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs"
                           style={{ background: s.dropout_risk_score > 60 ? 'rgba(255,68,68,0.15)' : s.dropout_risk_score > 35 ? 'rgba(255,184,0,0.15)' : 'rgba(0,255,136,0.1)',
                                    color: s.dropout_risk_score > 60 ? '#ff4444' : s.dropout_risk_score > 35 ? '#ffb800' : '#00ff88' }}>
                        {s.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                        <p className="text-[10px] text-muted font-mono">{s.roll_number}</p>
                      </div>
                      <Badge level={s.risk_level} />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Right Pane: Chat History & Input */}
              <div className="flex-1 flex flex-col glass-card p-5 relative overflow-hidden" style={{ height: '75vh' }}>
                {vitalLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-border border-t-neon rounded-full animate-spin" />
                  </div>
                ) : selectedStudent && vitalFile ? (
                  <div className="flex flex-col h-full justify-between">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center text-neon font-bold text-sm">
                          {selectedStudent.name[0]}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white leading-tight">{selectedStudent.name}</h3>
                          <p className="text-[10px] text-muted font-mono">{selectedStudent.roll_number} · Semester {selectedStudent.semester}</p>
                        </div>
                      </div>
                      <Badge level={selectedStudent.risk_level} />
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 mb-4">
                      {vitalFile.legacy_notes && vitalFile.legacy_notes.length > 0 ? (
                        [...vitalFile.legacy_notes].reverse().map((msg, i) => {
                          const isStudent = msg.note.startsWith("Student Message: ");
                          const content = isStudent ? msg.note.replace("Student Message: ", "") : msg.note;
                          return (
                            <motion.div key={msg.id || i}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                              className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}>
                              <div className={`max-w-md p-3 rounded-xl text-xs ${isStudent
                                ? 'bg-border text-light rounded-bl-none border border-border'
                                : 'bg-neon/10 border border-neon/25 text-white rounded-br-none'}`}>
                                <p className={`text-[9px] font-semibold mb-1 uppercase tracking-wider ${isStudent ? 'text-safe' : 'text-neon'}`}>
                                  {isStudent ? selectedStudent.name : 'You'}
                                </p>
                                <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
                                <span className="text-[8px] text-muted block mt-1.5 text-right font-mono">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-2 opacity-60">
                          <span className="text-3xl">💬</span>
                          <p className="text-xs text-muted font-mono">No chat history. Start the conversation below!</p>
                        </div>
                      )}
                    </div>

                    {/* Input bar */}
                    <div className="flex gap-2 pt-3 border-t border-border/40">
                      <input
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder={`Type a confidential message to ${selectedStudent.name}...`}
                        className="input-dark flex-1 text-xs"
                      />
                      <button onClick={sendChatMessage} className="btn-neon px-4 py-2 flex items-center gap-1.5 text-xs font-mono font-bold">
                        <Send size={13} /> Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 opacity-80">
                    <div className="w-14 h-14 rounded-full bg-border/20 flex items-center justify-center text-muted mb-2 border border-border/30">
                      <MessageCircle size={28} className="text-muted" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Student Chat Hub</h3>
                    <p className="text-xs text-muted max-w-sm">Select a student from the sidebar to view their complete message history and send real-time guidance.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── OUTCOMES ────────────────────────────────────────────────── */}
        {activeTab === 'outcomes' && outcomes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-5">
            <h2 className="text-2xl font-bold text-white font-display">Outcomes Tracker</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Total Sessions"    value={outcomes.total_sessions || 0}            icon={MessageCircle} color="neon"   />
              <StatCard label="Resolved Sessions" value={outcomes.resolved_sessions || 0}         icon={CheckCircle}   color="safe"   />
              <StatCard label="Interventions"     value={outcomes.total_interventions || 0}       icon={Heart}         color="purple" />
              <StatCard label="Students Helped"   value={outcomes.unique_students_helped || 0}    icon={Users}         color="neon"   />
              <StatCard label="Improved"          value={outcomes.improved_students_count || 0}   icon={CheckCircle}   color="safe"   />
              <StatCard label="Success Rate"      value={`${outcomes.success_percentage || 0}%`} icon={BarChart2}     color="safe"   />
            </div>
            <div className="glass-card p-5">
              <h3 className="text-sm font-bold text-white mb-4">Session Resolution Rate</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${outcomes.session_resolution_rate || 0}%`, background: 'linear-gradient(90deg, #00ff88, #00d4ff)' }} />
                </div>
                <span className="font-mono font-bold text-safe text-lg">{outcomes.session_resolution_rate || 0}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
