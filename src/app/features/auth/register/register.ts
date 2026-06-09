import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    // requisiti del backend replicati lato client: 8+ caratteri (minLength)
    // e almeno una maiuscola + un numero (pattern con due lookahead)
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*[A-Z])(?=.*\d)/)]],
    role: ['Admin', [Validators.required]],
  });

  // ruoli disponibili nella tendina custom
  readonly ruoli = ['Admin', 'Technician', 'Viewer'];

  // stato della tendina (aperta/chiusa)
  readonly menuAperto = signal(false);

  apriChiudiMenu(): void {
    this.menuAperto.update((aperto) => !aperto);
  }

  chiudiMenu(): void {
    this.menuAperto.set(false);
  }

  // l'utente sceglie un ruolo: lo scrivo NEL FORM e chiudo il menu
  scegliRuolo(ruolo: string): void {
    this.form.controls.role.setValue(ruolo);
    this.menuAperto.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.register(this.form.getRawValue()).subscribe({
      // registrazione riuscita → vai al login (register non rilascia il token)
      next: () => this.router.navigate(['/login']),
      error: (err: HttpErrorResponse) => {
        // mostro il messaggio del backend (es. "Email già registrata.");
        // se manca il body (es. server offline), uso un fallback generico
        this.error.set(err.error?.error ?? 'Registrazione non riuscita. Riprova.');
        this.loading.set(false);
      },
    });
  }
}