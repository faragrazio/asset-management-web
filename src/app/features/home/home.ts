import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Asset } from '../../core/models/asset.model';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly assetCount = signal<number | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    this.http.get<Asset[]>(`${environment.apiUrl}/assets`).subscribe({
      next: (assets) => this.assetCount.set(assets.length),
      error: () => this.error.set('Chiamata protetta fallita (401?).'),
    });
  }
}