import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  Settings, 
  Save, 
  HelpCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Cpu, 
  Search, 
  Check, 
  FileText, 
  Image as ImageIcon
} from 'lucide-react';

interface AiSettingsData {
  geminiKey?: string;
  geminiUrl?: string;
  openAiKey?: string;
  openAiUrl?: string;
  claudeKey?: string;
  claudeUrl?: string;
  stabilityKey?: string;
  huggingFaceKey?: string;
  defaultTextProvider?: string;
  defaultTextModel?: string;
  defaultImageProvider?: string;
  defaultImageModel?: string;
  customModels?: any[];
}

const AiSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [settings, setSettings] = useState<AiSettingsData>({
    geminiKey: '',
    geminiUrl: 'https://generativelanguage.googleapis.com',
    openAiKey: '',
    openAiUrl: 'https://api.openai.com',
    claudeKey: '',
    claudeUrl: 'https://api.anthropic.com',
    stabilityKey: '',
    huggingFaceKey: '',
    defaultTextProvider: 'gemini',
    defaultTextModel: 'gemini-2.5-flash',
    defaultImageProvider: 'huggingface',
    defaultImageModel: 'flux',
    customModels: [],
  });

  // Custom Model Form state
  const [customModelForm, setCustomModelForm] = useState({
    name: '',
    provider: 'openai', // openai, gemini, claude
    apiKey: '',
    apiUrl: '',
  });

  // Fetched models states grouped by provider key (gemini, openai, claude, or custom ID)
  const [fetchedModels, setFetchedModels] = useState<{ [key: string]: string[] }>({});
  const [fetchingProvider, setFetchingProvider] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.get<AiSettingsData>('/social-media/ai-settings');
      setSettings({
        geminiKey: data.geminiKey || '',
        geminiUrl: data.geminiUrl || 'https://generativelanguage.googleapis.com',
        openAiKey: data.openAiKey || '',
        openAiUrl: data.openAiUrl || 'https://api.openai.com',
        claudeKey: data.claudeKey || '',
        claudeUrl: data.claudeUrl || 'https://api.anthropic.com',
        stabilityKey: data.stabilityKey || '',
        huggingFaceKey: data.huggingFaceKey || '',
        defaultTextProvider: data.defaultTextProvider || 'gemini',
        defaultTextModel: data.defaultTextModel || 'gemini-2.5-flash',
        defaultImageProvider: data.defaultImageProvider || 'huggingface',
        defaultImageModel: data.defaultImageModel || 'flux',
        customModels: Array.isArray(data.customModels) ? data.customModels : [],
      });
    } catch (error) {
      console.error('AI ayarları yüklenirken hata:', error);
      toast.error('AI ayarları sunucudan yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await api.post('/social-media/ai-settings', settings);
      toast.success('Yapay Zeka model ayarları başarıyla güncellendi.');
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      toast.error('Ayarlar kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof AiSettingsData, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Generic fetch models function for both standard and custom providers
  const handleFetchProviderModels = async (providerKey: string, apiUrl: string, apiKey: string, providerType: string) => {
    if (!apiUrl || !apiKey) {
      toast.error('Modelleri çekebilmek için API Adresi (Base URL) ve API Anahtarı girilmelidir.');
      return;
    }

    setFetchingProvider(providerKey);
    try {
      const models = await api.post<string[]>('/social-media/ai-settings/fetch-models', {
        apiUrl,
        apiKey,
        provider: providerType,
      });

      if (models && models.length > 0) {
        setFetchedModels(prev => ({
          ...prev,
          [providerKey]: models
        }));
        toast.success(`"${providerKey.toUpperCase()}" sağlayıcısından ${models.length} adet model başarıyla yüklendi.`);
      } else {
        toast.error('Sağlayıcıdan model listesi alınamadı veya boş döndü.');
      }
    } catch (error: any) {
      console.error('Model getirme hatası:', error);
      toast.error(`Modeller çekilemedi: ${error.message || 'API Hatası'}`);
    } finally {
      setFetchingProvider(null);
    }
  };

  // Add custom model to settings list
  const handleAddCustomModel = () => {
    if (!customModelForm.name.trim() || !customModelForm.apiKey.trim() || !customModelForm.apiUrl.trim()) {
      toast.error('Lütfen tüm özel model bağlantı alanlarını doldurun.');
      return;
    }

    const newModel = {
      id: `custom_${Date.now()}`,
      name: customModelForm.name.trim(),
      provider: customModelForm.provider,
      apiKey: customModelForm.apiKey.trim(),
      apiUrl: customModelForm.apiUrl.trim(),
      selectedModel: '',
      isActive: true,
    };

    const updatedModels = [...(settings.customModels || []), newModel];
    handleInputChange('customModels', updatedModels);
    
    // Clear form
    setCustomModelForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      apiUrl: '',
    });
    toast.success('Özel model listede tanımlandı. API modellerini çekmek için aşağıdaki listeden işlem yapabilirsiniz.');
  };

  // Delete custom model
  const handleDeleteCustomModel = (id: string) => {
    const updated = (settings.customModels || []).filter(m => m.id !== id);
    
    // Reset defaults if deleted
    let newDefaultTextProvider = settings.defaultTextProvider;
    let newDefaultImageProvider = settings.defaultImageProvider;
    if (settings.defaultTextProvider === id) newDefaultTextProvider = 'gemini';
    if (settings.defaultImageProvider === id) newDefaultImageProvider = 'huggingface';

    setSettings(prev => ({
      ...prev,
      customModels: updated,
      defaultTextProvider: newDefaultTextProvider,
      defaultImageProvider: newDefaultImageProvider,
    }));
    toast.success('Özel model kaldırıldı.');
  };

  // Set default models helper
  const handleSetDefaultModel = (type: 'text' | 'image', providerId: string, modelName: string) => {
    if (type === 'text') {
      setSettings(prev => ({
        ...prev,
        defaultTextProvider: providerId,
        defaultTextModel: modelName,
      }));
      toast.success(`Varsayılan Metin Modeli "${modelName}" olarak seçildi.`);
    } else {
      setSettings(prev => ({
        ...prev,
        defaultImageProvider: providerId,
        defaultImageModel: modelName,
      }));
      toast.success(`Varsayılan Görsel Modeli "${modelName}" olarak seçildi.`);
    }
  };

  const getProviderDisplayName = (providerId: string) => {
    if (providerId === 'gemini') return 'Google Gemini';
    if (providerId === 'openai') return 'OpenAI GPT';
    if (providerId === 'claude') return 'Anthropic Claude';
    if (providerId === 'huggingface') return 'Hugging Face';
    if (providerId === 'stability') return 'Stability AI';
    if (providerId === 'simulation') return 'Simülasyon Modu';
    
    const custom = settings.customModels?.find(m => m.id === providerId);
    return custom ? `[Özel] ${custom.name}` : providerId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ayarlar Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-2">
          <Settings className="text-primary animate-spin-slow" size={24} />
          AI Model Ayarları
        </h1>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase font-sans mt-1">
          Yapay zeka modellerinin API anahtarlarını girin, aktif modelleri listeleyin ve varsayılan modeli seçin
        </p>
      </div>

      {/* Varsayılan Aktif Modeller Özeti (Premium Görünüm) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Default Text Model Summary */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 border border-indigo-200/50 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileText size={100} className="text-indigo-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg text-xs font-bold">
                <FileText size={14} />
              </span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Varsayılan Metin Modeli</span>
            </div>
            <h3 className="text-lg font-bold text-indigo-950 font-mono mt-3 break-all">
              {settings.defaultTextModel || 'Seçilmedi'}
            </h3>
          </div>
          <div className="mt-2 text-xs font-semibold text-indigo-800/80 flex items-center justify-between border-t border-indigo-200/40 pt-2">
            <span>Sağlayıcı: <span className="font-bold text-indigo-950">{getProviderDisplayName(settings.defaultTextProvider || '')}</span></span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">Metin</span>
          </div>
        </div>

        {/* Default Image Model Summary */}
        <div className="bg-gradient-to-br from-amber-50/70 to-amber-100/40 border border-amber-200/50 rounded-3xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ImageIcon size={100} className="text-amber-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg text-xs font-bold">
                <ImageIcon size={14} />
              </span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Varsayılan Görsel Modeli</span>
            </div>
            <h3 className="text-lg font-bold text-amber-950 font-mono mt-3 break-all">
              {settings.defaultImageModel || 'Seçilmedi'}
            </h3>
          </div>
          <div className="mt-2 text-xs font-semibold text-amber-800/80 flex items-center justify-between border-t border-amber-200/40 pt-2">
            <span>Sağlayıcı: <span className="font-bold text-amber-950">{getProviderDisplayName(settings.defaultImageProvider || '')}</span></span>
            <span className="text-[10px] bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase">Görsel</span>
          </div>
        </div>
      </div>

      {/* Model Provider Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* 1. Google Gemini */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              Google Gemini
            </h3>
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-md">Standart</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API URL (Base URL)</label>
              <input
                type="text"
                value={settings.geminiUrl}
                onChange={(e) => handleInputChange('geminiUrl', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key (API Anahtarı)</label>
              <input
                type="password"
                value={settings.geminiKey}
                onChange={(e) => handleInputChange('geminiKey', e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={fetchingProvider === 'gemini'}
              onClick={() => handleFetchProviderModels('gemini', settings.geminiUrl || '', settings.geminiKey || '', 'gemini')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {fetchingProvider === 'gemini' ? <RefreshCw className="animate-spin" size={13} /> : <RefreshCw size={13} />}
              Erişilebilir Modelleri Çek
            </button>
          </div>
          {/* Models fetched output */}
          {renderModelsList('gemini', settings.defaultTextProvider === 'gemini' ? settings.defaultTextModel : undefined, settings.defaultImageProvider === 'gemini' ? settings.defaultImageModel : undefined)}
        </div>

        {/* 2. OpenAI */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              OpenAI (GPT)
            </h3>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md">Standart</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API URL (Base URL)</label>
              <input
                type="text"
                value={settings.openAiUrl}
                onChange={(e) => handleInputChange('openAiUrl', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key (API Anahtarı)</label>
              <input
                type="password"
                value={settings.openAiKey}
                onChange={(e) => handleInputChange('openAiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={fetchingProvider === 'openai'}
              onClick={() => handleFetchProviderModels('openai', settings.openAiUrl || '', settings.openAiKey || '', 'openai')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {fetchingProvider === 'openai' ? <RefreshCw className="animate-spin" size={13} /> : <RefreshCw size={13} />}
              Erişilebilir Modelleri Çek
            </button>
          </div>
          {renderModelsList('openai', settings.defaultTextProvider === 'openai' ? settings.defaultTextModel : undefined, settings.defaultImageProvider === 'openai' ? settings.defaultImageModel : undefined)}
        </div>

        {/* 3. Anthropic Claude */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
              Anthropic Claude
            </h3>
            <span className="text-[10px] font-bold bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md">Standart</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API URL (Base URL)</label>
              <input
                type="text"
                value={settings.claudeUrl}
                onChange={(e) => handleInputChange('claudeUrl', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Key (API Anahtarı)</label>
              <input
                type="password"
                value={settings.claudeKey}
                onChange={(e) => handleInputChange('claudeKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={fetchingProvider === 'claude'}
              onClick={() => handleFetchProviderModels('claude', settings.claudeUrl || '', settings.claudeKey || '', 'claude')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              {fetchingProvider === 'claude' ? <RefreshCw className="animate-spin" size={13} /> : <RefreshCw size={13} />}
              Erişilebilir Modelleri Çek
            </button>
          </div>
          {renderModelsList('claude', settings.defaultTextProvider === 'claude' ? settings.defaultTextModel : undefined, settings.defaultImageProvider === 'claude' ? settings.defaultImageModel : undefined)}
        </div>

        {/* 4. Custom Model Definitions */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <Plus className="text-violet-500" size={18} />
              Özel OpenAI Uyumlu Sağlayıcı Ekle
            </h3>
            <span className="text-[10px] font-bold bg-violet-500/10 text-violet-600 px-2 py-0.5 rounded-md">Özel Tanım</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sağlayıcı İsmi</label>
              <input
                type="text"
                value={customModelForm.name}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Örn: DeepSeek, OpenRouter, Yerel Llama..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Tipi Uyum Protokolü</label>
              <select
                value={customModelForm.provider}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, provider: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="openai">OpenAI Uyumlu API</option>
                <option value="gemini">Google Gemini API Uyumlu</option>
                <option value="claude">Anthropic Claude API Uyumlu</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Base URL</label>
              <input
                type="text"
                value={customModelForm.apiUrl}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="Örn: https://api.deepseek.com veya http://localhost:1234"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Anahtarı (API Key)</label>
              <input
                type="password"
                value={customModelForm.apiKey}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>

            <div className="md:col-span-2 flex justify-end pt-2">
              <button
                type="button"
                onClick={handleAddCustomModel}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-750 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all"
              >
                <Plus size={14} />
                Özel Sağlayıcıyı Tanımla
              </button>
            </div>
          </div>

          {/* Tanımlı Özel Modeller Listesi */}
          {settings.customModels && settings.customModels.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Tanımlı Özel Sağlayıcılar</h4>
              <div className="space-y-4">
                {settings.customModels.map((model) => (
                  <div key={model.id} className="p-4 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 text-sm">{model.name}</span>
                        <span className="ml-2 text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {model.provider}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={fetchingProvider === model.id}
                          onClick={() => handleFetchProviderModels(model.id, model.apiUrl || '', model.apiKey || '', model.provider)}
                          className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-750 text-[10px] font-bold py-1 px-3 rounded-lg"
                        >
                          {fetchingProvider === model.id ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />}
                          Modelleri Çek
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomModel(model.id)}
                          className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{model.apiUrl}</div>
                    
                    {renderModelsList(model.id, settings.defaultTextProvider === model.id ? settings.defaultTextModel : undefined, settings.defaultImageProvider === model.id ? settings.defaultImageModel : undefined)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Görsel Üretim Servisleri (Stability AI & Hugging Face) */}
        <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
              <ImageIcon size={18} className="text-amber-500" />
              Diğer Servisler & Görsel Üreticiler
            </h3>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md">API Key</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stability AI API Key</label>
              <input
                type="password"
                value={settings.stabilityKey}
                onChange={(e) => handleInputChange('stabilityKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hugging Face Token</label>
              <input
                type="password"
                value={settings.huggingFaceKey}
                onChange={(e) => handleInputChange('huggingFaceKey', e.target.value)}
                placeholder="hf_..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t border-slate-100 flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Varsayılan Görsel Model İsmi / ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.defaultImageModel}
                  onChange={(e) => handleInputChange('defaultImageModel', e.target.value)}
                  placeholder="Örn: flux veya sdxl"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                />
                <select
                  value={settings.defaultImageProvider}
                  onChange={(e) => handleInputChange('defaultImageProvider', e.target.value)}
                  className="w-[140px] px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="huggingface">Hugging Face</option>
                  <option value="stability">Stability AI</option>
                  <option value="dalle">OpenAI DALL-E 3</option>
                  <option value="simulation">Simülasyon</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Box */}
      <div className="bg-primary/[0.02] border border-primary/10 p-4 rounded-2xl flex gap-3">
        <HelpCircle size={18} className="text-primary shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-500">
          <span className="font-bold text-slate-800 block">Kullanım İpucu</span>
          Erişilebilir modelleri listeledikten sonra, kullanmak istediğiniz modelin yanındaki <span className="font-bold text-indigo-600">"Varsayılan Metin"</span> veya <span className="font-bold text-amber-600">"Varsayılan Görsel"</span> butonuna tıklayarak varsayılan tercihlerinizi anında güncelleyebilirsiniz. Tüm değişiklikleri kaydetmek için en alttaki **"Ayarları Kaydet"** butonuna tıklamayı unutmayın.
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-3">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-orange-500/10 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-98 text-sm"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save size={16} />
              Ayarları Kaydet
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Helper function to render a searchable and action-oriented model list
  function renderModelsList(providerKey: string, defaultTextModel?: string, defaultImageModel?: string) {
    const list = fetchedModels[providerKey] || [];
    if (list.length === 0) return null;

    const query = searchQueries[providerKey] || '';
    const filteredList = list.filter(modelName => 
      modelName.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="mt-3 p-4 bg-slate-50/70 border border-slate-200/50 rounded-2xl space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu size={12} className="text-primary" />
            Erişilebilir Modeller ({list.length})
          </h4>
          {/* Search box */}
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
            <input
              type="text"
              value={query}
              onChange={(e) => setSearchQueries(prev => ({ ...prev, [providerKey]: e.target.value }))}
              placeholder="Model ara..."
              className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-xl bg-white divide-y divide-slate-100 scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 font-medium italic">
              Arama sonucuna uygun model bulunamadı.
            </div>
          ) : (
            filteredList.map((modelName) => {
              const isDefaultText = defaultTextModel === modelName;
              const isDefaultImage = defaultImageModel === modelName;

              return (
                <div key={modelName} className="p-2.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                  <span className="font-mono text-xs font-semibold text-slate-750 break-all">{modelName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Status badge if it is default */}
                    {(isDefaultText || isDefaultImage) && (
                      <span className="text-[9px] font-extrabold bg-green-50 text-green-600 border border-green-200 rounded px-1.5 py-0.5 flex items-center gap-0.5 mr-1">
                        <Check size={9} /> VARSAYILAN
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSetDefaultModel('text', providerKey, modelName)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        isDefaultText
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      Varsayılan Metin
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => handleSetDefaultModel('image', providerKey, modelName)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        isDefaultImage
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600'
                      }`}
                    >
                      Varsayılan Görsel
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
};

export default AiSettings;
