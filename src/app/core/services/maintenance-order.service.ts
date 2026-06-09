import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MaintenanceOrder,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
} from '../models/maintenance-order.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/maintenanceorders`;

  // GET /api/maintenanceorders — il backend filtra sul NOME dello stato (es. "Pending"),
  // non sul numero: per questo accetto una stringa e non l'enum OrderStatus.
  getAll(status?: string): Observable<MaintenanceOrder[]> {
    // HttpParams è immutabile: ogni set() ritorna una nuova istanza
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<MaintenanceOrder[]>(this.apiUrl, { params });
  }

  // GET /api/maintenanceorders/asset/{assetId} — ordini di un singolo asset
  getByAsset(assetId: number): Observable<MaintenanceOrder[]> {
    return this.http.get<MaintenanceOrder[]>(`${this.apiUrl}/asset/${assetId}`);
  }

  // POST /api/maintenanceorders — il backend risponde 201 con { id }
  create(request: CreateOrderRequest): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(this.apiUrl, request);
  }

  // PATCH /api/maintenanceorders/{orderId}/status — backend risponde 204 (nessun corpo).
  // Mando l'intero request nel body: newStatus decide la transizione lato backend
  // (InProgress = avvia, Completed = completa, Cancelled = annulla).
  updateStatus(request: UpdateOrderStatusRequest): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${request.orderId}/status`,
      request,
    );
  }
}