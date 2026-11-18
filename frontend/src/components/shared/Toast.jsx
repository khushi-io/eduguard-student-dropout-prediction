import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
const classes = {
  success: 'toast-success',
  error: 'toast-error',
  warning: 'fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-md',
  info: 'toast-info',
};

export function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              className={t.type === 'success' ? 'toast-success' : t.type === 'error' ? 'toast-error' : 'toast-info'}
              style={{ position: 'relative', top: 'auto', right: 'auto' }}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} className="flex-shrink-0 mt-0.5" />
                <span className="flex-1 text-sm">{t.message}</span>
                <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
