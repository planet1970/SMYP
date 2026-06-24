import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  PenTool, Send, Calendar, RefreshCw, Sparkles, Image as ImageIcon, 
  Video, Instagram, Facebook, Trash2, Heart, MessageCircle, Bookmark, ThumbsUp, MessageSquare, Share2, Music, User 
} from 'lucide-react';

interface Account {
  id: number;
  platform: string;
  username: string;
  isActive: boolean;
}

const PostCreator: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form States
  const [platform, setPlatform] = useState<string>('INSTAGRAM');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [postType, setPostType] = useState<string>('POST');
  const [caption, setCaption] = useState<string>('');
  
  // Media States
  const [imageUrl, setImageUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [includeImage, setIncludeImage] = useState<boolean>(false);
  const [includeVideo, setIncludeVideo] = useState<boolean>(false);

  // AI Generator Help States
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiTone, setAiTone] = useState<string>('Samimi');
  const [aiTextProvider, setAiTextProvider] = useState<string>('gemini');
  const [aiTextModel, setAiTextModel] = useState<string>('gemini-2.5-flash');
  const [generatingText, setGeneratingText] = useState<boolean>(false);

  const [aiImagePrompt, setAiImagePrompt] = useState<string>('');
  const [aiImageProvider, setAiImageProvider] = useState<string>('huggingface');
  const [aiImageModel, setAiImageModel] = useState<string>('flux');
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);
  const [customModels, setCustomModels] = useState<any[]>([]);

  // Dynamic model lists and loader states
  const [settingsRaw, setSettingsRaw] = useState<any>(null);
  const [textModelsList, setTextModelsList] = useState<string[]>([]);
  const [imageModelsList, setImageModelsList] = useState<string[]>([]);
  const [loadingTextModels, setLoadingTextModels] = useState<boolean>(false);
  const [loadingImageModels, setLoadingImageModels] = useState<boolean>(false);
  const [showManualTextModel, setShowManualTextModel] = useState<boolean>(false);
  const [showManualImageModel, setShowManualImageModel] = useState<boolean>(false);

  // Scheduling States
  const [isScheduleMode, setIsScheduleMode] = useState<boolean>(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');

  const fetchModelsForProvider = async (type: 'text' | 'image', providerId: string, rawData?: any, targetModel?: string) => {
    const activeSettings = rawData || settingsRaw;
    if (!activeSettings) return;

    let apiUrl = '';
    let apiKey = '';
    let providerType = providerId;

    if (providerId === 'gemini') {
      apiUrl = activeSettings.geminiUrl || 'https://generativelanguage.googleapis.com';
      apiKey = activeSettings.geminiKey || '';
    } else if (providerId === 'openai') {
      apiUrl = activeSettings.openAiUrl || 'https://api.openai.com';
      apiKey = activeSettings.openAiKey || '';
    } else if (providerId === 'claude') {
      apiUrl = activeSettings.claudeUrl || 'https://api.anthropic.com';
      apiKey = activeSettings.claudeKey || '';
    } else if (providerId === 'simulation') {
      if (type === 'text') setTextModelsList(['simulation']);
      else setImageModelsList(['simulation']);
      return;
    } else {
      const customModelsList = activeSettings.customModels || [];
      const found = customModelsList.find((m: any) => m.id === providerId);
      if (found) {
        apiUrl = found.apiUrl || '';
        apiKey = found.apiKey || '';
        providerType = found.provider || 'openai';
      }
    }

    if (!apiUrl || !apiKey) {
      if (type === 'text') {
        setTextModelsList([]);
        setShowManualTextModel(true);
      } else {
        setImageModelsList([]);
        setShowManualImageModel(true);
      }
      return;
    }

    if (type === 'text') {
      setLoadingTextModels(true);
      try {
        const models = await api.post<string[]>('/social-media/ai-settings/fetch-models', {
          apiUrl,
          apiKey,
          provider: providerType,
        });
        setTextModelsList(models || []);
        if (models && models.length > 0) {
          setShowManualTextModel(false);
          // Sync state with first model if current is not in list
          const activeModel = targetModel !== undefined ? targetModel : aiTextModel;
          if (!models.includes(activeModel)) {
            setAiTextModel(models[0]);
          }
        } else {
          setShowManualTextModel(true);
        }
      } catch (err) {
        console.error('Metin modelleri alınamadı:', err);
        setTextModelsList([]);
        setShowManualTextModel(true);
      } finally {
        setLoadingTextModels(false);
      }
    } else {
      setLoadingImageModels(true);
      try {
        const models = await api.post<string[]>('/social-media/ai-settings/fetch-models', {
          apiUrl,
          apiKey,
          provider: providerType,
        });
        setImageModelsList(models || []);
        if (models && models.length > 0) {
          setShowManualImageModel(false);
          // Sync state with first model if current is not in list
          const activeModel = targetModel !== undefined ? targetModel : aiImageModel;
          if (!models.includes(activeModel)) {
            setAiImageModel(models[0]);
          }
        } else {
          setShowManualImageModel(true);
        }
      } catch (err) {
        console.error('Görsel modelleri alınamadı:', err);
        setImageModelsList([]);
        setShowManualImageModel(true);
      } finally {
        setLoadingImageModels(false);
      }
    }
  };

  const fetchAiSettings = async () => {
    try {
      const data = await api.get<any>('/social-media/ai-settings');
      setSettingsRaw(data);
      const textProv = data.defaultTextProvider || 'gemini';
      const textMod = data.defaultTextModel || 'gemini-2.5-flash';
      const imgProv = data.defaultImageProvider || 'huggingface';
      const imgMod = data.defaultImageModel || 'flux';

      setAiTextProvider(textProv);
      setAiTextModel(textMod);
      setAiImageProvider(imgProv);
      setAiImageModel(imgMod);
      setCustomModels(Array.isArray(data.customModels) ? data.customModels : []);

      fetchModelsForProvider('text', textProv, data);
      fetchModelsForProvider('image', imgProv, data);
    } catch (error) {
      console.error('AI ayarları alınamadı:', error);
    }
  };

  const handleTextProviderChange = (prov: string) => {
    setAiTextProvider(prov);
    let defModel = 'gemini-2.5-flash';
    if (prov === 'gemini') defModel = 'gemini-2.5-flash';
    else if (prov === 'openai') defModel = 'gpt-4o-mini';
    else if (prov === 'claude') defModel = 'claude-3-5-sonnet-20241022';
    else if (prov === 'simulation') defModel = 'simulation';
    else {
      const found = customModels.find(m => m.id === prov);
      if (found) defModel = found.selectedModel;
    }
    setAiTextModel(defModel);
    fetchModelsForProvider('text', prov, undefined, defModel);
  };

  const handleImageProviderChange = (prov: string) => {
    setAiImageProvider(prov);
    let defModel = 'black-forest-labs/FLUX.1-schnell';
    if (prov === 'huggingface') defModel = 'black-forest-labs/FLUX.1-schnell';
    else if (prov === 'gemini') defModel = 'imagen-3.0-generate-002';
    else if (prov === 'dalle') defModel = 'dall-e-3';
    else if (prov === 'stability') defModel = 'sdxl';
    else if (prov === 'simulation') defModel = 'simulation';
    else {
      const found = customModels.find(m => m.id === prov);
      if (found) defModel = found.selectedModel;
    }
    setAiImageModel(defModel);
    fetchModelsForProvider('image', prov, undefined, defModel);
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const data = await api.get<Account[]>('/social-media/accounts');
      const active = data.filter(a => a.isActive);
      setAccounts(active);
    } catch (error) {
      console.error('Hesaplar yüklenirken hata:', error);
      toast.error('Sosyal medya hesapları yüklenemedi.');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchAiSettings();
  }, []);

  // Filter accounts by platform and automatically select if only 1 account
  const platformAccounts = accounts.filter(a => a.platform === platform);
  useEffect(() => {
    if (platformAccounts.length === 1) {
      setSelectedAccountId(String(platformAccounts[0].id));
    } else if (platformAccounts.length > 1) {
      // Keep selected if still valid, else select first
      const exists = platformAccounts.some(a => String(a.id) === selectedAccountId);
      if (!exists) {
        setSelectedAccountId(String(platformAccounts[0].id));
      }
    } else {
      setSelectedAccountId('');
    }
  }, [platform, accounts]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (file.type.startsWith('video/')) {
        setVideoUrl(base64String);
        setImageUrl('');
        setIncludeVideo(true);
        setIncludeImage(false);
      } else {
        setImageUrl(base64String);
        setVideoUrl('');
        setIncludeImage(true);
        setIncludeVideo(false);
      }
      toast.success(`${file.name} başarıyla seçildi.`);
    };
    reader.readAsDataURL(file);
  };

  // Generate text with AI
  const handleGenerateText = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Lütfen üretilecek metin konusu için bir prompt veya konu girin.');
      return;
    }

    setGeneratingText(true);
    try {
      const result = await api.post<{ caption: string }>('/social-media/generate', {
        prompt: aiPrompt,
        platform,
        tone: aiTone,
        textProvider: aiTextProvider,
        textModel: aiTextModel,
        includeImage: false,
        includeVideo: false,
        postType,
      });
      setCaption(result.caption);
      toast.success('Yapay zeka metni başarıyla üretti!');
    } catch (error) {
      console.error('AI metin üretme hatası:', error);
      toast.error('Yapay zeka metin üretirken hata oluştu.');
    } finally {
      setGeneratingText(false);
    }
  };

  // Generate image with AI
  const handleGenerateImage = async () => {
    if (!aiImagePrompt.trim()) {
      toast.error('Lütfen üretilecek görsel için İngilizce bir prompt girin.');
      return;
    }

    setGeneratingImage(true);
    try {
      toast.loading('Görsel yapay zekaya ürettiriliyor...', { id: 'aiImage' });
      const result = await api.post<{ imageUrl: string }>('/social-media/regenerate-image', {
        imagePrompt: aiImagePrompt,
        imageProvider: aiImageProvider,
        imageModel: aiImageModel,
      });
      setImageUrl(result.imageUrl);
      setIncludeImage(true);
      setIncludeVideo(false);
      setVideoUrl('');
      toast.success('Görsel başarıyla üretildi!', { id: 'aiImage' });
    } catch (error) {
      console.error('AI görsel üretme hatası:', error);
      toast.error('Görsel üretilirken hata oluştu.', { id: 'aiImage' });
    } finally {
      toast.dismiss('aiImage');
      setGeneratingImage(false);
    }
  };

  // Submit Post Creator form
  const handleSavePost = async () => {
    if (!caption.trim()) {
      toast.error('Gönderi metni boş bırakılamaz.');
      return;
    }

    if (!selectedAccountId) {
      toast.error('Lütfen paylaşım yapılacak sosyal medya hesabını seçin.');
      return;
    }

    let scheduledAt: string | null = null;
    if (isScheduleMode) {
      if (!scheduleDate || !scheduleTime) {
        toast.error('Lütfen planlanan tarih ve saati seçin.');
        return;
      }
      scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
    }

    setSubmitting(true);
    try {
      const post = await api.post<any>('/social-media/posts', {
        platform,
        caption,
        imageUrl: includeImage ? (imageUrl || null) : null,
        videoUrl: includeVideo ? (videoUrl || null) : null,
        postType,
        status: isScheduleMode ? 'SCHEDULED' : 'DRAFT',
        scheduledAt,
        accountId: selectedAccountId,
      });

      if (isScheduleMode) {
        toast.success('Gönderi başarıyla zamanlandı!');
      } else {
        toast.loading('Gönderi yayınlanıyor...', { id: 'publishing' });
        const publishResult = await api.post<any>(`/social-media/posts/${post.id}/publish`, {});
        toast.dismiss('publishing');
        
        if (publishResult.status === 'PUBLISHED') {
          toast.success('Gönderi başarıyla paylaşıldı (yayınlandı)!');
        } else if (publishResult.status === 'PUBLISHING') {
          toast.success('Gönderi paylaşım sırasına alındı! Durumunu Gönderi Geçmişi sayfasından takip edebilirsiniz.', { duration: 5000 });
        } else {
          toast.error(`Gönderi paylaşılamadı: ${publishResult.errorMessage || 'Bilinmeyen hata'}`);
        }
      }

      // Reset form
      setCaption('');
      setImageUrl('');
      setVideoUrl('');
      setIncludeImage(false);
      setIncludeVideo(false);
      setAiPrompt('');
      setAiImagePrompt('');
      setIsScheduleMode(false);
    } catch (error) {
      toast.dismiss('publishing');
      console.error('Post kaydetme hatası:', error);
      toast.error('İşlem gerçekleştirilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getAccountUsername = () => {
    const act = accounts.find(a => String(a.id) === selectedAccountId);
    return act ? act.username : '@edirne_rehberi';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-2">
          <PenTool className="text-primary" size={24} />
          Post Oluşturucu
        </h1>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase font-sans mt-1">
          Sosyal medya gönderilerini manuel hazırlayın, gerektiğinde yapay zekadan yardım alın
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <PenTool size={18} className="text-primary" />
              Gönderi Parametreleri
            </h3>

            {/* Platform Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hedef Platform</label>
              <div className="grid grid-cols-3 gap-3">
                {['INSTAGRAM', 'FACEBOOK', 'TIKTOK'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-xs font-bold transition-all duration-200 ${
                      platform === p
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,108,47,0.03)]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {p === 'INSTAGRAM' && <Instagram size={16} />}
                    {p === 'FACEBOOK' && <Facebook size={16} />}
                    {p === 'TIKTOK' && <Video size={16} />}
                    <span>{p}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paylaşım Yapılacak Hesap</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-sm font-semibold bg-slate-50 text-slate-800 cursor-pointer"
              >
                {loadingAccounts ? (
                  <option>Hesaplar Yükleniyor...</option>
                ) : platformAccounts.length === 0 ? (
                  <option value="">Bu platform için tanımlı aktif hesap bulunamadı!</option>
                ) : (
                  <>
                    <option value="">Hesap Seçin...</option>
                    {platformAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.username}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Post Type Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paylaşım Türü</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'POST', label: 'Gönderi (Feed)' },
                  { value: 'STORY', label: 'Hikaye (Story)' },
                  { value: 'BOTH', label: 'İkisi de' }
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setPostType(t.value)}
                    className={`flex items-center justify-center py-2.5 px-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                      postType === t.value
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,108,47,0.03)]'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="captionInput" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Gönderi Metni</label>
                <span className="text-[10px] text-slate-400 font-semibold">{caption.length} karakter</span>
              </div>
              <textarea
                id="captionInput"
                rows={6}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Sosyal medya gönderi metnini buraya yazın veya aşağıdaki AI yardımcısını kullanın..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all leading-relaxed"
              />
            </div>

            {/* Media Upload */}
            <div className="space-y-3 pt-3 border-t border-slate-200/60">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Görsel / Video Ekle</label>
              
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="creatorMediaFile"
              />
              
              <label
                htmlFor="creatorMediaFile"
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-primary bg-slate-50 hover:bg-slate-100/50 py-5 px-4 rounded-2xl cursor-pointer transition-all text-center"
              >
                <ImageIcon size={24} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700">Bilgisayarımdan Dosya Seç</span>
                <span className="text-[9px] text-slate-400">Görsel (JPEG, PNG, GIF) veya Video (MP4)</span>
              </label>

              {(imageUrl || videoUrl) && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-xs">
                  <span className="font-semibold text-slate-600 truncate max-w-[200px]">
                    {imageUrl ? '🖼️ Görsel Ekli (Hazır)' : '🎥 Video Ekli (Hazır)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setVideoUrl('');
                      setIncludeImage(false);
                      setIncludeVideo(false);
                      toast.success('Medya dosyası kaldırıldı.');
                    }}
                    className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 transition-all"
                  >
                    <Trash2 size={12} />
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            {/* Scheduling Panel */}
            <div className="bg-primary/[0.02] border border-primary/10 p-4 rounded-2xl space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isScheduleMode}
                  onChange={(e) => setIsScheduleMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                />
                <span>Gönderiyi İleriki Bir Saatte Paylaş</span>
              </label>

              {isScheduleMode && (
                <div className="grid grid-cols-2 gap-3 pt-2 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Tarih</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-500 uppercase">Saat</label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSavePost}
              disabled={submitting || !caption.trim() || !selectedAccountId}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-500/10 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-98 text-sm"
            >
              {submitting ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  İşlem Yapılıyor...
                </>
              ) : isScheduleMode ? (
                <>
                  <Calendar size={16} />
                  Gönderiyi Zamanla ve Kaydet
                </>
              ) : (
                <>
                  <Send size={16} />
                  Gönderiyi Şimdi Paylaş
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Helpers Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* AI Text Assistant */}
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <Sparkles className="text-yellow-500" size={16} />
              AI Metin Yardımcısı
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Metin Konusu / Prompt</label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Yazılmasını istediğiniz konuyu buraya özetleyin..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Ses Tonu</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755"
                  >
                    <option value="Samimi">Samimi</option>
                    <option value="Profesyonel">Profesyonel</option>
                    <option value="Eğlenceli">Eğlenceli</option>
                    <option value="Haberci">Haberci</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Metin Modeli Sağlayıcı</label>
                  <select
                    value={aiTextProvider}
                    onChange={(e) => handleTextProviderChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 cursor-pointer"
                  >
                    {(!settingsRaw || settingsRaw.geminiKey) && <option value="gemini">Gemini</option>}
                    {(!settingsRaw || settingsRaw.openAiKey) && <option value="openai">ChatGPT</option>}
                    {(!settingsRaw || settingsRaw.claudeKey) && <option value="claude">Claude</option>}
                    <option value="simulation">Simülasyon (Test Modu)</option>
                    {customModels.filter(m => m.apiKey).map(m => (
                      <option key={m.id} value={m.id}>[Özel] {m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Model Seçimi</label>
                  {loadingTextModels ? (
                    <div className="flex items-center gap-1.5 py-1.5 text-[10px] text-slate-500 font-semibold uppercase">
                      <RefreshCw className="animate-spin" size={10} />
                      Yükleniyor...
                    </div>
                  ) : textModelsList.length > 0 && !showManualTextModel ? (
                    <div className="flex gap-1.5">
                      <select
                        value={aiTextModel}
                        onChange={(e) => setAiTextModel(e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 cursor-pointer focus:outline-none"
                      >
                        {textModelsList.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowManualTextModel(true)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded text-[9px] font-extrabold uppercase shrink-0 transition-all"
                      >
                        Manuel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={aiTextModel}
                        onChange={(e) => setAiTextModel(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                        placeholder="Model ID (Örn: gpt-4o-mini)"
                      />
                      {textModelsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowManualTextModel(false)}
                          className="text-[9px] text-primary hover:underline font-bold block"
                        >
                          Listeye geri dön
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateText}
                disabled={generatingText || !aiPrompt.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {generatingText ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} />
                    Metin Üretiliyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Üret & Metne Yaz
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Image Assistant */}
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold font-display text-slate-800 flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <ImageIcon className="text-indigo-500" size={16} />
              AI Görsel Yardımcısı
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">İngilizce Görsel Promptu</label>
                <textarea
                  rows={3}
                  value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="Görselde ne olmasını istiyorsunuz? (İngilizce yazın)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Görsel Modeli</label>
                  <select
                    value={aiImageProvider}
                    onChange={(e) => handleImageProviderChange(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 cursor-pointer"
                  >
                    {(!settingsRaw || settingsRaw.huggingFaceKey) && <option value="huggingface">FLUX (HuggingFace)</option>}
                    {(!settingsRaw || settingsRaw.geminiKey) && <option value="gemini">Imagen 3 (Gemini)</option>}
                    {(!settingsRaw || settingsRaw.openAiKey) && <option value="dalle">DALL-E 3</option>}
                    {(!settingsRaw || settingsRaw.stabilityKey) && <option value="stability">Stability AI</option>}
                    {customModels.filter(m => m.apiKey).map(m => (
                      <option key={m.id} value={m.id}>[Özel] {m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Model Seçimi</label>
                  {loadingImageModels ? (
                    <div className="flex items-center gap-1.5 py-1.5 text-[10px] text-slate-500 font-semibold uppercase">
                      <RefreshCw className="animate-spin" size={10} />
                      Yükleniyor...
                    </div>
                  ) : imageModelsList.length > 0 && !showManualImageModel ? (
                    <div className="flex gap-1.5">
                      <select
                        value={aiImageModel}
                        onChange={(e) => setAiImageModel(e.target.value)}
                        className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-755 cursor-pointer focus:outline-none"
                      >
                        {imageModelsList.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowManualImageModel(true)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-550 rounded text-[9px] font-extrabold uppercase shrink-0 transition-all"
                      >
                        Manuel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={aiImageModel}
                        onChange={(e) => setAiImageModel(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                        placeholder="Model ID (Örn: black-forest-labs/FLUX.1-schnell)"
                      />
                      {imageModelsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowManualImageModel(false)}
                          className="text-[9px] text-primary hover:underline font-bold block"
                        >
                          Listeye geri dön
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={generatingImage || !aiImagePrompt.trim()}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                {generatingImage ? (
                  <>
                    <RefreshCw className="animate-spin" size={12} />
                    Görsel Üretiliyor...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Üret & Medyaya Ekle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Mock Preview Area */}
        <div className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Canlı Önizleme (Mockup)</h3>

            {/* Story Preview Mockup */}
            {postType === 'STORY' ? (
              <div className={`border border-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-[280px] mx-auto aspect-[9/16] relative text-white ${
                imageUrl && !videoUrl ? 'bg-white' : 'bg-[#121212]'
              }`}>
                {/* Media */}
                {videoUrl ? (
                  <video key={videoUrl} src={getImageUrl(videoUrl)} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-[0.8]" />
                ) : imageUrl ? (
                  <img key={imageUrl} src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-auto brightness-[0.8]" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-800 via-pink-700 to-orange-500 flex items-center justify-center p-6 text-center">
                    <div className="space-y-3">
                      <Sparkles className="mx-auto text-white/80 animate-pulse" size={40} />
                      <p className="text-xs font-bold text-white font-display">Hikaye Önizlemesi</p>
                    </div>
                  </div>
                )}

                {/* Top Story Indicators */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                  <div className="h-0.5 flex-1 bg-white rounded-full"></div>
                </div>

                {/* Story User Header */}
                <div className="absolute top-7 left-4 right-4 flex items-center gap-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-primary text-[10px] font-bold">E</div>
                  <span className="text-[11px] font-bold shadow-sm">{getAccountUsername()}</span>
                  <span className="text-[9px] text-gray-300">1s</span>
                </div>

                {/* Bottom Story Message overlay */}
                <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 w-[72%] bg-black/65 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 text-center z-10">
                  <p className="text-[10px] leading-relaxed text-white font-semibold whitespace-pre-wrap">
                    {caption || "Hikaye içeriği girildiğinde burada görüntülenecektir."}
                  </p>
                  <span className="block text-[8px] text-gray-300 font-bold mt-2 text-center">
                    ✍️ Görsele otomatik yazılacaktır
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Instagram Mock Preview */}
                {platform === 'INSTAGRAM' && (
                  <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-lg max-w-sm mx-auto text-slate-800">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-0.5">
                          <div className="w-full h-full bg-white rounded-full p-0.5">
                            <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              <User size={14} />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{getAccountUsername()}</h4>
                          <p className="text-[9px] text-slate-400 font-medium">Edirne, Türkiye</p>
                        </div>
                      </div>
                      <button className="text-slate-400 font-bold hover:text-slate-600 pb-2">•••</button>
                    </div>

                    {/* Main Media */}
                    <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {videoUrl ? (
                        <video key={videoUrl} src={getImageUrl(videoUrl)} controls autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : imageUrl ? (
                        <img key={imageUrl} src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6 space-y-2">
                          <ImageIcon className="mx-auto text-slate-300 animate-pulse" size={42} />
                          <p className="text-[10px] font-semibold text-slate-400 italic px-4">Görsel veya video seçildiğinde burada görüntülenecektir.</p>
                        </div>
                      )}
                    </div>

                    {/* Engagement Icons */}
                    <div className="p-3.5 flex justify-between items-center text-slate-700">
                      <div className="flex items-center gap-4">
                        <Heart size={22} className="cursor-pointer hover:text-red-500 hover:scale-110 transition-transform" />
                        <MessageCircle size={22} className="cursor-pointer hover:text-slate-800" />
                        <Send size={22} className="cursor-pointer hover:text-slate-800 hover:rotate-12 transition-transform" />
                      </div>
                      <Bookmark size={22} className="cursor-pointer hover:text-slate-800" />
                    </div>

                    {/* Comments & Captions */}
                    <div className="px-3.5 pb-4 space-y-1.5 text-[11px] text-slate-700">
                      <p className="font-bold text-slate-800">1,248 beğeni</p>
                      <div>
                        <span className="font-bold text-slate-900 mr-2">{getAccountUsername()}</span>
                        <span className="text-slate-600 whitespace-pre-wrap">
                          {caption || "Gönderi metni burada görüntülenecektir. Lütfen sol taraftaki formu doldurun."}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wide pt-1">1 dakika önce</p>
                    </div>
                  </div>
                )}

                {/* Facebook Mock Preview */}
                {platform === 'FACEBOOK' && (
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-4 shadow-lg max-w-sm mx-auto space-y-3 text-slate-800">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-500">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          {getAccountUsername()}
                          <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] font-bold">✓</span>
                        </h4>
                        <p className="text-[9px] text-slate-400 flex items-center gap-1">
                          Şimdi · 🌎
                        </p>
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {caption || "Gönderi metni burada görüntülenecektir. Lütfen sol taraftaki formu doldurun."}
                    </p>

                    {/* Image Block */}
                    <div className="aspect-video bg-slate-50 rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-200/60">
                      {videoUrl ? (
                        <video key={videoUrl} src={getImageUrl(videoUrl)} controls autoPlay loop muted playsInline className="w-full h-full object-cover" />
                      ) : imageUrl ? (
                        <img key={imageUrl} src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon className="mx-auto text-slate-300 animate-pulse mb-1" size={36} />
                          <p className="text-[10px] font-medium text-slate-400 italic">Planlanan görsel veya video alanı</p>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] font-bold">👍</span>
                        <span className="font-semibold text-slate-500">Edirne Belediyesi ve 42 diğer kişi</span>
                      </div>
                      <span>12 Yorum</span>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-3 text-center text-xs font-semibold text-slate-500 pt-1">
                      <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-all">
                        <ThumbsUp size={15} />
                        Beğen
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-all">
                        <MessageSquare size={15} />
                        Yorum Yap
                      </button>
                      <button className="flex items-center justify-center gap-1.5 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-all">
                        <Share2 size={15} />
                        Paylaş
                      </button>
                    </div>
                  </div>
                )}

                {/* TikTok Mock Preview */}
                {platform === 'TIKTOK' && (
                  <div className="bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl max-w-[280px] mx-auto aspect-[9/16] relative text-white">
                    {/* Background Video/Image Mock */}
                    {videoUrl ? (
                      <video key={videoUrl} src={getImageUrl(videoUrl)} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-[0.7]" />
                    ) : imageUrl ? (
                      <img key={imageUrl} src={getImageUrl(imageUrl)} alt="Preview" className="w-full h-full object-cover brightness-[0.7]" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-black via-gray-900 to-black flex items-center justify-center p-6 text-center">
                        <div className="space-y-3">
                          <Video className="mx-auto text-gray-600 animate-bounce" size={48} />
                          <p className="text-xs font-semibold text-gray-400 italic">Dikey Video/Görsel Önizlemesi</p>
                        </div>
                      </div>
                    )}

                    {/* Top Headers */}
                    <div className="absolute top-4 left-0 w-full flex justify-center gap-4 text-xs font-bold text-gray-300 z-10">
                      <span className="hover:text-white cursor-pointer">Takip Edilen</span>
                      <span className="text-white border-b-2 border-white pb-0.5 cursor-pointer">Sizin İçin</span>
                    </div>

                    {/* Floating Actions */}
                    <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4 z-10">
                      <div className="relative mb-2">
                        <div className="w-9 h-9 rounded-full bg-white p-0.5">
                          <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white text-[10px] font-bold">E</div>
                        </div>
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border border-white cursor-pointer">+</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center cursor-pointer hover:scale-115 transition-transform">
                          <Heart size={20} className="fill-white stroke-none" />
                        </div>
                        <span className="text-[10px] mt-0.5 font-bold">124.5K</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center cursor-pointer">
                          <MessageCircle size={20} className="fill-white stroke-none" />
                        </div>
                        <span className="text-[10px] mt-0.5 font-bold">4.2K</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center cursor-pointer">
                          <Bookmark size={20} className="fill-white stroke-none" />
                        </div>
                        <span className="text-[10px] mt-0.5 font-bold">950</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center cursor-pointer">
                          <Share2 size={20} className="fill-white stroke-none" />
                        </div>
                        <span className="text-[10px] mt-0.5 font-bold">1.8K</span>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-gray-900 border-4 border-gray-700 flex items-center justify-center animate-spin duration-3000 mt-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                      </div>
                    </div>

                    {/* Bottom Details Overlay */}
                    <div className="absolute bottom-6 left-4 right-14 space-y-2 z-10 text-left">
                      <h4 className="font-bold text-sm">{getAccountUsername()}</h4>
                      <p className="text-xs text-gray-200 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                        {caption || "Gönderi metni..."}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-300 overflow-hidden font-medium">
                        <Music size={12} className="shrink-0" />
                        <span className="animate-marquee whitespace-nowrap">Orijinal Ses - Edirne Gezi Rehberi</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/30">
                      <div className="w-1/3 h-full bg-white" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
