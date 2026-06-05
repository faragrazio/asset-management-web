import { Component, inject, signal, OnInit } from '@angular/core';
import { AssetService } from '../../../core/services/asset.service';
import { Asset } from '../../../core/models/asset.model';

@Component({
  selector: 'app-asset-list',
  imports: [],
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.scss',
})
export class AssetList implements OnInit {
  private readonly assetService = inject(AssetService);

  readonly assets = signal<Asset[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAssets();
  }

  // Carica (o ricarica) la lista dal server
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

  onDelete(id: number): void {
    this.assetService.delete(id).subscribe({
      next: () => this.loadAssets(), // dopo l'eliminazione, ricarico la lista aggiornata
      error: () => this.error.set('Impossibile eliminare l\'asset.'),
    });
  }
}