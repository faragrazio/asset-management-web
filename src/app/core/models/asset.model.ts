// Valori allineati all'enum AssetStatus del backend
export enum AssetStatus {
  Active = 1,
  InMaintenance = 2,
  Decommissioned = 3,
}

// Asset restituito da GET /api/assets
export interface Asset {
  id: number;
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  status: AssetStatus;   // numero, per la logica
  statusName: string;    // stringa leggibile, per la UI
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
}

// POST /api/assets
export interface CreateAssetRequest {
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  purchaseDate: string;
}

// PUT /api/assets/{id} — il serialNumber non si aggiorna
export interface UpdateAssetRequest {
  id: number;
  name: string;
  category: string;
  location: string;
}