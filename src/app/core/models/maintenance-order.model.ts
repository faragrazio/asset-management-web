export enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
  Critical = 4,
}

export enum OrderStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
}

// Ordine restituito da GET /api/maintenanceorders
export interface MaintenanceOrder {
  id: number;
  assetId: number;
  assetName: string;
  title: string;
  description: string;
  priority: Priority;
  priorityName: string;
  status: OrderStatus;
  statusName: string;
  assignedTo: string;
  scheduledDate: string;
  completedAt: string | null;
  completionNotes: string | null;
  createdAt: string;
}

// POST /api/maintenanceorders
export interface CreateOrderRequest {
  assetId: number;
  title: string;
  description: string;
  priority: Priority;
  assignedTo: string;
  scheduledDate: string;
}

// PATCH /api/maintenanceorders/{orderId}/status
export interface UpdateOrderStatusRequest {
  orderId: number;
  newStatus: OrderStatus;
  completionNotes?: string;
}