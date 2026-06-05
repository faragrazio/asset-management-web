import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';

@Component({
  selector: 'app-asset-create',
  imports: [ReactiveFormsModule],
  templateUrl: './asset-create.html',
  styleUrl: './asset-create.scss',
})
export class AssetCreate {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);

  // nonNullable: i campi avranno sempre un testo (al massimo vuoto), mai "null"
  readonly form = this.fb.nonNullable.group({
    name: [''],
    serialNumber: [''],
    category: [''],
    location: [''],
    purchaseDate: [''],
  });

  readonly error = signal<string | null>(null);

  onSubmit(): void {
    this.assetService.create(this.form.getRawValue()).subscribe({
      next: () => {
        // Salvataggio riuscito: torniamo alla lista
        this.router.navigate(['/assets']);
      },
      error: () => {
        this.error.set('Impossibile salvare l\'asset.');
      },
    });
  }
}