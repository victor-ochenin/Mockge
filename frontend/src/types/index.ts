// Типы для Mockge проекта

export interface Project {
  id: string;
  name: string;
  subdomain: string;
  description: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string | null;
  refreshToken: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}
