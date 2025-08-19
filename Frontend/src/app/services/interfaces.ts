export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface EmailResponse {
  id: number;
  prompt: string;
  tone: string;
  length: string;
  generated_email: string;
  created_at: string;
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}