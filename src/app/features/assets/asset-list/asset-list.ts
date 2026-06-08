import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';


@Component({
  selector: 'app-asset-list',
  imports: [RouterLink],
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

 readonly categoriaSelezionata = signal<string>('');  // '' = mostra tutte

// La lista delle categorie esistenti per il menu a tendina.
// Si ricalcola da solo quando 'assets' cambia.
readonly categorie = computed(() => {
  const tutte = this.assets().map((a) => a.category);  // prendo la categoria di ogni asset
  const senzaDuplicati = [...new Set(tutte)];          // Set toglie i doppioni
  return senzaDuplicati.sort();                        // ordino in alfabetico
});

// Gli asset da mostrare, filtrati. Si ricalcola da solo quando
// cambia 'assets' OPPURE 'categoriaSelezionata'.
readonly assetsFiltrati = computed(() => {
  const categoria = this.categoriaSelezionata();
  if (!categoria) {
    return this.assets();   // nessuna categoria scelta → tutti
  }
  return this.assets().filter((a) => a.category === categoria);
});

readonly menuAperto = signal(false);   // la tendina è aperta?

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

// Apre/chiude la tendina.
apriChiudiMenu(): void {
  // update() prende il valore attuale e restituisce quello nuovo: qui lo inverto.
  this.menuAperto.update((aperto) => !aperto);
}

// Chiude e basta (usato dallo strato invisibile).
chiudiMenu(): void {
  this.menuAperto.set(false);
}

// L'utente sceglie una voce: imposto la categoria e chiudo il menu.
scegliCategoria(categoria: string): void {
  this.categoriaSelezionata.set(categoria);
  this.menuAperto.set(false);
}

}