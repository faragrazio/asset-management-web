import { Component, inject, signal, OnInit } from '@angular/core';
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

  // onDelete RESTA: è un'azione, non una navigazione
  onDelete(id: number): void {
    this.assetService.delete(id).subscribe({
      next: () => this.loadAssets(),
      error: () => this.error.set('Impossibile eliminare l\'asset.'),
    });
  }
}