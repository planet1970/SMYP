import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Calendar, Clock, RefreshCw, X, Play, Pause, Save, Instagram, Facebook, Video, Layers, Send, Edit, Upload, Loader2, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface Campaign {
  id: number;
  title: string;
  prompt: string;
  platform: string;
  postType: string;
  frequency: string;
  timeOfDay: string;
  isActive: boolean;
  lastRunAt: string | null;
  createdAt: string;
  imageUrl?: string | null;
  accountId?: number | null;
  telegramId?: number | null;
}

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
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  accountId: number | null;
  campaignId: number | null;
}

const SocialMediaCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Record<number, boolean>>({});
  const [campaignsPage, setCampaignsPage] = useState<number>(1);
  const campaignsPerPage = 50;
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const toggleCampaignExpanded = (campaignId: number) => {
    setExpandedCampaigns(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const handleCampaignImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCampaignImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [deletePostTargetId, setDeletePostTargetId] = useState<number | null>(null);

  // Modal and Form states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const [title, setTitle] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [platform, setPlatform] = useState<string>('INSTAGRAM');
  const [postType, setPostType] = useState<string>('POST');
  const [frequency, setFrequency] = useState<string>('DAILY');
  const [timeOfDay, setTimeOfDay] = useState<string>('09:00');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [campaignImageUrl, setCampaignImageUrl] = useState<string>('');
  const [campaignAccountId, setCampaignAccountId] = useState<string>('');
  const [campaignTelegramId, setCampaignTelegramId] = useState<string>('');
  const [telegramAccounts, setTelegramAccounts] = useState<any[]>([]);

  // Edit / Approval states
  const [selectedPostForEdit, setSelectedPostForEdit] = useState<Post | null>(null);
  const [editCaption, setEditCaption] = useState<string>('');
  const [editPlatform, setEditPlatform] = useState<string>('');
  const [editPostType, setEditPostType] = useState<string>('');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [imageFeedback, setImageFeedback] = useState<string>('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (selectedPostForEdit) {
      setEditCaption(selectedPostForEdit.caption);
      setEditPlatform(selectedPostForEdit.platform);
      setEditPostType(selectedPostForEdit.postType);
      setEditAccountId(selectedPostForEdit.accountId ? String(selectedPostForEdit.accountId) : '');
      setImageFeedback('');
    }
  }, [selectedPostForEdit]);

  const fetchCampaigns = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.get<Campaign[]>('/social-media/campaigns');
      setCampaigns(data);
      const postData = await api.get<Post[]>('/social-media/posts');
      setPosts(postData);
      const accountsData = await api.get<Account[]>('/social-media/accounts');
      setAccounts(accountsData.filter(a => a.isActive));
      const tgData = await api.get<any[]>('/social-media/telegram');
      setTelegramAccounts(tgData || []);
    } catch (error) {
      console.error('Kampanyalar yüklenirken hata:', error);
      toast.error('Zamanlanmış görevler yüklenemedi.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);


  const openAddModal = () => {
    setEditingCampaign(null);
    setTitle('');
    setPrompt('');
    setPlatform('INSTAGRAM');
    setPostType('POST');
    setFrequency('DAILY');
    setTimeOfDay('09:00');
    setIsActive(true);
    setCampaignImageUrl('');
    setCampaignAccountId('');
    setCampaignTelegramId('');
    setIsModalOpen(true);
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setTitle(campaign.title);
    setPrompt(campaign.prompt);
    setPlatform(campaign.platform);
    setPostType(campaign.postType);
    setFrequency(campaign.frequency);
    setTimeOfDay(campaign.timeOfDay);
    setIsActive(campaign.isActive);
    setCampaignImageUrl(campaign.imageUrl || '');
    setCampaignAccountId(campaign.accountId ? String(campaign.accountId) : '');
    setCampaignTelegramId(campaign.telegramId ? String(campaign.telegramId) : '');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await api.post(`/social-media/campaigns/${campaign.id}/toggle`, {});
      toast.success(`Görev ${!campaign.isActive ? 'etkinleştirildi' : 'duraklatıldı'}.`);
      fetchCampaigns();
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      toast.error('Durum değiştirilemedi.');
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    setDeleteTargetId(id);
  };

  const handleTestTrigger = async (campaignId: number) => {
    setTriggeringId(campaignId);
    toast.loading('Kampanya testi çalıştırılıyor, test gönderisi üretiliyor...', { id: 'campaign-test' });
    try {
      await api.post(`/social-media/campaigns/${campaignId}/test-trigger`, {});
      toast.success('Test gönderisi başarıyla üretildi! Onayınızı bekliyor.', { id: 'campaign-test' });
      fetchCampaigns(false);
      // Auto expand to show the new post
      setExpandedCampaigns(prev => ({
        ...prev,
        [campaignId]: true
      }));
    } catch (error) {
      console.error('Kampanya test tetikleme hatası:', error);
      toast.error('Kampanya testi çalıştırılırken hata oluştu.', { id: 'campaign-test' });
    } finally {
      setTriggeringId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) {
      toast.error('Lütfen başlık ve prompt alanlarını doldurun.');
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        prompt: prompt.trim(),
        platform,
        postType,
        frequency,
        timeOfDay,
        isActive,
        imageUrl: campaignImageUrl || null,
        accountId: campaignAccountId || null,
        telegramId: campaignTelegramId || null,
      };

      if (editingCampaign) {
        await api.put(`/social-media/campaigns/${editingCampaign.id}`, payload);
        toast.success('Zamanlanmış görev güncellendi.');
      } else {
        await api.post('/social-media/campaigns', payload);
        toast.success('Yeni zamanlanmış görev oluşturuldu.');
      }
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (error) {
      console.error('Zamanlanmış görev kaydedilirken hata:', error);
      toast.error('Görev kaydedilemedi.');
    }
  };

  const handleRegenerateImage = async () => {
    if (!selectedPostForEdit) return;
    setIsRegeneratingImage(true);
    toast.loading('AI ile görsel yeniden üretiliyor...', { id: 'regenerate-image' });
    try {
      const result = await api.post<{ imageUrl: string; imagePrompt: string }>('/social-media/regenerate-image', {
        imagePrompt: selectedPostForEdit.prompt || 'Edirne',
        feedback: imageFeedback,
        imageProvider: 'huggingface',
      });
      
      const updatedPost = {
        ...selectedPostForEdit,
        imageUrl: result.imageUrl,
        prompt: result.imagePrompt
      };
      
      await api.put(`/social-media/posts/${selectedPostForEdit.id}`, {
        ...selectedPostForEdit,
        imageUrl: result.imageUrl,
        prompt: result.imagePrompt
      });

      setSelectedPostForEdit(updatedPost);
      toast.success('Görsel başarıyla yeniden üretildi ve kaydedildi!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsRegeneratingImage(false);
      toast.dismiss('regenerate-image');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedPostForEdit || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingFile(true);
    toast.loading('Medya yükleniyor...', { id: 'upload-media' });
    try {
      const result = await api.post<Post>(`/social-media/posts/${selectedPostForEdit.id}/media`, formData);
      setSelectedPostForEdit(result);
      toast.success('Dosya başarıyla yüklendi!');
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploadingFile(false);
      toast.dismiss('upload-media');
    }
  };

  const handleSavePostEdit = async (approveAndPublish = false) => {
    if (!selectedPostForEdit) return;
    setIsSaving(true);
    const toastId = approveAndPublish ? 'publish-post' : 'save-post';
    toast.loading(approveAndPublish ? 'Onaylanıyor ve paylaşılıyor...' : 'Kaydediliyor...', { id: toastId });
    try {
      await api.put<Post>(`/social-media/posts/${selectedPostForEdit.id}`, {
        caption: editCaption,
        platform: editPlatform,
        postType: editPostType,
        imageUrl: selectedPostForEdit.imageUrl,
        videoUrl: selectedPostForEdit.videoUrl,
        status: approveAndPublish ? 'PENDING_APPROVAL' : selectedPostForEdit.status,
        accountId: editAccountId ? parseInt(editAccountId, 10) : null,
      });

      if (approveAndPublish) {
        const publishResult = await api.post<Post>(`/social-media/posts/${selectedPostForEdit.id}/publish`, {});
        if (publishResult.status === 'PUBLISHED' || publishResult.status === 'PUBLISHING') {
          toast.success('Gönderi onaylandı ve paylaşılıyor!');
        } else {
          toast.error(`Paylaşım hatası: ${publishResult.errorMessage || 'Hata oluştu'}`);
        }
      } else {
        toast.success('Değişiklikler kaydedildi!');
      }

      setSelectedPostForEdit(null);
      fetchCampaigns(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
      toast.dismiss(toastId);
    }
  };

  const handlePublishNow = async (id: number) => {
    setPublishingId(id);
    toast.loading('Gönderi şimdi paylaşılıyor...', { id: 'manual-publish' });
    try {
      const result = await api.post<Post>(`/social-media/posts/${id}/publish`, {});
      toast.dismiss('manual-publish');
      
      if (result.status === 'PUBLISHED') {
        toast.success('Gönderi başarıyla yayınlandı!');
      } else if (result.status === 'PUBLISHING') {
        toast.success('Gönderi paylaşım sırasına alındı! Arka planda paylaşılıyor...');
      } else {
        toast.error(`Paylaşım başarısız oldu: ${result.errorMessage || 'Hata oluştu'}`);
      }
      fetchCampaigns(false);
    } catch (error) {
      toast.dismiss('manual-publish');
      console.error('Yayınlama hatası:', error);
    } finally {
      setPublishingId(null);
    }
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'INSTAGRAM':
        return <Instagram className="text-pink-500" size={16} />;
      case 'FACEBOOK':
        return <Facebook className="text-blue-500" size={16} />;
      case 'TIKTOK':
        return <Video className="text-slate-700" size={16} />;
      default:
        return <Layers className="text-slate-400" size={16} />;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'POST':
        return 'Gönderi (Feed)';
      case 'STORY':
        return 'Hikaye (Story)';
      case 'BOTH':
        return 'Gönderi + Hikaye';
      default:
        return type;
    }
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'DAILY':
        return 'Her Gün';
      case 'WEEKLY':
        return 'Haftalık';
      default:
        return freq;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Zamanlanmış Görevler (Kampanyalar)</h1>
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Otomatik İçerik Üretimi ve Planlı Paylaşım Robotu</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:brightness-110 shadow-lg shadow-orange-500/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Plus size={16} />
          Yeni Görev Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <Clock size={28} />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-800 mb-1 font-semibold">Zamanlanmış Görev Bulunmuyor</h3>
          <p className="text-slate-500 text-xs mb-6 max-w-md mx-auto">
            Sosyal medyanızda her gün veya her hafta belirlediğiniz bir konuda otomatik postlar ve storyler paylaşılmasını sağlayabilirsiniz. İlk görevinizi oluşturun!
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-200 transition-all cursor-pointer"
          >
            <Plus size={14} />
            İlk Otomatik Görevi Tanımla
          </button>
        </div>
      ) : (
        <div className="bg-cardbg border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/60 font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  <th className="p-4 w-10">Göster</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Görev Başlığı</th>
                  <th className="p-4">Platform / Tür</th>
                  <th className="p-4">Paylaşım Sıklığı</th>
                  <th className="p-4">Saat</th>
                  <th className="p-4">Son Tetiklenme</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'PUBLISHED':
                        return <span className="px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full font-bold text-[9px] border border-green-500/15">Yayınlandı</span>;
                      case 'PUBLISHING':
                        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-bold text-[9px] border border-amber-500/15">Paylaşılıyor...</span>;
                      case 'SCHEDULED':
                        return <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-bold text-[9px] border border-blue-500/15">Zamanlandı</span>;
                      case 'PENDING_APPROVAL':
                        return <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full font-bold text-[9px] border border-purple-500/15">Onay Bekliyor</span>;
                      case 'FAILED':
                        return <span className="px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full font-bold text-[9px] border border-red-500/15">Hata</span>;
                      default:
                        return <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold text-[9px] border border-slate-200">{status}</span>;
                    };
                  };

                  const indexOfLastCampaign = campaignsPage * campaignsPerPage;
                  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
                  const currentCampaigns = campaigns.slice(indexOfFirstCampaign, indexOfLastCampaign);

                  return currentCampaigns.map((campaign) => {
                    const campaignAllPosts = posts.filter(
                      (p) => p.campaignId === campaign.id || (p.campaignId === null && p.prompt === campaign.prompt && p.platform === campaign.platform)
                    );
                    const isExpanded = !!expandedCampaigns[campaign.id];

                    return (
                      <React.Fragment key={campaign.id}>
                        <tr className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <button
                              onClick={() => toggleCampaignExpanded(campaign.id)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title={isExpanded ? "Gönderileri Gizle" : "Gönderileri Göster"}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleActive(campaign)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                                campaign.isActive
                                  ? 'bg-green-500/10 border-green-500/20 text-green-600'
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}
                              title={campaign.isActive ? 'Durdur' : 'Başlat'}
                            >
                              {campaign.isActive ? <Play size={10} className="fill-green-600 stroke-none" /> : <Pause size={10} className="fill-slate-500 stroke-none" />}
                              {campaign.isActive ? 'Aktif' : 'Pasif'}
                            </button>
                          </td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-[13px]">{campaign.title}</span>
                                <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0 shadow-sm shadow-orange-500/5">
                                  {campaignAllPosts.length} Gönderi
                                </span>
                              </div>
                              <div className="text-slate-400 font-medium truncate max-w-sm italic" title={campaign.prompt}>
                                "{campaign.prompt}"
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-slate-50 border border-slate-200/60 rounded-lg flex items-center justify-center">
                                {getPlatformIcon(campaign.platform)}
                              </div>
                              <span className="font-semibold text-slate-600">
                                {getPostTypeLabel(campaign.postType)}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{getFrequencyLabel(campaign.frequency)}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-semibold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              <span>{campaign.timeOfDay}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-medium">
                            {campaign.lastRunAt ? (
                              new Date(campaign.lastRunAt).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            ) : (
                              <span className="text-slate-400 italic">Henüz tetiklenmedi</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleTestTrigger(campaign.id)}
                                disabled={triggeringId === campaign.id}
                                className="p-2 bg-primary/10 hover:bg-primary border border-primary/20 hover:border-transparent text-primary hover:text-white rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                title="Test Gönderisi Üret"
                              >
                                {triggeringId === campaign.id ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <Sparkles size={13} />
                                )}
                              </button>
                              <button
                                onClick={() => openEditModal(campaign)}
                                className="p-2 hover:bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl transition-all cursor-pointer active:scale-95"
                                title="Düzenle"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all cursor-pointer active:scale-95"
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-slate-50/30 p-4 border-b border-slate-200/50">
                              <div className="space-y-3 pl-8 pr-4">
                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <Layers size={14} className="text-primary" />
                                    Göreve Ait Tüm Gönderiler ({campaignAllPosts.length})
                                  </span>
                                </div>
                                {campaignAllPosts.length === 0 ? (
                                  <div className="text-xs italic text-slate-400 py-2">Bu göreve ait henüz bir gönderi üretilmemiş.</div>
                                ) : (
                                  <div className="overflow-x-auto border border-slate-200/50 rounded-2xl bg-white shadow-sm">
                                    <table className="w-full text-left border-collapse text-[11px]">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-400 text-[9px]">
                                          <th className="p-3">Medya</th>
                                          <th className="p-3">İçerik (Caption)</th>
                                          <th className="p-3">Durum</th>
                                          <th className="p-3">Tarih</th>
                                          <th className="p-3 text-right">İşlemler</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {campaignAllPosts.map((post) => (
                                          <tr key={post.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-3">
                                              {post.videoUrl && post.videoUrl !== 'undefined' && post.videoUrl.trim() !== '' ? (
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center relative group/thumb cursor-pointer">
                                                  <div className="w-full h-full rounded-lg overflow-hidden">
                                                    <video src={getImageUrl(post.videoUrl)} className="w-full h-full object-cover" />
                                                  </div>
                                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                                    <Video size={8} className="text-white" />
                                                  </div>
                                                  <div className="absolute hidden group-hover/thumb:block left-10 top-0 z-50 w-40 h-40 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 pointer-events-none animate-fadeIn">
                                                    <video src={getImageUrl(post.videoUrl)} autoPlay loop muted className="w-full h-full object-cover rounded-lg" />
                                                  </div>
                                                </div>
                                              ) : post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl.trim() !== '' ? (
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 shrink-0 relative group/thumb cursor-pointer">
                                                  <div className="w-full h-full rounded-lg overflow-hidden">
                                                    <img src={getImageUrl(post.imageUrl)} alt="Thumbnail" className="w-full h-full object-cover" />
                                                  </div>
                                                  <div className="absolute hidden group-hover/thumb:block left-10 top-0 z-50 w-40 h-40 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 pointer-events-none animate-fadeIn">
                                                    <img src={getImageUrl(post.imageUrl)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-slate-400 italic">Medya Yok</span>
                                              )}
                                            </td>
                                            <td className="p-3 max-w-sm">
                                              <p className="line-clamp-2 text-slate-600 leading-normal">{post.caption}</p>
                                            </td>
                                            <td className="p-3">
                                              <div className="flex flex-col gap-0.5">
                                                {getStatusBadge(post.status)}
                                                {post.status === 'FAILED' && post.errorMessage && (
                                                  <span className="text-[8px] text-red-500 max-w-[120px] truncate" title={post.errorMessage}>
                                                    {post.errorMessage}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="p-3 text-slate-400">
                                              {new Date(post.publishedAt || post.createdAt).toLocaleString('tr-TR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </td>
                                            <td className="p-3 text-right">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  onClick={() => setSelectedPostForEdit(post)}
                                                  className="flex items-center gap-0.5 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-bold transition-all cursor-pointer active:scale-95"
                                                >
                                                  <Edit size={10} />
                                                  İncele & Düzenle
                                                </button>
                                                {post.status !== 'PUBLISHED' && post.status !== 'PUBLISHING' && (
                                                  <button
                                                    onClick={() => handlePublishNow(post.id)}
                                                    disabled={publishingId === post.id}
                                                    className="flex items-center gap-0.5 text-[9px] bg-primary/10 hover:bg-primary border border-primary/20 hover:border-transparent text-primary hover:text-white px-2 py-1 rounded-md font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                                  >
                                                    {publishingId === post.id ? <RefreshCw size={10} className="animate-spin" /> : <Send size={10} />}
                                                    Paylaş
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => setDeletePostTargetId(post.id)}
                                                  className="flex items-center gap-0.5 text-[9px] bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-md font-bold transition-all cursor-pointer active:scale-95"
                                                  title="Sil"
                                                >
                                                  <Trash2 size={10} />
                                                  Sil
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          {campaigns.length > campaignsPerPage && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200/60 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-semibold">
                Toplam {campaigns.length} kayıttan {(campaignsPage - 1) * campaignsPerPage + 1}-{Math.min(campaignsPage * campaignsPerPage, campaigns.length)} arası gösteriliyor
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCampaignsPage(prev => Math.max(prev - 1, 1))}
                  disabled={campaignsPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Önceki
                </button>
                {Array.from({ length: Math.ceil(campaigns.length / campaignsPerPage) }, (_, idx) => idx + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCampaignsPage(pageNum)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      campaignsPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setCampaignsPage(prev => Math.min(prev + 1, Math.ceil(campaigns.length / campaignsPerPage)))}
                  disabled={campaignsPage === Math.ceil(campaigns.length / campaignsPerPage)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col p-6 space-y-5 animate-fadeIn text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
              <h2 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                <Clock className="text-primary animate-pulse" size={18} />
                {editingCampaign ? 'Otomatik Görevi Düzenle' : 'Yeni Otomatik Görev Tanımla'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-all p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Görev Başlığı</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Örn: Her Gün Selimiye Paylaşımı"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>

              {/* Prompt */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Otomatik İçerik Promptu (Yapay Zeka Talimatı)</label>
                <textarea
                  required
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Yapay zekanın ne paylaşacağını tanımlayın. Örn: Edirne'nin tarihi lezzetleri (ciğer, badem ezmesi) hakkında samimi ve emojili bir tanıtım yaz."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all leading-relaxed"
                />
              </div>

              {/* Grid fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Platform */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => {
                      setPlatform(e.target.value);
                      setCampaignAccountId('');
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok (Simüle)</option>
                  </select>
                </div>

                {/* Post Type */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paylaşım Türü</label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    <option value="POST">Gönderi (Feed)</option>
                    <option value="STORY">Hikaye (Story)</option>
                    <option value="BOTH">Gönderi + Hikaye</option>
                  </select>
                </div>
              </div>

              {/* Grid scheduling */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                {/* Frequency */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sıklık</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    <option value="DAILY">Her Gün</option>
                    <option value="WEEKLY">Haftada Bir</option>
                  </select>
                </div>

                {/* Time Of Day */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paylaşım Saati</label>
                  <input
                    type="time"
                    required
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Static Image Upload (Optional) */}
              <div className="space-y-1 pt-1.5 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Sabit Görsel (Opsiyonel - AI Resim Üretimini Engeller)</label>
                <div className="flex items-center gap-3 mt-1">
                  {campaignImageUrl ? (
                    <div className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                      <img src={campaignImageUrl.startsWith('data:') ? campaignImageUrl : getImageUrl(campaignImageUrl)} alt="Static Campaign" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCampaignImageUrl('')}
                        className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-black text-white p-0.5 rounded-full transition-colors cursor-pointer"
                        title="Görseli Kaldır"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary flex flex-col items-center justify-center text-slate-400 hover:text-primary cursor-pointer transition-colors shrink-0 bg-slate-50">
                      <Upload size={14} />
                      <span className="text-[8px] font-bold mt-1">Görsel Seç</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCampaignImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Buraya bir görsel yüklerseniz, kampanya her çalıştığında **bu sabit görsel** kullanılır. Yapay zeka ile görsel üretilmez ve **token tasarrufu** sağlanır.
                  </div>
                </div>
              </div>

              {/* Paylaşım Yapılacak Hesap ve Telegram Kanalı Seçimi */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Paylaşım Yapılacak Hesap</label>
                  <select
                    value={campaignAccountId}
                    onChange={(e) => setCampaignAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    <option value="">Varsayılan (İlk Aktif Hesap)</option>
                    {accounts
                      .filter((a) => a.platform === platform)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.username}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Telegram Bildirim/Onay Hesabı</label>
                  <select
                    value={campaignTelegramId}
                    onChange={(e) => setCampaignTelegramId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary text-xs font-semibold bg-slate-50 text-slate-800 cursor-pointer"
                  >
                    <option value="">Tüm Aktif Kanallar (Broadcast)</option>
                    {telegramAccounts.map((tg) => (
                      <option key={tg.id} value={tg.id}>
                        {tg.name || `Telegram Bot (ID: ${tg.id})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-slate-600 select-none cursor-pointer">
                  Görev Oluşturulduğunda Aktif Olsun
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-primary text-white font-bold py-2.5 px-5 rounded-xl text-xs hover:brightness-110 shadow-lg shadow-orange-500/10 transition-all cursor-pointer active:scale-97"
                >
                  <Save size={14} />
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Review & Approve Modal */}
      {selectedPostForEdit && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl relative flex flex-col text-slate-800">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200/60 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Edit className="text-primary" size={18} />
                Gönderi İnceleme ve Onaylama
              </h3>
              <button
                onClick={() => setSelectedPostForEdit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
              {/* Left Side: Fields Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Platform</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TIKTOK">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Gönderi Türü</label>
                  <select
                    value={editPostType}
                    onChange={(e) => setEditPostType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="POST">Gönderi (Feed)</option>
                    <option value="STORY">Hikaye (Story)</option>
                    <option value="BOTH">İkisi De</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Paylaşım Yapılacak Hesap</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                  >
                    <option value="">Platformun Varsayılan Hesabı</option>
                    {accounts
                      .filter((a) => a.platform === editPlatform)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.username}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Gönderi Metni (Caption)</label>
                  <textarea
                    rows={6}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium leading-relaxed"
                    placeholder="Gönderi metnini yazın..."
                  />
                </div>

                {/* AI Image Regeneration Box */}
                <div className="border border-slate-200/60 bg-white rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Yapay Zeka ile Görseli Yenile</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Görselin tarzını değiştirmek veya düzeltmek için geribildirim yazın.</p>
                  <textarea
                    rows={2}
                    value={imageFeedback}
                    onChange={(e) => setImageFeedback(e.target.value)}
                    placeholder="Örn: 'Renkleri daha sıcak yap, mavi tonlarını azalt...'"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateImage}
                    disabled={isRegeneratingImage || !imageFeedback.trim()}
                    className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary border border-primary/25 hover:border-transparent text-primary hover:text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isRegeneratingImage ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    AI ile Görseli Yeniden Üret
                  </button>
                </div>
              </div>

              {/* Right Side: Media Preview & File Upload */}
              <div className="flex flex-col gap-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Gönderi Medyası</label>
                
                {/* Media Container */}
                <div className="flex-1 min-h-[220px] max-h-[300px] border border-slate-200 bg-white rounded-2xl overflow-hidden relative flex items-center justify-center shadow-inner">
                  {selectedPostForEdit.videoUrl ? (
                    <video src={getImageUrl(selectedPostForEdit.videoUrl)} controls className="w-full h-full object-cover" />
                  ) : selectedPostForEdit.imageUrl ? (
                    <img src={getImageUrl(selectedPostForEdit.imageUrl)} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <p className="text-xs font-semibold text-slate-400 italic">Medya atanmamış</p>
                  )}

                  {/* Upload overlay spinner */}
                  {isUploadingFile && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="animate-spin text-white w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    id="edit-post-file-campaigns"
                    disabled={isUploadingFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-post-file-campaigns"
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all active:scale-98"
                  >
                    <Upload size={14} />
                    Bilgisayardan Yeni Görsel/Video Yükle
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200/60 flex flex-wrap justify-between items-center gap-3 shrink-0 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedPostForEdit(null)}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                İptal
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSavePostEdit(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  Taslak Olarak Kaydet
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePostEdit(true)}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Onayla ve Hemen Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirm Modal for Delete */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Görevi Sil"
        message="Bu zamanlanmış görevi silmek istediğinize emin misiniz?"
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            try {
              await api.delete(`/social-media/campaigns/${deleteTargetId}`);
              toast.success('Zamanlanmış görev başarıyla silindi.');
              fetchCampaigns();
            } catch (error) {
              console.error('Görev silinirken hata:', error);
              toast.error('Görev silinemedi.');
            } finally {
              setDeleteTargetId(null);
            }
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
      <ConfirmModal
        isOpen={deletePostTargetId !== null}
        title="Gönderiyi Sil"
        message="Bu gönderiyi silmek istediğinize emin misiniz?"
        onConfirm={async () => {
          if (deletePostTargetId !== null) {
            try {
              await api.delete(`/social-media/posts/${deletePostTargetId}`);
              toast.success('Gönderi silindi.');
              fetchCampaigns(false);
            } catch (error) {
              console.error('Gönderi silinirken hata:', error);
              toast.error('Gönderi silinemedi.');
            } finally {
              setDeletePostTargetId(null);
            }
          }
        }}
        onCancel={() => setDeletePostTargetId(null)}
      />
    </div>
  );
};

export default SocialMediaCampaigns;
