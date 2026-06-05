import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly title = signal('asset-management-web');

  // La navbar si mostra solo a utente loggato
  readonly isLoggedIn = this.auth.isLoggedIn;

  // Azione (non semplice link) → resta router.navigate
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}