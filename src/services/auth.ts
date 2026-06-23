import { api } from './api';

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    email: string;
    name?: string;
    role?: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload),
};
