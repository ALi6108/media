export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}
