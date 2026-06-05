import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Asset, CreateAssetRequest, UpdateAssetRequest } from '../models/asset.model';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/assets`;

  // GET /api/assets — categoria opzionale come query string
  getAll(category?: string): Observable<Asset[]> {
    // HttpParams è immutabile: ogni set() ritorna una nuova istanza
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Asset[]>(this.apiUrl, { params });
  }

  // GET /api/assets/{id}
  getById(id: number): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/${id}`);
  }

  // POST /api/assets — il backend risponde 201 con { id }
  create(request: CreateAssetRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, request);
  }

  // PUT /api/assets/{id} — backend risponde 204 (nessun corpo)
  update(request: UpdateAssetRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${request.id}`, request);
  }

  // DELETE /api/assets/{id} — 204
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}