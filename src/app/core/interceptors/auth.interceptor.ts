import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// Allega "Authorization: Bearer <token>" a ogni richiesta uscente
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  // Senza token (es. login/register) lascio passare la richiesta invariata
  if (!token) {
    return next(req);
  }

  // HttpRequest è immutabile: clono e aggiungo l'header
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};