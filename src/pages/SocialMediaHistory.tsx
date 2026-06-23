import React, { useState, useEffect } from 'react';
import { api, getImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';
import { Trash2, Send, Calendar, CheckCircle2, XCircle, AlertCircle, RefreshCw, Copy, ExternalLink, MessageSquare, Instagram, Facebook, Video, Eye, X, Loader2, Edit, Upload } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

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
}

const SocialMediaHistory: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [selectedPostForPreview, setSelectedPostForPreview] = useState<Post | null>(null);
  const [postsPage, setPostsPage] = useState<number>(1);
  const postsPerPage = 50;
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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

  const fetchPosts = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const data = await api.get<Post[]>('/social-media/posts');
      const filtered = data.filter(
        (p) => p.status !== 'PENDING_APPROVAL' && p.status !== 'DRAFT' && p.status !== 'REJECTED'
      );
      setPosts(filtered);
      const accountsData = await api.get<Account[]>('/social-media/accounts');
      setAccounts(accountsData.filter(a => a.isActive));
    } catch (error) {
      console.error('Gönderi geçmişi yüklenirken hata:', error);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Poll posts status every 5 seconds if there are any posts currently publishing
  useEffect(() => {
    const hasPublishingPosts = posts.some(p => p.status === 'PUBLISHING');
    if (!hasPublishingPosts) return;

    const interval = setInterval(() => {
      fetchPosts(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [posts]);

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Gönderi metni panoya kopyalandı!');
  };

  const handleDeletePost = async (id: number) => {
    setDeleteTargetId(id);
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
      fetchPosts(false);
    } catch (error) {
      toast.dismiss('manual-publish');
      console.error('Yayınlama hatası:', error);
    } finally {
      setPublishingId(null);
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
      fetchPosts(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
      toast.dismiss(toastId);
    }
  };

  const getStatusBadge = (post: Post) => {
    switch (post.status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200/30 px-2.5 py-1 rounded-full text-xs font-semibold">
            <CheckCircle2 size={13} />
            Yayınlandı
          </span>
        );
      case 'PUBLISHING':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200/30 px-2.5 py-1 rounded-full text-xs font-semibold">
            <RefreshCw className="animate-spin text-amber-600" size={13} />
            Paylaşılıyor...
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200/30 px-2.5 py-1 rounded-full text-xs font-semibold">
            <Calendar size={13} />
            Zamanlandı
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200/30 px-2.5 py-1 rounded-full text-xs font-semibold animate-pulse">
            <AlertCircle size={13} className="text-amber-700" />
            Onay Bekliyor
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200/30 px-2.5 py-1 rounded-full text-xs font-semibold">
            <XCircle size={13} />
            Reddedildi
          </span>
        );
      case 'FAILED':
        return (
          <span
            className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200/30 px-2.5 py-1 rounded-full text-xs font-semibold cursor-help"
            title={post.errorMessage || 'Bilinmeyen Hata'}
          >
            <XCircle size={13} />
            Hata
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200/60 px-2.5 py-1 rounded-full text-xs font-semibold">
            <AlertCircle size={13} />
            Taslak
          </span>
        );
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
        return <ExternalLink className="text-slate-500" size={18} />;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800">Gönderi Geçmişi ve Zamanlayıcı</h1>
        <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Paylaşılan ve Planlanmış Gönderi Günlükleri</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-cardbg border border-slate-200/60 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-lg font-bold font-display text-slate-800 mb-1">Gönderi Geçmişi Boş</h3>
          <p className="text-slate-500 text-xs mb-6">
            Henüz yapay zeka ile bir gönderi oluşturmadınız veya yayınlamadınız.
          </p>
        </div>
      ) : (
        <div className="bg-cardbg border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Platform</th>
                  <th className="py-4 px-6">Paylaşım Türü</th>
                  <th className="py-4 px-6">Konu / Prompt</th>
                  <th className="py-4 px-6 w-96">Paylaşım İçeriği (Caption)</th>
                  <th className="py-4 px-6">Durum</th>
                  <th className="py-4 px-6">Tarih</th>
                  <th className="py-4 px-6 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {(() => {
                  const indexOfLastPost = postsPage * postsPerPage;
                  const indexOfFirstPost = indexOfLastPost - postsPerPage;
                  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);

                  return currentPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Platform */}
                      <td className="py-4 px-6 font-bold flex items-center gap-2">
                        <div className="p-1.5 bg-slate-100 rounded-lg border border-slate-200/60 flex items-center justify-center">
                          {getPlatformIcon(post.platform)}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">{post.platform}</span>
                      </td>

                      {/* Post Type */}
                      <td className="py-4 px-6 text-[10px] font-semibold">
                        {post.postType === 'STORY' ? (
                          <span className="inline-flex bg-purple-50 text-purple-600 border border-purple-200/30 px-2 py-0.5 rounded-md font-semibold">Hikaye</span>
                        ) : post.postType === 'BOTH' ? (
                          <span className="inline-flex bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-semibold">İkisi De</span>
                        ) : (
                          <span className="inline-flex bg-blue-50 text-blue-600 border border-blue-200/30 px-2 py-0.5 rounded-md font-semibold">Gönderi (Feed)</span>
                        )}
                      </td>

                      {/* Prompt & Media Thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {post.videoUrl && post.videoUrl !== 'undefined' && post.videoUrl.trim() !== '' ? (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center relative group/thumb cursor-pointer">
                              <div className="w-full h-full rounded-lg overflow-hidden">
                                <video src={getImageUrl(post.videoUrl)} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                <Video size={10} className="text-white" />
                              </div>
                              {/* Hover Video Preview */}
                              <div className="absolute hidden group-hover/thumb:block left-12 top-0 z-50 w-48 h-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 pointer-events-none animate-fadeIn">
                                <video src={getImageUrl(post.videoUrl)} autoPlay loop muted className="w-full h-full object-cover rounded-lg" />
                              </div>
                            </div>
                          ) : post.imageUrl && post.imageUrl !== 'undefined' && post.imageUrl.trim() !== '' ? (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 shrink-0 relative group/thumb cursor-pointer">
                              <div className="w-full h-full rounded-lg overflow-hidden">
                                <img src={getImageUrl(post.imageUrl)} alt="Thumbnail" className="w-full h-full object-cover" />
                              </div>
                              {/* Hover Image Preview */}
                              <div className="absolute hidden group-hover/thumb:block left-12 top-0 z-50 w-48 h-48 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden p-1 pointer-events-none animate-fadeIn">
                                <img src={getImageUrl(post.imageUrl)} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                              </div>
                            </div>
                          ) : null}
                          <p className="font-semibold text-slate-800 line-clamp-2 max-w-[180px]">
                            {post.prompt || 'Doğrudan İçerik'}
                          </p>
                        </div>
                      </td>

                      {/* Caption */}
                      <td className="py-4 px-6">
                        <div className="relative group max-w-sm">
                          <p className="line-clamp-2 pr-6 leading-relaxed font-medium text-xs text-slate-500">
                            {post.caption}
                          </p>
                          <button
                            onClick={() => handleCopyCaption(post.caption)}
                            className="absolute right-0 top-1 text-slate-400 hover:text-primary transition-colors"
                            title="Metni Kopyala"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(post)}
                          {post.status === 'FAILED' && post.errorMessage && (
                            <span className="text-[9px] text-red-500 max-w-[120px] truncate" title={post.errorMessage}>
                              {post.errorMessage}
                            </span>
                          )}
                          {post.status === 'PUBLISHING' && post.errorMessage && (
                            <span className="text-[9px] text-amber-600 font-semibold max-w-[160px] truncate" title={post.errorMessage}>
                              {post.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-6 text-[10px] font-semibold text-slate-400">
                        {post.status === 'SCHEDULED' ? (
                          <div>
                            <p className="text-blue-500 font-bold">Planlanan:</p>
                            <p>{formatDate(post.scheduledAt)}</p>
                          </div>
                        ) : (
                          <div>
                            <p>Yayınlanma:</p>
                            <p>{post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-3">
                          {(() => {
                            const isPendingApproval = post.status === 'PENDING_APPROVAL';
                            const isStuckPublishing = post.status === 'PUBLISHING' && 
                              (new Date().getTime() - new Date(post.updatedAt || post.createdAt).getTime() > 6 * 60 * 1000);
                            const canPublish = post.status !== 'PUBLISHED' && (post.status !== 'PUBLISHING' || isStuckPublishing);
                            
                            if (isPendingApproval) {
                              return (
                                <button
                                  onClick={() => setSelectedPostForEdit(post)}
                                  className="flex items-center gap-1 text-[10px] bg-amber-500/10 hover:bg-amber-500 border border-amber-500/20 hover:border-transparent text-amber-700 hover:text-white px-3 py-1.5 rounded-lg transition-all active:scale-95 font-bold"
                                >
                                  <Edit size={12} />
                                  İncele & Onayla
                                </button>
                              );
                            }

                            return canPublish && (
                              <button
                                onClick={() => handlePublishNow(post.id)}
                                disabled={publishingId === post.id}
                                className="flex items-center gap-1 text-[10px] bg-primary/10 hover:bg-primary border border-primary/20 hover:border-transparent text-primary hover:text-white px-3 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                title={isStuckPublishing ? "Yeniden Dene (Takılı Kaldı)" : "Şimdi Paylaş"}
                              >
                                {publishingId === post.id ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Send size={12} />
                                )}
                                <span className="font-bold">
                                  {isStuckPublishing ? "Yeniden Dene" : "Şimdi Paylaş"}
                                </span>
                              </button>
                            );
                          })()}

                          <button
                            onClick={() => setSelectedPostForPreview(post)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-lg transition-colors"
                            title="Önizle"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          {posts.length > postsPerPage && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200/60 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-semibold">
                Toplam {posts.length} kayıttan {(postsPage - 1) * postsPerPage + 1}-{Math.min(postsPage * postsPerPage, posts.length)} arası gösteriliyor
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPostsPage(prev => Math.max(prev - 1, 1))}
                  disabled={postsPage === 1}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Önceki
                </button>
                {Array.from({ length: Math.ceil(posts.length / postsPerPage) }, (_, idx) => idx + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setPostsPage(pageNum)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      postsPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setPostsPage(prev => Math.min(prev + 1, Math.ceil(posts.length / postsPerPage)))}
                  disabled={postsPage === Math.ceil(posts.length / postsPerPage)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  Sonraki
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Preview Modal */}
      {selectedPostForPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardbg border border-slate-200/60 rounded-3xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col text-slate-800">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200/60 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Eye className="text-primary" size={16} />
                Gönderi Önizlemesi
              </h3>
              <button
                onClick={() => setSelectedPostForPreview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 overflow-y-auto flex items-center justify-center bg-slate-50/80">
              {selectedPostForPreview.postType === 'STORY' ? (
                /* Story Preview */
                <div className={`border border-gray-800 rounded-3xl overflow-hidden shadow-xl w-[260px] aspect-[9/16] relative text-white ${
                  selectedPostForPreview.imageUrl && !selectedPostForPreview.videoUrl ? 'bg-white' : 'bg-[#121212]'
                }`}>
                  {/* Media */}
                  {selectedPostForPreview.videoUrl ? (
                    <video key={selectedPostForPreview.videoUrl} src={getImageUrl(selectedPostForPreview.videoUrl)} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-[0.8]" />
                  ) : selectedPostForPreview.imageUrl ? (
                    <img key={selectedPostForPreview.imageUrl} src={getImageUrl(selectedPostForPreview.imageUrl)} alt="Preview" className="w-full h-auto brightness-[0.8]" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-purple-800 via-pink-700 to-orange-500 flex items-center justify-center p-6 text-center">
                      <p className="text-xs font-bold text-white">Medya Bulunamadı</p>
                    </div>
                  )}

                  {/* Top Story Indicators */}
                  <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                    <div className="h-0.5 flex-1 bg-white rounded-full"></div>
                  </div>

                  {/* Story User Header */}
                  <div className="absolute top-7 left-4 right-4 flex items-center gap-2 z-10">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-primary text-[9px] font-bold">E</div>
                    <span className="text-[10px] font-bold shadow-sm">@ednrehber</span>
                  </div>

                  {/* Bottom Story Message overlay - Centered, 72% width, bottom 16% */}
                  <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 w-[72%] bg-black/65 backdrop-blur-sm p-3.5 rounded-xl border border-white/10 text-center z-10">
                    <p className="text-[9px] leading-relaxed text-white font-semibold whitespace-pre-wrap">
                      {selectedPostForPreview.caption}
                    </p>
                    <span className="block text-[7px] text-gray-300 font-bold mt-1.5 text-center">
                      ✍️ Görsele otomatik yazılmıştır
                    </span>
                  </div>
                </div>
              ) : (
                /* Feed Post Previews */
                <div className="w-full">
                  {selectedPostForPreview.platform === 'INSTAGRAM' && (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl max-w-[280px] mx-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between p-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-primary text-xs font-bold">E</div>
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-800">@ednrehber</h4>
                            <p className="text-[8px] text-slate-400 font-semibold">Edirne, Türkiye</p>
                          </div>
                        </div>
                      </div>

                      {/* Media */}
                      <div className="aspect-square bg-slate-50 relative flex items-center justify-center overflow-hidden border-b border-slate-200">
                        {selectedPostForPreview.videoUrl ? (
                          <video src={getImageUrl(selectedPostForPreview.videoUrl)} controls autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : selectedPostForPreview.imageUrl ? (
                          <img src={getImageUrl(selectedPostForPreview.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <p className="text-xs font-semibold text-slate-400 italic">Medya bulunamadı</p>
                        )}
                      </div>

                      {/* Comments & Captions */}
                      <div className="p-3 space-y-1 text-[10px] text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900 mr-1.5">@ednrehber</span>
                          <span className="text-slate-600 whitespace-pre-wrap">{selectedPostForPreview.caption}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPostForPreview.platform === 'FACEBOOK' && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xl space-y-3 max-w-[300px] mx-auto">
                      {/* Header */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">E</div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                            @ednrehber
                            <span className="w-2.5 h-2.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[5px] font-bold">✓</span>
                          </h4>
                          <p className="text-[8px] text-slate-400">Dünya 🌎</p>
                        </div>
                      </div>

                      {/* Caption */}
                      <p className="text-[10px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedPostForPreview.caption}
                      </p>

                      {/* Media */}
                      <div className="aspect-video bg-slate-50 rounded-xl relative flex items-center justify-center overflow-hidden border border-slate-200">
                        {selectedPostForPreview.videoUrl ? (
                          <video src={getImageUrl(selectedPostForPreview.videoUrl)} controls autoPlay loop muted playsInline className="w-full h-full object-cover" />
                        ) : selectedPostForPreview.imageUrl ? (
                          <img src={getImageUrl(selectedPostForPreview.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <p className="text-xs font-semibold text-slate-400 italic">Medya bulunamadı</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedPostForPreview.platform === 'TIKTOK' && (
                    <div className="bg-[#121212] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl aspect-[9/16] relative text-white w-[260px] mx-auto">
                      {/* Background Media */}
                      {selectedPostForPreview.videoUrl ? (
                        <video src={getImageUrl(selectedPostForPreview.videoUrl)} autoPlay loop muted playsInline className="w-full h-full object-cover brightness-[0.7]" />
                      ) : selectedPostForPreview.imageUrl ? (
                        <img src={getImageUrl(selectedPostForPreview.imageUrl)} alt="Preview" className="w-full h-full object-cover brightness-[0.7]" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-black to-gray-900 flex items-center justify-center p-6">
                          <p className="text-xs text-gray-500 italic">Medya bulunamadı</p>
                        </div>
                      )}

                      {/* Bottom Details Overlay */}
                      <div className="absolute bottom-6 left-4 right-14 space-y-2 z-10 text-left">
                        <h4 className="font-bold text-xs">@ednrehber</h4>
                        <p className="text-[9px] text-gray-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                          {selectedPostForPreview.caption}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                    id="edit-post-file"
                    disabled={isUploadingFile}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-post-file"
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
        title="Gönderiyi Sil"
        message="Bu gönderiyi geçmişten silmek istediğinize emin misiniz?"
        onConfirm={async () => {
          if (deleteTargetId !== null) {
            try {
              await api.delete(`/social-media/posts/${deleteTargetId}`);
              toast.success('Gönderi silindi.');
              fetchPosts();
            } catch (error) {
              console.error('Gönderi silinirken hata:', error);
            } finally {
              setDeleteTargetId(null);
            }
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};

export default SocialMediaHistory;
