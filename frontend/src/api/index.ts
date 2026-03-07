import api, { setAuthToken } from './client';
import type { AuthResponse, Project } from '../types';

export const authApi = {
  getCurrentUser: async (token: string): Promise<AuthResponse> => {
    setAuthToken(token);
    const response = await api.get<AuthResponse>('/auth/me');
    return response.data;
  },
};

export const projectsApi = {
  getAll: async (token: string): Promise<Project[]> => {
    setAuthToken(token);
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },
  create: async (token: string, name: string, subdomain: string, description?: string): Promise<Project> => {
    setAuthToken(token);
    const response = await api.post<Project>('/projects', { name, subdomain, description });
    return response.data;
  },
  delete: async (token: string, id: string): Promise<void> => {
    setAuthToken(token);
    await api.delete(`/projects/${id}`);
  },
};
