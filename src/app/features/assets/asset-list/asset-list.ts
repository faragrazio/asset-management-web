import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';
import { Dialog } from '../../../shared/dialog/dialog';
import { ETICHETTE_STATO_ASSET, traduci } from '../../../shared/etichette';

@Component({
  selector: 'app-asset-list',
  imports: [RouterLink, Dropdown, Dialog],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetList implements OnInit {
  private readonly assetService = inject(AssetService);

  readonly assets = signal<Asset[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonRows = [0, 1, 2, 3, 4];  // array fittizio: ripete la riga-scheletro

  readonly statoAsset = (s: string) => traduci(ETICHETTE_STATO_ASSET, s);

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

// l'asset del dialog, per scriverne il nome nel messaggio di conferma
readonly assetDaEliminare = computed(() =>
  this.assets().find((a) => a.id === this.idDaEliminare()) ?? null,
);

// esito dell'ultima azione (es. eliminazione), da annunciare allo screen reader
readonly esito = signal('');

// testo della regione role="status": lo screen reader lo legge quando cambia,
// senza spostare il focus (WCAG 4.1.3 Messaggi di stato)
readonly annuncio = computed(() => {
  if (this.isLoading()) return 'Caricamento degli asset in corso';
  const n = this.assetsFiltrati().length;
  const conteggio = n === 1 ? '1 asset in elenco' : `${n} asset in elenco`;
  return this.esito() ? `${this.esito()} ${conteggio}` : conteggio;
});

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

private loadAssets(dopo?: () => void): void {
  this.isLoading.set(true);
  this.error.set(null);
  this.assetService.getAll().subscribe({
    next: (data) => {
      this.assets.set(data);
      this.isLoading.set(false);
      dopo?.();
    },
    error: () => {
      this.error.set('Impossibile caricare gli asset.');
      this.isLoading.set(false);
    },
  });
}

// non elimina subito: apre il dialog e salva l'id
chiediConferma(id: number): void {
  this.esito.set('');
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

  const nome = this.assetDaEliminare()?.name ?? 'Asset';
  this.assetService.delete(id).subscribe({
    next: () =>
      this.loadAssets(() => {
        this.esito.set(`${nome} eliminato.`);
        // il pulsante "Elimina" della riga non esiste più: il focus va sul titolo
        setTimeout(() => document.querySelector<HTMLElement>('main h1')?.focus());
      }),
    error: () => this.error.set('Impossibile eliminare l\'asset.'),
  });

  this.idDaEliminare.set(null); // chiudo il dialog
}

}