import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, AuthResponse, RegisterRequest } from '../models/auth.model';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly storageKey = 'auth';

  // Stato reattivo: l'utente loggato (o null). Inizializzato dal localStorage.
  private readonly currentUser = signal<AuthResponse | null>(this.readFromStorage());

  // Versioni in sola lettura esposte ai componenti
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  register(data: RegisterRequest): Observable<{ id: number }> {
    // il backend risponde 201 con { id } e NON un token:
    // crea l'utente ma non avvia la sessione → niente setSession, si va al login
    return this.http.post<{ id: number }>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  // Salva la sessione e aggiorna lo stato
  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(response));
    this.currentUser.set(response);
  }

  // Ricarica la sessione al boot; scarta il token se scaduto
  private readFromStorage(): AuthResponse | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;

    const session = JSON.parse(raw) as AuthResponse;
    if (new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(this.storageKey);
      return null;
    }
    return session;
  }
}