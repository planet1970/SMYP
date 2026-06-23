import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { Link } from 'react-router-dom';
import { Share2, Cpu, History, Calendar, CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface Account {
  id: number;
  platform: string;
  username: string;
  isActive: boolean;
}

interface Post {
  id: number;
  platform: string;
  prompt: string;
  caption: string;
  imageUrl: string | null;
  videoUrl: string | null;
  postType: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [acctsData, postsData] = await Promise.all([
          api.get<Account[]>('/social-media/accounts'),
          api.get<Post[]>('/social-media/posts'),
        ]);
        setAccounts(acctsData);
        setPosts(postsData);
      } catch (err) {
        console.error('Veri yüklenirken hata oluştu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = React.useMemo(() => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(a => a.isActive).length;
    
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === 'PUBLISHED').length;
    const scheduled = posts.filter(p => p.status === 'SCHEDULED').length;
    const failed = posts.filter(p => p.status === 'FAILED').length;
    const drafts = posts.filter(p => p.status === 'DRAFT').length;

    return { totalAccounts, activeAccounts, totalPosts, published, scheduled, failed, drafts };
  }, [accounts, posts]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500/5 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl font-bold font-display text-slate-800 tracking-wide">Genel Bakış</h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Yapay zeka motorları ile entegre sosyal medya yönetim panelindesiniz. Buradan kanallarınızı kontrol edebilir, içerik oluşturabilir ve zamanlayabilirsiniz.
          </p>
          <div className="pt-4 flex gap-4">
            <Link 
              to="/generator"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:brightness-110 shadow-md shadow-orange-500/10 transition-all duration-200 active:scale-95"
            >
              <Sparkles size={14} />
              AI Post Oluşturucu'ya Git
            </Link>
            <Link 
              to="/accounts"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs border border-slate-200 transition-all duration-200 active:scale-95"
            >
              Hesapları Yönet
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Connected Channels */}
        <div className="bg-cardbg border border-slate-200/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bağlı Hesaplar</span>
            <h3 className="text-3xl font-bold font-display text-slate-800 leading-tight">
              {stats.activeAccounts} <span className="text-xs text-slate-400 font-semibold">/ {stats.totalAccounts}</span>
            </h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Share2 size={20} />
          </div>
        </div>

        {/* Total Posts */}
        <div className="bg-cardbg border border-slate-200/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Gönderi</span>
            <h3 className="text-3xl font-bold font-display text-slate-800 leading-tight">{stats.totalPosts}</h3>
          </div>
          <div className="w-12 h-12 bg-primary/10 border border-primary/10 text-primary rounded-xl flex items-center justify-center">
            <History size={20} />
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="bg-cardbg border border-slate-200/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zamanlanmış</span>
            <h3 className="text-3xl font-bold font-display text-slate-800 leading-tight">{stats.scheduled}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
            <Calendar size={20} />
          </div>
        </div>

        {/* Failed Posts */}
        <div className="bg-cardbg border border-slate-200/60 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hatalı Gönderiler</span>
            <h3 className="text-3xl font-bold font-display text-red-500 leading-tight">{stats.failed}</h3>
          </div>
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area: Recent Posts */}
        <div className="bg-cardbg border border-slate-200/60 rounded-2xl p-6 lg:col-span-2 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <History className="text-primary" size={18} />
              Son Etkinlikler ve Gönderiler
            </h3>
            <Link to="/history" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Tümünü Gör <ArrowRight size={14} />
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              Henüz oluşturulmuş gönderi kaydı bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scroll pr-2">
              {posts.slice(0, 5).map((post) => (
                <div key={post.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                  {post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl.trim() !== '' ? (
                    <div className="w-12 h-12 bg-slate-50 border border-slate-200/60 rounded-lg shrink-0 relative group/thumb cursor-pointer">
                      <div className="w-full h-full rounded-lg overflow-hidden">
                        <img src={getImageUrl(post.imageUrl)} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                      {/* Hover Image Preview */}
                      <div className="absolute hidden group-hover/thumb:block left-14 top-0 z-50 w-48 h-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 pointer-events-none animate-fadeIn">
                        <img src={getImageUrl(post.imageUrl)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200/60 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      <Cpu size={18} />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase tracking-wider">
                        {post.platform}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 line-clamp-1">{post.prompt || 'Doğrudan İçerik'}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{post.caption}</p>
                  </div>
                  <div className="shrink-0 pt-1">
                    {post.status === 'PUBLISHED' && <span className="text-green-500" title="Yayınlandı"><CheckCircle2 size={16} /></span>}
                    {post.status === 'SCHEDULED' && <span className="text-blue-500" title="Zamanlandı"><Calendar size={16} /></span>}
                    {post.status === 'FAILED' && <span className="text-red-500" title="Hatalı"><XCircle size={16} /></span>}
                    {post.status === 'DRAFT' && <span className="text-slate-400" title="Taslak"><AlertCircle size={16} /></span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Content Area: Connected Channels Status */}
        <div className="bg-cardbg border border-slate-200/60 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <Share2 className="text-primary" size={18} />
              Aktif Kanallar
            </h3>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              Bağlı sosyal medya hesabı bulunamadı.
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center font-bold text-xs text-primary">
                      {account.platform[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{account.username}</h4>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">{account.platform}</p>
                    </div>
                  </div>
                  <div>
                    {account.isActive ? (
                      <span className="text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-600 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
                        Pasif
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
