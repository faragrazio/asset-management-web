import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { focusPrimoErrore } from '../../../shared/focus-primo-errore';
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

  // Voci della tendina ruolo: il value è la stringa che il backend si aspetta
  // ('Admin' | 'Technician' | 'Viewer'), la label è in italiano come il resto della pagina.
  readonly ruoliOptions: DropdownOption[] = [
    { value: 'Admin', label: 'Amministratore' },
    { value: 'Technician', label: 'Tecnico' },
    { value: 'Viewer', label: 'Sola lettura' },
  ];

  // app-dropdown emette string | number | null, ma i nostri value sono stringhe:
  // riallineo il FormControl, che resta la fonte di verità del valore.
  // La chiusura del menu non mi riguarda più: la gestisce app-dropdown.
  scegliRuolo(ruolo: string | number | null): void {
    this.form.controls.role.setValue(String(ruolo));
  }

  // true se il campo va segnalato come errato (non valido E già toccato)
  errore(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }

  submit(formEl: HTMLElement): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusPrimoErrore(formEl);
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