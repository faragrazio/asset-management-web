import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';

// Costruisce una sessione fittizia: faccio variare solo la scadenza, il resto è fisso
function sessione(expiresAt: Date): AuthResponse {
  return {
    token: 'jwt-di-test',
    email: 'graziano@test.com',
    fullName: 'Graziano Faraone',
    role: 'Admin',
    expiresAt: expiresAt.toISOString(),
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    // ogni test parte da storage pulito: nessuna sessione ereditata dal test precedente
    localStorage.clear();
    // il service inietta HttpClient nel costruttore: va fornito comunque,
    // anche se questi test non scatenano nessuna chiamata HTTP
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });

  it('parte disconnesso senza sessione salvata', () => {
    const auth = TestBed.inject(AuthService);
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.getToken()).toBeNull();
  });

  it('scarta la sessione scaduta letta dal localStorage', () => {
    // sessione scaduta ieri: readFromStorage deve ignorarla e ripulire lo storage
    const ieri = new Date(Date.now() - 24 * 60 * 60 * 1000);
    localStorage.setItem('auth', JSON.stringify(sessione(ieri)));

    // l'istanza nasce QUI: il costruttore legge lo storage adesso, dopo averlo seminato
    const auth = TestBed.inject(AuthService);

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('auth')).toBeNull(); // ramo di cleanup eseguito
  });

  it('ripristina la sessione valida ed espone il token', () => {
    const domani = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('auth', JSON.stringify(sessione(domani)));

    const auth = TestBed.inject(AuthService);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getToken()).toBe('jwt-di-test');
  });

  it('logout azzera stato e storage', () => {
    const domani = new Date(Date.now() + 24 * 60 * 60 * 1000);
    localStorage.setItem('auth', JSON.stringify(sessione(domani)));
    const auth = TestBed.inject(AuthService);
    expect(auth.isLoggedIn()).toBe(true); // pre-condizione: loggato

    auth.logout();

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('auth')).toBeNull();
  });
});