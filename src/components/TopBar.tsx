import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Bell } from 'lucide-react';

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 bg-sidebarbg/80 backdrop-blur-md border-b border-slate-200/60 fixed top-0 right-0 left-64 flex items-center justify-between px-8 z-40 transition-all duration-300">
      <div>
        <h2 className="text-lg font-bold font-display text-slate-800 tracking-wide">Sosyal Medya Yönetimi</h2>
        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Standalone Control Center</p>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
        </button>

        <div className="h-8 w-px bg-slate-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <User size={16} />
          </div>
          <div className="text-left hidden md:block">
            <h4 className="text-xs font-bold text-slate-800 font-display">{user?.name || 'Yönetici'}</h4>
            <p className="text-[9px] text-slate-400 font-medium">{user?.email || 'admin@edirnego.com'}</p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-primary py-2 px-3 bg-slate-100 hover:bg-primary/10 border border-slate-200/60 hover:border-primary/10 rounded-xl transition-all active:scale-95"
          title="Çıkış Yap"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Çıkış</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
