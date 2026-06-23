import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.edirnego.com/api/v1';
const API_BASE_URL = (import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.edirnego.com').replace(/\/$/, '');

export const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};

interface CustomRequestOptions extends Omit<RequestInit, 'body'> {
  body?: FormData | object;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(path: string, options: CustomRequestOptions = {}): Promise<T> {
  const headers: any = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const token = localStorage.getItem('smyp_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let requestBody: BodyInit | undefined;

  if (options.body instanceof FormData) {
    requestBody = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(options.body);
  }

  // Handle Query Params
  let fullPath = `${API_URL}${path}`;
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.append(key, String(value));
    });
    const queryString = searchParams.toString();
    if (queryString) fullPath += `?${queryString}`;
  }

  try {
    const res = await fetch(fullPath, {
      method: options.method || 'GET',
      headers: headers,
      body: requestBody,
      cache: 'no-store',
      credentials: 'omit',
      mode: 'cors',
    });

    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      let errorMessage = data?.message || 'İstek başarısız oldu';

      if (res.status === 401 && !path.includes('/auth/login')) {
        localStorage.removeItem('smyp_token');
        localStorage.removeItem('smyp_user');
        window.location.hash = '#/login';
        errorMessage = 'Oturum süreniz doldu, lütfen tekrar giriş yapın.';
      } else if (res.status === 403) {
        errorMessage = 'Bu işlem için yetkiniz bulunmuyor.';
      } else if (res.status === 500) {
        errorMessage = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      toast.error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
    }
    throw error;
  }
}

export const api = {
  get: <T>(path: string, options?: Pick<CustomRequestOptions, 'params' | 'headers'>) => 
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body: FormData | object, options?: Pick<CustomRequestOptions, 'headers'>) =>
    request<T>(path, {
      method: 'POST',
      body: body,
      ...options,
    }),
  put: <T>(path: string, body: FormData | object, options?: Pick<CustomRequestOptions, 'headers'>) =>
    request<T>(path, {
      method: 'PUT',
      body: body,
      ...options,
    }),
  patch: <T>(path: string, body: FormData | object, options?: Pick<CustomRequestOptions, 'headers'>) =>
    request<T>(path, {
      method: 'PATCH',
      body: body,
      ...options,
    }),
  delete: <T>(path: string, options?: Pick<CustomRequestOptions, 'headers'>) =>
    request<T>(path, {
      method: 'DELETE',
      ...options,
    }),
};

export { API_URL, API_BASE_URL };
export { authService } from './auth';
