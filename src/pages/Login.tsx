import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Loader2, Sparkles } from 'lucide-react';

const Login: React.FC = () => {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email: email.trim(), password: password.trim() });
      navigate('/');
    } catch {
      // Error is set in AuthContext
    }
  };

  return (
    <div className="min-h-screen bg-darkbg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-cardbg p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200/60 relative z-10">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-gradient-to-tr from-orange-600 to-primary rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-md shadow-orange-500/10 mx-auto mb-4 font-display">
            S
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-wide">SMYP Portal</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">Sosyal Medya Yönetim Paneline Erişim</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">E-Posta Adresi</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Güvenlik Şifresi</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-semibold p-3.5 rounded-xl leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-500/10 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-98 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Bağlantı Kuruluyor...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Giriş Yap
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
