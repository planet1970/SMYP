import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, RefreshCw, Key, ToggleLeft, ToggleRight, X, ShieldCheck, Instagram, Facebook, Video, Link2, Bell, Save, Send } from 'lucide-react';

interface Account {
  id: number;
  platform: string;
  username: string;
  isActive: boolean;
  isSimulated: boolean;
  credentials: any;
  createdAt: string;
}

const SocialMediaAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingId, setTestingId] = useState<number | null>(null);

  // Form & modal state for adding new accounts
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [platform, setPlatform] = useState<string>('INSTAGRAM');
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [accessToken, setAccessToken] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');

  // Telegram Notification states
  const [tgBotToken, setTgBotToken] = useState<string>('');
  const [tgChatId, setTgChatId] = useState<string>('');
  const [tgIsActive, setTgIsActive] = useState<boolean>(false);
  const [tgSaving, setTgSaving] = useState<boolean>(false);
  const [tgTesting, setTgTesting] = useState<boolean>(false);

  const fetchTelegramSettings = async () => {
    try {
      const res = await api.get<{ botToken: string; chatId: string; isActive: boolean }>('/social-media/telegram');
      if (res) {
        setTgBotToken(res.botToken || '');
        setTgChatId(res.chatId || '');
        setTgIsActive(res.isActive || false);
      }
    } catch (error) {
      console.error('Telegram ayarları yüklenirken hata:', error);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgSaving(true);
    try {
      await api.post('/social-media/telegram', {
        botToken: tgBotToken,
        chatId: tgChatId,
        isActive: tgIsActive,
      });
      toast.success('Telegram bildirim ayarları kaydedildi!');
      fetchTelegramSettings();
    } catch (error) {
      console.error('Telegram ayarları kaydedilirken hata:', error);
    } finally {
      setTgSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!tgBotToken || !tgChatId) {
      toast.error('Lütfen önce Bot Token ve Chat ID alanlarını doldurun.');
      return;
    }
    setTgTesting(true);
    toast.loading('Test mesajı gönderiliyor...', { id: 'testTg' });
    try {
      const res = await api.post<{ success: boolean; message: string }>('/social-media/telegram/test', {});
      toast.dismiss('testTg');
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.dismiss('testTg');
      console.error('Telegram test hatası:', error);
    } finally {
      setTgTesting(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await api.get<Account[]>('/social-media/accounts');
      setAccounts(data);
    } catch (error) {
      console.error('Hesaplar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchTelegramSettings();
  }, []);

  const handleToggleActive = async (account: Account) => {
    try {
      await api.put(`/social-media/accounts/${account.id}`, {
        ...account,
        isActive: !account.isActive,
      });
      toast.success(`Hesap ${!account.isActive ? 'aktif' : 'pasif'} hale getirildi.`);
      fetchAccounts();
    } catch (error) {
      console.error('Durum değiştirilirken hata:', error);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
      try {
        await api.delete(`/social-media/accounts/${id}`);
        toast.success('Hesap silindi.');
        fetchAccounts();
      } catch (error) {
        console.error('Hesap silinirken hata:', error);
      }
    }
  };

  const handleTestConnection = async (account: Account) => {
    setTestingId(account.id);
    toast.loading('Bağlantı test ediliyor...', { id: 'testConn' });
    try {
      const res = await api.post<{ success: boolean; message: string }>(`/social-media/accounts/${account.id}/test`, {});
      toast.dismiss('testConn');
      if (res.success) {
        toast.success(res.message, { duration: 5000 });
      } else {
        toast.error(res.message, { duration: 6000 });
      }
      fetchAccounts(); // In case token was automatically exchanged and saved
    } catch (error) {
      toast.dismiss('testConn');
      console.error('Bağlantı testi hatası:', error);
    } finally {
      setTestingId(null);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Lütfen bir kullanıcı adı girin.');
      return;
    }

    try {
      await api.post('/social-media/accounts', {
        platform,
        username: username.trim(),
        isActive: true,
        isSimulated,
        credentials: {
          accessToken: accessToken.trim() || undefined,
          pageId: pageId.trim() || undefined,
        },
      });
      toast.success('Hesap başarıyla tanımlandı!');
      setIsAddModalOpen(false);
      setUsername('');
      setAccessToken('');
      setPageId('');
      fetchAccounts();
    } catch (error) {
      console.error('Hesap eklenirken hata:', error);
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'INSTAGRAM':
        return <Instagram className="text-pink-500" size={18} />;
      case 'FACEBOOK':
        return <Facebook className="text-blue-500" size={18} />;
      case 'TIKTOK':
        return <Video className="text-slate-700" size={18} />;
      default:
        return <Link2 className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Hesap Tanımları</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Kanallar ve API Entegrasyon Merkezleri</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:brightness-110 shadow-lg shadow-orange-500/10 transition-all duration-200 active:scale-95"
        >
          <Plus size={16} />
          Yeni Hesap Tanımla
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Plus size={28} />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-800 mb-1">Hesap Bulunamadı</h3>
          <p className="text-slate-500 text-xs mb-6">
            Henüz entegre edilmiş bir sosyal medya kanalı tanımlamadınız. API bağlantılarını kurmak için yeni bir hesap ekleyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-cardbg border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center">
                      {getPlatformIcon(account.platform)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{account.username}</h4>
                      <p className="text-[9px] text-slate-400 uppercase font-semibold">{account.platform}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleToggleActive(account)}
                    className="text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                    title={account.isActive ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                  >
                    {account.isActive ? (
                      <ToggleRight className="text-green-500" size={32} />
                    ) : (
                      <ToggleLeft className="text-slate-300" size={32} />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">Çalışma Modu</span>
                    <span className={`font-semibold px-2 py-0.5 rounded ${account.isSimulated ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'}`}>
                      {account.isSimulated ? 'Simülasyon' : 'Gerçek API'}
                    </span>
                  </div>

                  {!account.isSimulated && (
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold uppercase">Sayfa Bağlantısı</span>
                      <span className="text-slate-600 font-medium truncate max-w-[140px]" title={account.credentials?.pageId}>
                        {account.credentials?.pageId || 'Girilmedi'}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold uppercase">Eklenme Tarihi</span>
                    <span className="text-slate-500">
                      {new Date(account.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200/60">
                <button
                  onClick={() => handleTestConnection(account)}
                  disabled={testingId === account.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-2 px-3 border border-slate-200 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {testingId === account.id ? (
                    <RefreshCw className="animate-spin" size={12} />
                  ) : account.isSimulated ? (
                    <ShieldCheck size={12} />
                  ) : (
                    <Key size={12} />
                  )}
                  <span>Test Et</span>
                </button>

                <button
                  onClick={() => handleDeleteAccount(account.id)}
                  className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all active:scale-95"
                  title="Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Telegram Settings Card */}
      <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-6 shadow-sm max-w-3xl">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 mb-5">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">Telegram Bildirim Ayarları</h3>
            <p className="text-[10px] text-slate-400 font-medium">Sistem olayları, kampanyalar ve kritik hatalar için Telegram entegrasyonu</p>
          </div>
        </div>

        <form onSubmit={handleSaveTelegram} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telegram Bot Token (HTTP API Token)</label>
              <input
                type="password"
                value={tgBotToken}
                onChange={(e) => setTgBotToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alıcı Chat ID (Sizin veya Grup ID'niz)</label>
              <input
                type="text"
                value={tgChatId}
                onChange={(e) => setTgChatId(e.target.value)}
                placeholder="-100123456789 veya 12345678"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tgActiveCheckbox"
                checked={tgIsActive}
                onChange={(e) => setTgIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <label htmlFor="tgActiveCheckbox" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                Telegram Bildirimlerini Etkinleştir
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={tgTesting}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 border border-slate-200 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Send size={12} />
                <span>Test Gönder</span>
              </button>

              <button
                type="submit"
                disabled={tgSaving}
                className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:brightness-110 shadow-lg shadow-orange-500/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save size={12} />
                <span>Kaydet</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col p-6 space-y-5 animate-fadeIn text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
              <h3 className="font-bold font-display text-slate-800 text-base">Yeni Hesap Tanımla</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sosyal Medya Platformu</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                >
                  <option value="INSTAGRAM">Instagram Business</option>
                  <option value="FACEBOOK">Facebook Page</option>
                  <option value="TIKTOK">TikTok (Simulation)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="örn: ednrehber"
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={isSimulated}
                    onChange={(e) => setIsSimulated(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                  />
                  <span>Simülasyon Modu</span>
                </label>
                <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                  Aktif edildiğinde, paylaşımlar gerçek API kanalları yerine backend'de simüle edilir ve başarılı olarak kabul edilir.
                </p>
              </div>

              {!isSimulated && (
                <div className="space-y-3.5 border-t border-slate-200/60 pt-3 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meta Access Token</label>
                    <textarea
                      rows={3}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Erişim Jetonu (Graph API Explorer token)"
                      required={!isSimulated}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary font-mono leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Facebook Sayfa ID (Page ID)</label>
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="Sayfa Numarası (Sayısal)"
                      required={!isSimulated}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/85 border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all active:scale-95"
                >
                  Hesap Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaAccounts;
