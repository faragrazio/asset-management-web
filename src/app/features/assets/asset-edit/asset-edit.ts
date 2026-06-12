import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';

@Component({
  selector: 'app-asset-edit',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './asset-edit.html',
  styleUrl: './asset-edit.scss',
})
export class AssetEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Id dell'asset da modificare: lo leggo una volta e lo conservo per l'update.
  // Non è un signal: non cambia mai e nessun template lo osserva.
  private assetId = 0;

  // Stesso schema del form di creazione, ma solo i 3 campi che l'update accetta.
  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    location: ['', Validators.required],
  });

readonly error = signal<string | null>(null);
readonly isLoading = signal(true);     // parte true: in ngOnInit carico subito
readonly skeletonFields = [0, 1, 2];   // 3 campi: Nome, Categoria, Posizione

ngOnInit(): void {
  this.assetId = Number(this.route.snapshot.paramMap.get('id'));

  this.assetService.getById(this.assetId).subscribe({
    next: (asset) => {
      this.form.patchValue({
        name: asset.name,
        category: asset.category,
        location: asset.location,
      });
      this.isLoading.set(false);   // dati arrivati → mostro il form vero
    },
    error: () => {
      this.error.set('Impossibile caricare l\'asset.');
      this.isLoading.set(false);   // anche in errore esco dal caricamento
    },
  });
}

  onSubmit(): void {
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // id dall'URL, non dal form
    const dati = this.form.getRawValue();
    this.assetService
      .update({
        id: this.assetId,
        name: dati.name,
        category: dati.category,
        location: dati.location,
      })
      .subscribe({
        next: () => this.router.navigate(['/assets']),
        error: () => this.error.set('Impossibile salvare le modifiche.'),
      });
  }
}