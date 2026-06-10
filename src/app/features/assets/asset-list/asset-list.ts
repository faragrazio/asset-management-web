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

  // Se è null, il dialog è CHIUSO. Se contiene un id, il dialog è APERTO per quell'asset. Un solo signal fa due lavori: aperto/chiuso + quale asset.
 readonly idDaEliminare = signal<number | null>(null);

// '' = mostra tutte. Tipo allineato al model del componente dropdown.
  readonly categoriaSelezionata = signal<string | number | null>('');

// La lista delle categorie esistenti per il menu a tendina.
// Si ricalcola da solo quando 'assets' cambia.
readonly categorie = computed(() => {
  const tutte = this.assets().map((a) => a.category);  // prendo la categoria di ogni asset
  const senzaDuplicati = [...new Set(tutte)];          // Set toglie i doppioni
  return senzaDuplicati.sort();                        // ordino in alfabetico
});

// Le opzioni per la tendina: "Tutte" (valore '') + una voce per ogni categoria.
readonly categorieOptions = computed<DropdownOption[]>(() => [
  { value: '', label: 'Tutte' },
  ...this.categorie().map((c) => ({ value: c, label: c })),
]);

// Gli asset da mostrare, filtrati. Si ricalcola da solo quando
// cambia 'assets' OPPURE 'categoriaSelezionata'.
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

// Click su "Elimina" nella RIGA: non elimino, apro solo il dialog
// salvando quale asset si vuole eliminare.
chiediConferma(id: number): void {
  this.idDaEliminare.set(id);
}

// Click su "Annulla" nel DIALOG: chiudo senza fare niente.
annullaEliminazione(): void {
  this.idDaEliminare.set(null);
}

// Click su "Elimina" nel DIALOG: eseguo davvero l'eliminazione.
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