export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  subdomain: string;
  description?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
