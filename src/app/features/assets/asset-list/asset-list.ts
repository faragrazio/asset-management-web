import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';

@Component({
  selector: 'app-asset-list',
  imports: [RouterLink, Dropdown],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetList implements OnInit {
  private readonly assetService = inject(AssetService);

  readonly assets = signal<Asset[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonRows = [0, 1, 2, 3, 4];  // array fittizio: ripete la riga-scheletro

  // null = dialog chiuso; un id = dialog aperto per quell'asset
  readonly idDaEliminare = signal<number | null>(null);

// '' = tutte; tipo string|number|null allineato al Dropdown model
  readonly categoriaSelezionata = signal<string | number | null>('');

readonly categorie = computed(() => {
  const tutte = this.assets().map((a) => a.category);
  const senzaDuplicati = [...new Set(tutte)];
  return senzaDuplicati.sort();
});

readonly categorieOptions = computed<DropdownOption[]>(() => [
  { value: '', label: 'Tutte' },
  ...this.categorie().map((c) => ({ value: c, label: c })),
]);

readonly assetsFiltrati = computed(() => {
  const categoria = this.categoriaSelezionata();
  if (!categoria) {
    return this.assets();   // nessuna categoria scelta → tutti
  }
  return this.assets().filter((a) => a.category === categoria);
});


ngOnInit(): void {
  this.loadAssets();
}

private loadAssets(): void {
  this.isLoading.set(true);
  this.error.set(null);
  this.assetService.getAll().subscribe({
    next: (data) => {
      this.assets.set(data);
      this.isLoading.set(false);
    },
    error: () => {
      this.error.set('Impossibile caricare gli asset.');
      this.isLoading.set(false);
    },
  });
}

// non elimina subito: apre il dialog e salva l'id
chiediConferma(id: number): void {
  this.idDaEliminare.set(id);
}

annullaEliminazione(): void {
  this.idDaEliminare.set(null);
}

confermaEliminazione(): void {
  const id = this.idDaEliminare();
  if (id === null) {
    return; // sicurezza: senza id non procedo
  }

  this.assetService.delete(id).subscribe({
    next: () => this.loadAssets(),
    error: () => this.error.set('Impossibile eliminare l\'asset.'),
  });

  this.idDaEliminare.set(null); // chiudo il dialog
}

}