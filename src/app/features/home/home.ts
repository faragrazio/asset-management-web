import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Asset, AssetStatus } from '../../core/models/asset.model';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;

  // Sorgente dei dati: l'intero elenco asset (null = non ancora caricato)
  private readonly assets = signal<Asset[] | null>(null);
  readonly error = signal<string | null>(null);

  // Metriche DERIVATE: si ricalcolano da sole quando "assets" cambia.
  // Restituiscono null finché i dati non arrivano, così la UI mostra lo skeleton.
  readonly totale = computed(() => this.assets()?.length ?? null);

  readonly categorie = computed(() => {
    const lista = this.assets();
    if (lista === null) return null;
    // Set elimina i duplicati: la sua dimensione = numero di categorie distinte
    return new Set(lista.map((a) => a.category)).size;
  });

  readonly inManutenzione = computed(() => {
    const lista = this.assets();
    if (lista === null) return null;
    // tengo solo gli asset il cui stato è "in manutenzione" e li conto
    return lista.filter((a) => a.status === AssetStatus.InMaintenance).length;
  });

  constructor() {
    this.http.get<Asset[]>(`${environment.apiUrl}/assets`).subscribe({
      next: (assets) => this.assets.set(assets),
      error: () => this.error.set('Impossibile caricare i dati.'),
    });
  }
}