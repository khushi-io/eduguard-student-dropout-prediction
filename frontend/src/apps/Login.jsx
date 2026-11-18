import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';
import { Cpu, Eye, EyeOff, AlertCircle, Shield, BookOpen, Users, GraduationCap, UserCheck } from 'lucide-react';

const CREDENTIALS = [
  { role: 'Admin',     user: 'admin',     pass: 'admin123',     icon: Shield,          desc: 'System oversight & CSV management' },
  { role: 'Faculty',   user: 'faculty',   pass: 'faculty123',   icon: BookOpen,        desc: 'Marks, attendance & behavior tracking' },
  { role: 'Counselor', user: 'counselor', pass: 'counselor123', icon: Users,           desc: 'Student vital files & session logs' },
  { role: 'HOD',       user: 'hod',       pass: 'hod123',       icon: GraduationCap,   desc: 'Department briefing & analytics' },
  { role: 'Student',   user: 'student',   pass: 'student123',   icon: UserCheck,       desc: 'Progress tracking & growth garden' },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Please enter credentials.'); return; }
    setLoading(true); setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (u, p) => { setUsername(u); setPassword(p); setError(''); };

  return (
    <div className="min-h-screen bg-navy relative overflow-hidden flex items-center justify-center p-6"
         style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5 blur-3xl"
           style={{ background: 'radial-gradient(circle, #00d4ff, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5 blur-3xl"
           style={{ background: 'radial-gradient(circle, #0066ff, transparent)' }} />

      <div className="w-full max-w-5xl flex gap-8 items-start">

        {/* Left — Login Form */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 max-w-md"
        >
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #00d4ff, #0066ff)', boxShadow: '0 0 30px rgba(0,212,255,0.5)' }}>
              <Cpu size={22} className="text-navy" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white font-display tracking-wide">MCA INTELLIGENCE</h1>
              <p className="text-xs text-neon font-mono">Student Intelligence & Counselling System</p>
            </div>
          </div>

          <div className="glass-card p-8" style={{ boxShadow: '0 0 60px rgba(0,212,255,0.08), 0 20px 60px rgba(0,0,0,0.6)' }}>
            <h2 className="text-2xl font-bold text-white mb-1 font-display">Sign In</h2>
            <p className="text-sm text-muted mb-7">Access your MCA department portal</p>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-lg mb-5 text-sm"
                  style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444' }}
                >
                  <AlertCircle size={15} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Username</label>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-dark pr-11"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-neon transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <motion.button
                id="login-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-neon mt-2 flex items-center justify-center gap-2 h-11"
              >
                {loading ? (
                  <div className="w-4 h-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
                ) : 'Access Portal'}
              </motion.button>
            </form>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted text-center font-mono">
                MCA DEPARTMENT · EduGuard v2.0 · SECURE ACCESS
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right — Credentials Reference */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 flex flex-col gap-3"
        >
          <div className="mb-2">
            <p className="text-xs text-muted uppercase tracking-widest font-mono">Quick Access — Demo Accounts</p>
          </div>

          {CREDENTIALS.map((c, i) => (
            <motion.button
              key={c.role}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={{ x: 4 }}
              onClick={() => quickLogin(c.user, c.pass)}
              id={`quick-login-${c.role.toLowerCase()}`}
              className="glass-card p-4 text-left flex items-center gap-4 border border-border hover:border-neon/30 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                   style={{ background: 'rgba(0,212,255,0.08)' }}>
                <c.icon size={18} className="text-neon group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{c.role}</span>
                  <span className="text-xs font-mono text-muted">{c.user} / {c.pass}</span>
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">{c.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
