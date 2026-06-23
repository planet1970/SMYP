import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Share2, History, ShieldAlert, CalendarRange, PenTool, Settings } from 'lucide-react';

const Sidebar: React.FC = () => {
  const menuItems = [
    { title: 'Genel Bakış', icon: LayoutDashboard, path: '/' },
    { title: 'Post Oluşturucu', icon: PenTool, path: '/post-creator' },
    { title: 'AI Post Oluşturucu', icon: Cpu, path: '/generator' },
    { title: 'Zamanlanmış Görevler', icon: CalendarRange, path: '/campaigns' },
    { title: 'Hesap Tanımları', icon: Share2, path: '/accounts' },
    { title: 'Gönderi Geçmişi', icon: History, path: '/history' },
    { title: 'AI Ayarları', icon: Settings, path: '/ai-settings' },
  ];


  return (
    <aside className="w-64 bg-sidebarbg text-slate-600 h-screen fixed left-0 top-0 flex flex-col border-r border-slate-200/60 z-50">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-950/20 font-display">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-wide font-display leading-tight">SMYP</h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-widest uppercase">Social Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scroll py-8 px-4 space-y-8">
        <div>
          <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
            YÖNETİM PANELİ
          </h3>
          <ul className="space-y-1.5">
            {menuItems.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 border border-transparent ${
                    isActive 
                      ? 'bg-primary/10 text-primary border-primary/10 shadow-[0_0_15px_rgba(255,108,47,0.03)]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                      <span>{item.title}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200/60 shrink-0 bg-slate-50">
        {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <div className="bg-white rounded-xl p-3 border border-slate-200/50 flex items-center gap-3 shadow-sm mb-3">
            <ShieldAlert size={16} className="text-primary shrink-0" />
            <div className="text-[10px] leading-relaxed text-slate-500">
              <span className="font-bold text-slate-800 block">Local Test Platformu</span>
              Bağlantı: api.edirnego.com
            </div>
          </div>
        )}
        <p className="text-[9px] text-center text-slate-400 font-medium">
          &copy; 2026 SMYP Panel v1.0.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
