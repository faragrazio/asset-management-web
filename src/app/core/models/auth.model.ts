// Credenziali inviate a POST /api/auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

// Risposta del login: token JWT + dati base dell'utente
export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string; // il backend serializza DateTime come stringa ISO
}

// Dati inviati a POST /api/auth/register
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}