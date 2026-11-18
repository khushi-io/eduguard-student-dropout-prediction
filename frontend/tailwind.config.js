/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:    '#050d1f',
        panel:   '#0a1628',
        card:    '#0f1f3d',
        border:  '#1a2d4d',
        neon:    '#00d4ff',
        'neon-dim': '#0099bb',
        'neon-glow': 'rgba(0,212,255,0.15)',
        safe:    '#00ff88',
        'safe-dim': '#00cc66',
        warn:    '#ffb800',
        'warn-dim': '#cc9200',
        danger:  '#ff4444',
        'danger-dim': '#cc2222',
        muted:   '#4a6080',
        light:   '#a8c4e0',
        white:   '#f0f8ff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'neon-gradient': 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
        'panel-gradient': 'linear-gradient(180deg, #0a1628 0%, #050d1f 100%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'neon':      '0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        'neon-sm':   '0 0 10px rgba(0,212,255,0.2)',
        'safe':      '0 0 20px rgba(0,255,136,0.3)',
        'danger':    '0 0 20px rgba(255,68,68,0.3)',
        'warn':      '0 0 20px rgba(255,184,0,0.3)',
        'glass':     '0 8px 32px rgba(0,0,0,0.4)',
        'card':      '0 4px 24px rgba(0,0,0,0.5)',
        'inner-neon':'inset 0 0 20px rgba(0,212,255,0.05)',
      },
      animation: {
        'pulse-neon':   'pulseNeon 2s ease-in-out infinite',
        'fade-up':      'fadeUp 0.4s ease-out forwards',
        'slide-in':     'slideIn 0.3s ease-out forwards',
        'scan':         'scan 3s linear infinite',
        'spin-slow':    'spin 8s linear infinite',
        'glow':         'glow 2s ease-in-out infinite',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        fadeUp: {
          'from': { opacity: 0, transform: 'translateY(16px)' },
          'to':   { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          'from': { opacity: 0, transform: 'translateX(-16px)' },
          'to':   { opacity: 1, transform: 'translateX(0)' },
        },
        scan: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,212,255,0.2)' },
          '50%':      { boxShadow: '0 0 30px rgba(0,212,255,0.5), 0 0 60px rgba(0,212,255,0.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
