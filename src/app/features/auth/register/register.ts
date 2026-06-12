import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, Dropdown],
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

  // Voci della tendina ruolo: value e label coincidono perché il backend
  // si aspetta proprio queste stringhe ('Admin' | 'Technician' | 'Viewer').
  readonly ruoliOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Admin' },
    { value: 'Technician', label: 'Technician' },
    { value: 'Viewer', label: 'Viewer' },
  ];

  // app-dropdown emette string | number | null, ma i nostri value sono stringhe:
  // riallineo il FormControl, che resta la fonte di verità del valore.
  // La chiusura del menu non mi riguarda più: la gestisce app-dropdown.
  scegliRuolo(ruolo: string | number | null): void {
    this.form.controls.role.setValue(String(ruolo));
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