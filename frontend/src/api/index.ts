import axios from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, Project } from '../types';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },
  create: async (name: string, subdomain: string, description?: string): Promise<Project> => {
    const response = await api.post<Project>('/projects', { name, subdomain, description });
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },
};
