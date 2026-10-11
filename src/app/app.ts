import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter, skip } from 'rxjs';
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

  readonly isLoggedIn = this.auth.isLoggedIn;

  constructor() {
    // In una SPA il cambio di pagina non ricarica il documento: lo screen reader
    // non se ne accorge e il focus resta sul link cliccato. Dopo ogni navigazione
    // (tranne la prima, al caricamento) porto il focus sul titolo della nuova pagina.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        skip(1),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => setTimeout(() => this.focusSulTitolo()));
  }

  vaiAlContenuto(event: Event): void {
    // il link "#contenuto" da solo cambierebbe l'URL e farebbe intervenire il router
    event.preventDefault();
    this.focusSulTitolo();
  }

  // Azione (non semplice link) → resta router.navigate
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private focusSulTitolo(): void {
    const main = document.getElementById('contenuto');
    const titolo = main?.querySelector<HTMLElement>('h1');
    const bersaglio = titolo ?? main;
    if (!bersaglio) return;
    // tabindex -1: focalizzabile da codice ma non entra nella sequenza del Tab
    bersaglio.setAttribute('tabindex', '-1');
    bersaglio.focus();
  }
}
