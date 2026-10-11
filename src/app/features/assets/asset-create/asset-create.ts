import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';
import { focusPrimoErrore } from '../../../shared/focus-primo-errore';

@Component({
  selector: 'app-asset-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './asset-create.html',
  styleUrl: './asset-create.scss',
})
export class AssetCreate {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);

  // nonNullable: i campi avranno sempre un testo (al massimo vuoto), mai "null"
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    serialNumber: ['', Validators.required],
    category: ['', Validators.required],
    location: ['', Validators.required],
    purchaseDate: ['', Validators.required],
  });

  readonly error = signal<string | null>(null);

  // true se il campo va segnalato come errato (non valido E già toccato)
  errore(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }

  onSubmit(formEl: HTMLElement): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      focusPrimoErrore(formEl);
      return;
    }
    this.assetService.create(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/assets']);
      },
      error: () => {
        this.error.set('Impossibile salvare l\'asset.');
      },
    });
  }
}