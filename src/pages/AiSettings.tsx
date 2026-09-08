import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Cpu, 
  FileText, 
  Image as ImageIcon,
  Video,
  Key,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Edit3,
  Check,
  X
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
  groqKey?: string;
  groqUrl?: string;
  grokKey?: string;
  grokUrl?: string;
  falKey?: string;
  falUrl?: string;
  nvidiaKey?: string;
  nvidiaUrl?: string;
  defaultTextProvider?: string;
  defaultTextModel?: string;
  fallbackTextProvider?: string;
  fallbackTextModel?: string;
  defaultImageProvider?: string;
  defaultImageModel?: string;
  fallbackImageProvider?: string;
  fallbackImageModel?: string;
  defaultVideoProvider?: string;
  defaultVideoModel?: string;
  fallbackVideoProvider?: string;
  fallbackVideoModel?: string;
  customModels?: any[];
  huggingFaceModels?: string[];
}

const KNOWN_MODELS: Record<string, { text?: string[]; image?: string[]; video?: string[] }> = {
  gemini: {
    text: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
    image: ['imagen-4.0-generate-001', 'imagen-3.0-generate-002'],
  },
  openai: {
    text: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-preview', 'gpt-4-turbo'],
    image: ['dall-e-3', 'dall-e-2'],
  },
  claude: {
    text: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  },
  nvidia: {
    text: ['meta/llama-3.3-70b-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct', 'mistralai/mistral-large-2-instruct', 'deepseek-ai/deepseek-r1'],
  },
  groq: {
    text: ['llama-3.3-70b-versatile', 'deepseek-r1-distill-llama-70b', 'mixtral-8x7b-32768', 'llama-3.1-8b-instant'],
    image: ['black-forest-labs/FLUX.1-schnell'],
  },
  grok: {
    text: ['grok-2-latest', 'grok-vision-beta'],
    image: ['grok-imagine-image-quality'],
  },
  stability: {
    image: ['stable-diffusion-xl-1024-v1-0', 'sd3-medium', 'stable-image-ultra'],
  },
  huggingface: {
    image: [
      'stabilityai/stable-diffusion-2-1',
      'runwayml/stable-diffusion-v1-5',
      'prompthero/openjourney',
      'CompVis/stable-diffusion-v1-4',
      'segmind/SSD-1B',
      'stabilityai/sdxl-turbo',
      'black-forest-labs/FLUX.1-schnell',
      'black-forest-labs/FLUX.1-dev',
    ],
  },
  fal: {
    image: ['fal-ai/flux/schnell', 'fal-ai/flux/dev', 'fal-ai/fast-sdxl'],
    video: ['fal-ai/minimax/video-01', 'fal-ai/hunyuan-video', 'fal-ai/runway-gen3/turbo'],
  },
  runway: {
    video: ['gen2', 'gen3a_turbo'],
  },
  pika: {
    video: ['pika-1.0'],
  },
  simulation: {
    text: ['simulation'],
    image: ['simulation'],
    video: ['simulation'],
  },
};

const DEFAULT_HF_MODELS = [
  'stabilityai/stable-diffusion-2-1',
  'runwayml/stable-diffusion-v1-5',
  'prompthero/openjourney',
  'CompVis/stable-diffusion-v1-4',
  'segmind/SSD-1B',
  'stabilityai/sdxl-turbo',
  'black-forest-labs/FLUX.1-schnell',
];

// Popular defaults for OpenRouter / generic custom endpoints
const CUSTOM_DEFAULT_MODELS = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'deepseek/deepseek-r1',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-001',
];

const AiSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'models' | 'keys' | 'custom'>('models');
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
    groqKey: '',
    groqUrl: 'https://api.groq.com',
    grokKey: '',
    grokUrl: 'https://api.x.ai',
    falKey: '',
    falUrl: 'https://fal.run',
    nvidiaKey: '',
    nvidiaUrl: 'https://integrate.api.nvidia.com/v1',
    defaultTextProvider: 'gemini',
    defaultTextModel: 'gemini-2.5-flash',
    fallbackTextProvider: 'openai',
    fallbackTextModel: 'gpt-4o-mini',
    defaultImageProvider: 'huggingface',
    defaultImageModel: 'stabilityai/stable-diffusion-2-1',
    fallbackImageProvider: 'gemini',
    fallbackImageModel: 'imagen-4.0-generate-001',
    defaultVideoProvider: 'fal',
    defaultVideoModel: 'fal-ai/minimax/video-01',
    fallbackVideoProvider: 'simulation',
    fallbackVideoModel: 'simulation',
    customModels: [],
    huggingFaceModels: [],
  });

  // Hugging Face Models state
  const [newHfModel, setNewHfModel] = useState<string>('');

  // Custom Model Form state (Creation)
  const [customModelForm, setCustomModelForm] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    apiUrl: '',
  });

  // Custom Model Editing state
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState({
    name: '',
    provider: 'openai',
    apiKey: '',
    apiUrl: '',
  });

  // Fetched models states grouped by provider key
  const [fetchedModels, setFetchedModels] = useState<{ [key: string]: string[] }>({});
  const [fetchingProvider, setFetchingProvider] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.get<AiSettingsData>('/social-media/ai-settings');
      const loadedCustomModels = Array.isArray(data.customModels) ? data.customModels : [];
      
      const initialFetched: Record<string, string[]> = {};
      loadedCustomModels.forEach((m: any) => {
        if (m.id && Array.isArray(m.models) && m.models.length > 0) {
          initialFetched[m.id] = m.models;
        }
      });
      setFetchedModels(initialFetched);

      setSettings({
        geminiKey: data.geminiKey || '',
        geminiUrl: data.geminiUrl || 'https://generativelanguage.googleapis.com',
        openAiKey: data.openAiKey || '',
        openAiUrl: data.openAiUrl || 'https://api.openai.com',
        claudeKey: data.claudeKey || '',
        claudeUrl: data.claudeUrl || 'https://api.anthropic.com',
        stabilityKey: data.stabilityKey || '',
        huggingFaceKey: data.huggingFaceKey || '',
        groqKey: data.groqKey || '',
        groqUrl: data.groqUrl || 'https://api.groq.com',
        grokKey: data.grokKey || '',
        grokUrl: data.grokUrl || 'https://api.x.ai',
        falKey: data.falKey || '',
        falUrl: data.falUrl || 'https://fal.run',
        nvidiaKey: data.nvidiaKey || '',
        nvidiaUrl: data.nvidiaUrl || 'https://integrate.api.nvidia.com/v1',
        defaultTextProvider: data.defaultTextProvider || 'gemini',
        defaultTextModel: data.defaultTextModel || 'gemini-2.5-flash',
        fallbackTextProvider: data.fallbackTextProvider || 'openai',
        fallbackTextModel: data.fallbackTextModel || 'gpt-4o-mini',
        defaultImageProvider: data.defaultImageProvider || 'huggingface',
        defaultImageModel: data.defaultImageModel || 'stabilityai/stable-diffusion-2-1',
        fallbackImageProvider: data.fallbackImageProvider || 'gemini',
        fallbackImageModel: data.fallbackImageModel || 'imagen-4.0-generate-001',
        defaultVideoProvider: data.defaultVideoProvider || 'fal',
        defaultVideoModel: data.defaultVideoModel || 'fal-ai/minimax/video-01',
        fallbackVideoProvider: data.fallbackVideoProvider || 'simulation',
        fallbackVideoModel: data.fallbackVideoModel || 'simulation',
        customModels: loadedCustomModels,
        huggingFaceModels: (Array.isArray(data.huggingFaceModels) && data.huggingFaceModels.length > 0)
          ? data.huggingFaceModels
          : DEFAULT_HF_MODELS,
      });

      // Auto fetch models for custom providers if models array is empty
      loadedCustomModels.forEach((m: any) => {
        if (m.id && (!m.models || m.models.length === 0) && m.apiUrl && m.apiKey) {
          handleFetchProviderModels(m.id, m.apiUrl, m.apiKey, m.provider);
        }
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
      toast.success('Yapay Zeka model tercihleri başarıyla kaydedildi.');
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

  const handleClearApiKey = (keyName: keyof AiSettingsData, providerLabel: string) => {
    handleInputChange(keyName, '');
    toast.success(`${providerLabel} API anahtarı temizlendi.`);
  };

  const handleFetchProviderModels = async (providerKey: string, apiUrl: string, apiKey: string, providerType: string) => {
    if (!apiUrl || !apiKey) {
      toast.error('Modelleri çekebilmek için API Adresi ve API Anahtarı girilmelidir.');
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

        setSettings(prev => ({
          ...prev,
          customModels: (prev.customModels || []).map(m => 
            m.id === providerKey ? { ...m, models } : m
          )
        }));

        toast.success(`Modeller başarıyla çekildi (${models.length} adet).`);
      } else {
        toast.error('Sağlayıcıdan model listesi alınamadı.');
      }
    } catch (error: any) {
      console.error('Model getirme hatası:', error);
      toast.error(`Modeller çekilemedi: ${error.message || 'API Hatası'}`);
    } finally {
      setFetchingProvider(null);
    }
  };

  const handleProviderChange = (
    category: 'text' | 'image' | 'video',
    providerField: keyof AiSettingsData,
    modelField: keyof AiSettingsData,
    newProviderId: string
  ) => {
    const customMatch = (settings.customModels || []).find(m => m.id === newProviderId);
    let available: string[] = [];

    if (newProviderId === 'huggingface' && category === 'image') {
      available = (settings.huggingFaceModels && settings.huggingFaceModels.length > 0)
        ? settings.huggingFaceModels
        : DEFAULT_HF_MODELS;
    } else if (customMatch) {
      if (fetchedModels[newProviderId] && fetchedModels[newProviderId].length > 0) {
        available = fetchedModels[newProviderId];
      } else if (customMatch.models && Array.isArray(customMatch.models) && customMatch.models.length > 0) {
        available = customMatch.models;
      } else {
        available = CUSTOM_DEFAULT_MODELS;
      }
      if (!fetchedModels[newProviderId] && (!customMatch.models || customMatch.models.length === 0) && customMatch.apiUrl && customMatch.apiKey) {
        handleFetchProviderModels(customMatch.id, customMatch.apiUrl, customMatch.apiKey, customMatch.provider);
      }
    } else if (KNOWN_MODELS[newProviderId] && KNOWN_MODELS[newProviderId][category]) {
      available = KNOWN_MODELS[newProviderId][category] || [];
    }

    const firstModel = available[0] || '';

    setSettings(prev => ({
      ...prev,
      [providerField]: newProviderId,
      [modelField]: firstModel,
    }));
  };

  const handleAddCustomModel = () => {
    if (!customModelForm.name.trim() || !customModelForm.apiKey.trim() || !customModelForm.apiUrl.trim()) {
      toast.error('Lütfen tüm özel model alanlarını doldurun.');
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
    
    setCustomModelForm({
      name: '',
      provider: 'openai',
      apiKey: '',
      apiUrl: '',
    });
    toast.success('Özel model sağlayıcı eklendi.');
  };

  const handleStartEditCustom = (model: any) => {
    setEditingCustomId(model.id);
    setEditingForm({
      name: model.name || '',
      provider: model.provider || 'openai',
      apiKey: model.apiKey || '',
      apiUrl: model.apiUrl || '',
    });
  };

  const handleSaveEditCustom = (id: string) => {
    if (!editingForm.name.trim() || !editingForm.apiKey.trim() || !editingForm.apiUrl.trim()) {
      toast.error('Lütfen alanları boş bırakmayın.');
      return;
    }

    const updated = (settings.customModels || []).map(m => {
      if (m.id === id) {
        return {
          ...m,
          name: editingForm.name.trim(),
          provider: editingForm.provider,
          apiKey: editingForm.apiKey.trim(),
          apiUrl: editingForm.apiUrl.trim(),
        };
      }
      return m;
    });

    handleInputChange('customModels', updated);
    setEditingCustomId(null);
    toast.success('Özel sağlayıcı güncellendi.');
  };

  const handleDeleteCustomModel = (id: string) => {
    const updated = (settings.customModels || []).filter(m => m.id !== id);
    setSettings(prev => ({
      ...prev,
      customModels: updated,
    }));
    toast.success('Özel model sağlayıcı kaldırıldı.');
  };

  const handleAddHfModel = () => {
    if (!newHfModel.trim()) {
      toast.error('Geçerli bir Hugging Face model ismi girin.');
      return;
    }
    const modelName = newHfModel.trim();
    if (settings.huggingFaceModels?.includes(modelName)) {
      toast.error('Bu model zaten ekli.');
      return;
    }
    const updated = [...(settings.huggingFaceModels || []), modelName];
    setSettings(prev => ({
      ...prev,
      huggingFaceModels: updated
    }));
    setNewHfModel('');
    toast.success('Hugging Face modeli kütüphaneye eklendi.');
  };

  const handleDeleteHfModel = (modelName: string) => {
    const updated = (settings.huggingFaceModels || []).filter(m => m !== modelName);
    setSettings(prev => ({
      ...prev,
      huggingFaceModels: updated,
    }));
    toast.success('Model listeden kaldırıldı.');
  };

  const handleResetDefaultHfModels = () => {
    setSettings(prev => ({
      ...prev,
      huggingFaceModels: DEFAULT_HF_MODELS,
    }));
    toast.success('Varsayılan Hugging Face modelleri kütüphaneye yüklendi.');
  };

  const textProviders = [
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'openai', name: 'OpenAI (GPT)' },
    { id: 'claude', name: 'Anthropic Claude' },
    { id: 'nvidia', name: 'NVIDIA AI (Nim)' },
    { id: 'groq', name: 'Groq AI' },
    { id: 'grok', name: 'Grok (xAI)' },
    { id: 'simulation', name: 'Simülasyon Modu' },
    ...(settings.customModels || []).map(m => ({ id: m.id, name: `[Özel] ${m.name}` }))
  ];

  const imageProviders = [
    { id: 'huggingface', name: 'Hugging Face' },
    { id: 'gemini', name: 'Google Imagen (Gemini)' },
    { id: 'dalle', name: 'OpenAI DALL-E 3' },
    { id: 'stability', name: 'Stability AI' },
    { id: 'groq', name: 'Groq (FLUX)' },
    { id: 'grok', name: 'Grok Imagine (xAI)' },
    { id: 'fal', name: 'fal.ai (FLUX)' },
    { id: 'simulation', name: 'Simülasyon' },
    ...(settings.customModels || []).map(m => ({ id: m.id, name: `[Özel] ${m.name}` }))
  ];

  const videoProviders = [
    { id: 'fal', name: 'fal.ai (Minimax / Hunyuan)' },
    { id: 'runway', name: 'Runway ML' },
    { id: 'pika', name: 'Pika Labs' },
    { id: 'simulation', name: 'Simülasyon Modu' },
  ];

  // Helper to render Model Selector with Auto-Dropdown & Custom Model Support
  const renderModelSelector = (
    category: 'text' | 'image' | 'video',
    providerKey: string | undefined,
    currentValue: string | undefined,
    onValueChange: (val: string) => void
  ) => {
    const key = providerKey || '';
    let knownList: string[] = [];

    // Check if key corresponds to a Custom Model
    const customMatch = (settings.customModels || []).find(m => m.id === key);

    if (key === 'huggingface' && category === 'image') {
      const userHfList = (settings.huggingFaceModels && settings.huggingFaceModels.length > 0)
        ? settings.huggingFaceModels
        : DEFAULT_HF_MODELS;
      knownList = Array.from(new Set([...userHfList, ...DEFAULT_HF_MODELS, ...(KNOWN_MODELS.huggingface?.image || [])]));
    } else if (customMatch) {
      // Use fetched models if available, else saved models on custom provider, else custom default models
      if (fetchedModels[key] && fetchedModels[key].length > 0) {
        knownList = fetchedModels[key];
      } else if (customMatch.models && Array.isArray(customMatch.models) && customMatch.models.length > 0) {
        knownList = customMatch.models;
      } else {
        knownList = CUSTOM_DEFAULT_MODELS;
      }
    } else if (KNOWN_MODELS[key] && KNOWN_MODELS[key][category]) {
      knownList = KNOWN_MODELS[key][category] || [];
    }

    if (fetchedModels[key] && fetchedModels[key].length > 0) {
      const merged = Array.from(new Set([...knownList, ...fetchedModels[key]]));
      knownList = merged;
    }

    // MANDATORY FIX: Always ensure currentValue is present in knownList if non-empty, preventing option drops or unexpected __custom__ resets!
    if (currentValue && currentValue.trim() !== '' && currentValue !== '__custom__' && !knownList.includes(currentValue)) {
      knownList = [currentValue, ...knownList];
    }

    const isCustomValue = currentValue === '';

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Model ID / İsmi</label>
          
          {customMatch && (
            <button
              type="button"
              disabled={fetchingProvider === customMatch.id}
              onClick={() => handleFetchProviderModels(customMatch.id, customMatch.apiUrl, customMatch.apiKey, customMatch.provider)}
              className="text-[10px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded transition-all"
            >
              <RefreshCw className={fetchingProvider === customMatch.id ? 'animate-spin' : ''} size={10} />
              Modelleri Çek
            </button>
          )}
        </div>
        
        {knownList.length > 0 ? (
          <div className="space-y-1.5">
            <select
              value={isCustomValue ? '__custom__' : (currentValue || knownList[0] || '')}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  onValueChange('');
                } else {
                  onValueChange(e.target.value);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary"
            >
              {knownList.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
              <option value="__custom__">✏️ [Özel Model ID Yaz...]</option>
            </select>

            {(isCustomValue || currentValue === '') && (
              <input
                type="text"
                value={currentValue || ''}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder="Özel model kimliğini girin..."
                className="w-full px-3 py-2 bg-white border border-primary/30 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="Model kimliğini buraya yazın..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-primary"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <span className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Yapay Zeka Ayarları Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pt-2 pb-24 animate-fadeIn">
      {/* Top Header Box - Safe padding and height so save button is NEVER clipped */}
      <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-1.5 max-w-2xl">
          <h1 className="text-2xl font-bold font-display text-slate-800 flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Cpu size={22} />
            </div>
            Yapay Zeka Model & Entegrasyon Yönetimi
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Metin, Görsel ve Video üretimi için Ana & Yedek model tercihlerini belirleyin ve API bağlantılarını yönetin.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-7 rounded-2xl shadow-md shadow-orange-500/20 active:scale-98 disabled:opacity-50 transition-all text-xs"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin" size={15} />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={15} />
                Tüm Ayarları Kaydet
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-slate-100/70 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('models')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'models'
              ? 'bg-white text-primary shadow-sm border border-slate-200/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Zap size={16} />
          1. Model Tercihleri (Ana & Yedek)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keys')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'keys'
              ? 'bg-white text-primary shadow-sm border border-slate-200/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Key size={16} />
          2. API Anahtarları & Bağlantılar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'custom'
              ? 'bg-white text-primary shadow-sm border border-slate-200/50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers size={16} />
          3. Özel Modeller & Kütüphane
        </button>
      </div>

      {/* TAB 1: MODEL TERCIHLERİ (ANA & YEDEK) */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex items-start gap-3">
            <Sparkles className="text-primary shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-800">Akıllı Model Yedekleme (Fallback Mechanism):</span>
              <br />
              Seçilen **Ana Model** yanıt veremezse, API kotası dolarsa veya erişim hatası oluşursa, sistem içeriğin kesintisiz üretilmesi için otomatik olarak belirlediğiniz **Yedek Model**'e geçer.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* 1. METIN URETIMI */}
            <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-800">1. Metin Üretim Modeli (Text Generation)</h3>
                    <p className="text-[11px] text-slate-500">Gönderi metni ve alt yazıları için kullanılacak yapay zeka</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">METIN</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ana Metin Modeli */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      Ana Metin Modeli (Primary)
                    </label>
                    <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">BİRİNCİL</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.defaultTextProvider}
                      onChange={(e) => handleProviderChange('text', 'defaultTextProvider', 'defaultTextModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                    >
                      {textProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'text',
                    settings.defaultTextProvider,
                    settings.defaultTextModel,
                    (val) => handleInputChange('defaultTextModel', val)
                  )}
                </div>

                {/* Yedek Metin Modeli */}
                <div className="bg-amber-50/40 border border-amber-200/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Yedek Metin Modeli (Fallback)
                    </label>
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">YEDEK</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.fallbackTextProvider || 'openai'}
                      onChange={(e) => handleProviderChange('text', 'fallbackTextProvider', 'fallbackTextModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      {textProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'text',
                    settings.fallbackTextProvider,
                    settings.fallbackTextModel,
                    (val) => handleInputChange('fallbackTextModel', val)
                  )}
                </div>
              </div>
            </div>

            {/* 2. GORSEL URETIMI */}
            <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <ImageIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-800">2. Görsel Üretim Modeli (Image Generation)</h3>
                    <p className="text-[11px] text-slate-500">Gönderiler ve hikayeler için yapay zeka ile görsel üretimi</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">GORSEL</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ana Görsel Modeli */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Ana Görsel Modeli (Primary)
                    </label>
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">BİRİNCİL</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.defaultImageProvider}
                      onChange={(e) => handleProviderChange('image', 'defaultImageProvider', 'defaultImageModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      {imageProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'image',
                    settings.defaultImageProvider,
                    settings.defaultImageModel,
                    (val) => handleInputChange('defaultImageModel', val)
                  )}
                </div>

                {/* Yedek Görsel Modeli */}
                <div className="bg-amber-50/40 border border-amber-200/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                      Yedek Görsel Modeli (Fallback)
                    </label>
                    <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">YEDEK</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.fallbackImageProvider || 'gemini'}
                      onChange={(e) => handleProviderChange('image', 'fallbackImageProvider', 'fallbackImageModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
                    >
                      {imageProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'image',
                    settings.fallbackImageProvider,
                    settings.fallbackImageModel,
                    (val) => handleInputChange('fallbackImageModel', val)
                  )}
                </div>
              </div>
            </div>

            {/* 3. VIDEO URETIMI */}
            <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                    <Video size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-slate-800">3. Video Üretim Modeli (Video Generation)</h3>
                    <p className="text-[11px] text-slate-500">Reels ve kısa videolar için yapay zeka video üreticisi</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">VIDEO</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ana Video Modeli */}
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-rose-600 rounded-full"></span>
                      Ana Video Modeli (Primary)
                    </label>
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">BİRİNCİL</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.defaultVideoProvider || 'fal'}
                      onChange={(e) => handleProviderChange('video', 'defaultVideoProvider', 'defaultVideoModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                    >
                      {videoProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'video',
                    settings.defaultVideoProvider,
                    settings.defaultVideoModel,
                    (val) => handleInputChange('defaultVideoModel', val)
                  )}
                </div>

                {/* Yedek Video Modeli */}
                <div className="bg-rose-50/30 border border-rose-200/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                      Yedek Video Modeli (Fallback)
                    </label>
                    <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">YEDEK</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı</label>
                    <select
                      value={settings.fallbackVideoProvider || 'simulation'}
                      onChange={(e) => handleProviderChange('video', 'fallbackVideoProvider', 'fallbackVideoModel', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500"
                    >
                      {videoProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderModelSelector(
                    'video',
                    settings.fallbackVideoProvider,
                    settings.fallbackVideoModel,
                    (val) => handleInputChange('fallbackVideoModel', val)
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: API ANAHTARLARI & BAĞLANTILAR */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                <Key className="text-primary" size={18} />
                Standart AI Servis API Anahtarları
              </h3>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">API KEYS</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Google Gemini */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                    Google Gemini
                  </h4>
                  {settings.geminiKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.geminiUrl}
                    onChange={(e) => handleInputChange('geminiUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.geminiKey}
                      onChange={(e) => handleInputChange('geminiKey', e.target.value)}
                      placeholder="AIzaSy..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.geminiKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('geminiKey', 'Google Gemini')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fetchingProvider === 'gemini'}
                  onClick={() => handleFetchProviderModels('gemini', settings.geminiUrl || '', settings.geminiKey || '', 'gemini')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  <RefreshCw className={fetchingProvider === 'gemini' ? 'animate-spin' : ''} size={13} />
                  Modelleri Çek
                </button>
              </div>

              {/* OpenAI */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                    OpenAI (GPT)
                  </h4>
                  {settings.openAiKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.openAiUrl}
                    onChange={(e) => handleInputChange('openAiUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.openAiKey}
                      onChange={(e) => handleInputChange('openAiKey', e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.openAiKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('openAiKey', 'OpenAI')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fetchingProvider === 'openai'}
                  onClick={() => handleFetchProviderModels('openai', settings.openAiUrl || '', settings.openAiKey || '', 'openai')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  <RefreshCw className={fetchingProvider === 'openai' ? 'animate-spin' : ''} size={13} />
                  Modelleri Çek
                </button>
              </div>

              {/* Anthropic Claude */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                    Anthropic Claude
                  </h4>
                  {settings.claudeKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.claudeUrl}
                    onChange={(e) => handleInputChange('claudeUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.claudeKey}
                      onChange={(e) => handleInputChange('claudeKey', e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.claudeKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('claudeKey', 'Anthropic Claude')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fetchingProvider === 'claude'}
                  onClick={() => handleFetchProviderModels('claude', settings.claudeUrl || '', settings.claudeKey || '', 'claude')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  <RefreshCw className={fetchingProvider === 'claude' ? 'animate-spin' : ''} size={13} />
                  Modelleri Çek
                </button>
              </div>

              {/* NVIDIA AI (Nim) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-green-600 rounded-full"></span>
                    NVIDIA AI (Nim)
                  </h4>
                  {settings.nvidiaKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.nvidiaUrl || 'https://integrate.api.nvidia.com/v1'}
                    onChange={(e) => handleInputChange('nvidiaUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.nvidiaKey || ''}
                      onChange={(e) => handleInputChange('nvidiaKey', e.target.value)}
                      placeholder="nvapi-..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.nvidiaKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('nvidiaKey', 'NVIDIA AI')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fetchingProvider === 'nvidia'}
                  onClick={() => handleFetchProviderModels('nvidia', settings.nvidiaUrl || 'https://integrate.api.nvidia.com/v1', settings.nvidiaKey || '', 'openai')}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2 rounded-xl transition-all"
                >
                  <RefreshCw className={fetchingProvider === 'nvidia' ? 'animate-spin' : ''} size={13} />
                  Modelleri Çek
                </button>
              </div>

              {/* Groq AI */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full"></span>
                    Groq AI
                  </h4>
                  {settings.groqKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.groqUrl}
                    onChange={(e) => handleInputChange('groqUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.groqKey}
                      onChange={(e) => handleInputChange('groqKey', e.target.value)}
                      placeholder="gsk_..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.groqKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('groqKey', 'Groq AI')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grok (xAI) */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-black rounded-full"></span>
                    Grok (xAI)
                  </h4>
                  {settings.grokKey ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base URL</label>
                  <input
                    type="text"
                    value={settings.grokUrl}
                    onChange={(e) => handleInputChange('grokUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.grokKey}
                      onChange={(e) => handleInputChange('grokKey', e.target.value)}
                      placeholder="xai-..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.grokKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('grokKey', 'Grok')}
                        title="API Anahtarını Sil/Temizle"
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-all text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 size={13} /> Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stability AI & fal.ai */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full"></span>
                    Stability AI & fal.ai & Hugging Face
                  </h4>
                  {(settings.stabilityKey || settings.falKey || settings.huggingFaceKey) ? (
                    <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck size={10} /> BAĞLI
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">TANIMSIZ</span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stability AI Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.stabilityKey}
                      onChange={(e) => handleInputChange('stabilityKey', e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.stabilityKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('stabilityKey', 'Stability AI')}
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 text-xs font-bold"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">fal.ai Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.falKey}
                      onChange={(e) => handleInputChange('falKey', e.target.value)}
                      placeholder="fal_..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.falKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('falKey', 'fal.ai')}
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 text-xs font-bold"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hugging Face Token</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={settings.huggingFaceKey}
                      onChange={(e) => handleInputChange('huggingFaceKey', e.target.value)}
                      placeholder="hf_..."
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                    />
                    {settings.huggingFaceKey && (
                      <button
                        type="button"
                        onClick={() => handleClearApiKey('huggingFaceKey', 'Hugging Face')}
                        className="px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 text-xs font-bold"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 3: OZEL MODELLER & KUTUPHANE */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          {/* Özel Model Ekleme Formu */}
          <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                <Plus className="text-violet-500" size={18} />
                Özel OpenAI / Gemini / Claude Uyumlu API Ekle
              </h3>
              <span className="text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-lg">ÖZEL API</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sağlayıcı İsmi</label>
                <input
                  type="text"
                  value={customModelForm.name}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Örn: OpenRouter, DeepSeek, Yerel Ollama..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Uyum Tipi</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Base URL</label>
                <input
                  type="text"
                  value={customModelForm.apiUrl}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                  placeholder="Örn: https://openrouter.ai/api/v1 veya http://localhost:11434"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Key</label>
                <input
                  type="password"
                  value={customModelForm.apiKey}
                  onChange={(e) => setCustomModelForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                />
              </div>

              <div className="md:col-span-2 flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddCustomModel}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all shadow-sm"
                >
                  <Plus size={14} />
                  Özel Sağlayıcıyı Kaydet
                </button>
              </div>
            </div>

            {/* Tanımlı Özel Modeller - Düzenleme ve Model Çekme Özellikleri ile */}
            {settings.customModels && settings.customModels.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kayıtlı Özel Sağlayıcılar ({settings.customModels.length})</h4>
                <div className="space-y-4">
                  {settings.customModels.map((model) => {
                    const isEditing = editingCustomId === model.id;

                    return (
                      <div key={model.id} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3 shadow-sm">
                        {isEditing ? (
                          /* Inline Edit Mode */
                          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-800">Özel Sağlayıcıyı Düzenle</span>
                              <button
                                type="button"
                                onClick={() => setEditingCustomId(null)}
                                className="text-slate-400 hover:text-slate-700 p-1"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Sağlayıcı Adı</label>
                                <input
                                  type="text"
                                  value={editingForm.name}
                                  onChange={(e) => setEditingForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Uyum Protokolü</label>
                                <select
                                  value={editingForm.provider}
                                  onChange={(e) => setEditingForm(prev => ({ ...prev, provider: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                                >
                                  <option value="openai">OpenAI Uyumlu</option>
                                  <option value="gemini">Gemini Uyumlu</option>
                                  <option value="claude">Claude Uyumlu</option>
                                </select>
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Base URL</label>
                                <input
                                  type="text"
                                  value={editingForm.apiUrl}
                                  onChange={(e) => setEditingForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                />
                              </div>
                              <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">API Key</label>
                                <input
                                  type="password"
                                  value={editingForm.apiKey}
                                  onChange={(e) => setEditingForm(prev => ({ ...prev, apiKey: e.target.value }))}
                                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setEditingCustomId(null)}
                                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                              >
                                İptal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditCustom(model.id)}
                                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Check size={13} /> Kaydet
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm">{model.name}</span>
                                <span className="text-[9px] font-extrabold uppercase bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded">
                                  {model.provider}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={fetchingProvider === model.id}
                                  onClick={() => handleFetchProviderModels(model.id, model.apiUrl, model.apiKey, model.provider)}
                                  className="flex items-center gap-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-violet-200 transition-all"
                                >
                                  <RefreshCw className={fetchingProvider === model.id ? 'animate-spin' : ''} size={12} />
                                  Modelleri Çek
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleStartEditCustom(model)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-200"
                                  title="Düzenle / API Key Değiştir"
                                >
                                  <Edit3 size={14} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomModel(model.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-slate-200"
                                  title="Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="mt-2 text-xs text-slate-400 font-mono flex items-center justify-between">
                              <span>Base URL: <span className="text-slate-600">{model.apiUrl}</span></span>
                              <span>API Key: <span className="text-slate-600">{model.apiKey ? '••••••••' : 'Yok'}</span></span>
                            </div>

                            {/* Fetched models list if available */}
                            {fetchedModels[model.id] && fetchedModels[model.id].length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                                <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider block">
                                  Çekilen Erişilebilir Modeller ({fetchedModels[model.id].length})
                                </span>
                                <div className="max-h-[140px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 text-xs font-mono">
                                  {fetchedModels[model.id].map(m => (
                                    <div key={m} className="py-1 flex items-center justify-between gap-2">
                                      <span className="truncate">{m}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleInputChange('defaultTextModel', m);
                                          handleInputChange('defaultTextProvider', model.id);
                                          toast.success(`Ana Metin Modeli "${m}" olarak seçildi.`);
                                        }}
                                        className="px-2 py-0.5 bg-violet-600 text-white hover:bg-violet-700 rounded text-[9px] font-sans font-bold shrink-0"
                                      >
                                        Ana Metin Yap
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Hugging Face Model Kütüphanesi */}
          <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="text-amber-500" size={18} />
                <div>
                  <h3 className="text-base font-bold font-display text-slate-800">
                    Hugging Face Model Kütüphanesi
                  </h3>
                  <p className="text-[11px] text-slate-500">Görsel üretimi için kullanılabilecek modeller (FLUX, SDXL, SD3 vb.)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaultHfModels}
                  className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                  title="Varsayılan FLUX & SDXL modellerini yeniden yükler"
                >
                  <RefreshCw size={11} /> Varsayılan Modelleri Yükle
                </button>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg">KÜTÜPHANE</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHfModel}
                  onChange={(e) => setNewHfModel(e.target.value)}
                  placeholder="Örn: stabilityai/stable-diffusion-2-1 veya runwayml/stable-diffusion-v1-5"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddHfModel}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
                >
                  <Plus size={13} /> Model Ekle
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50 divide-y divide-slate-100">
                {((settings.huggingFaceModels && settings.huggingFaceModels.length > 0)
                  ? settings.huggingFaceModels
                  : DEFAULT_HF_MODELS
                ).map((modelName) => {
                  const isPrimary = settings.defaultImageProvider === 'huggingface' && settings.defaultImageModel === modelName;
                  const isFallback = settings.fallbackImageProvider === 'huggingface' && settings.fallbackImageModel === modelName;

                  return (
                    <div key={modelName} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-800">{modelName}</span>
                          {isPrimary && (
                            <span className="text-[9px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded shadow-sm">
                              ANA GÖRSEL MODELİ
                            </span>
                          )}
                          {isFallback && (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                              YEDEK GÖRSEL MODELİ
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('defaultImageProvider', 'huggingface');
                            handleInputChange('defaultImageModel', modelName);
                            toast.success(`"${modelName}" Ana Görsel Üretim Modeli olarak seçildi.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isPrimary
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          Ana Görsel Yap
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('fallbackImageProvider', 'huggingface');
                            handleInputChange('fallbackImageModel', modelName);
                            toast.success(`"${modelName}" Yedek Görsel Üretim Modeli olarak seçildi.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isFallback
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-white hover:bg-amber-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          Yedek Görsel Yap
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteHfModel(modelName)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all border border-slate-200"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Bottom Save Button Container */}
      <div className="flex justify-end pt-4 pb-12">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-2xl shadow-md shadow-orange-500/20 active:scale-98 disabled:opacity-50 transition-all text-xs shrink-0"
        >
          {saving ? (
            <>
              <RefreshCw className="animate-spin" size={15} />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save size={15} />
              Tüm Ayarları Kaydet
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default AiSettings;
