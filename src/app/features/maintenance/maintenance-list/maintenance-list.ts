import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { MaintenanceOrder, OrderStatus, UpdateOrderStatusRequest } from '../../../core/models/maintenance-order.model';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';
@Component({
  selector: 'app-maintenance-list',
  imports: [RouterLink, DatePipe, Dropdown], // DatePipe per la data, Dropdown per il filtro stato  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.scss',
})
export class MaintenanceList implements OnInit {
  private readonly orderService = inject(MaintenanceOrderService);

  readonly orders = signal<MaintenanceOrder[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonRows = [0, 1, 2, 3, 4]; // array fittizio: ripete la riga-scheletro

// '' = nessun filtro (mostra tutti). Tipo allineato al model del Dropdown.
  readonly statoSelezionato = signal<string | number | null>('');

  // Voci del filtro: la prima azzera il filtro. I value coincidono con statusName del backend.
  readonly statiOptions: DropdownOption[] = [
    { value: '', label: 'Tutti' },
    { value: 'Pending', label: 'Pending' },
    { value: 'InProgress', label: 'InProgress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ];

  readonly ordersFiltrati = computed(() => {
    const stato = this.statoSelezionato();
    if (!stato) {
      return this.orders(); // nessuno stato scelto → tutti
    }
    return this.orders().filter((o) => o.statusName === stato);
  });

  // Espongo l'enum al template per i confronti di stato (order.status === OrderStatus.Pending).
  readonly OrderStatus = OrderStatus;

  // Dialog di conferma. null = chiuso. Quando è valorizzato porta SIA l'ordine
  // SIA il tipo di azione: un solo signal fa due lavori.
  readonly azioneDaConfermare = signal<{
    ordine: MaintenanceOrder;
    tipo: 'completa' | 'annulla';
  } | null>(null);

  readonly noteCompletamento = signal('');

  ngOnInit(): void {
    this.loadOrders();
  }

  // Avvia: Pending → InProgress. Diretto, senza conferma.
  avvia(ordine: MaintenanceOrder): void {
    this.cambiaStato({ orderId: ordine.id, newStatus: OrderStatus.InProgress });
  }

  chiediConferma(ordine: MaintenanceOrder, tipo: 'completa' | 'annulla'): void {
    this.noteCompletamento.set(''); // azzero le note ogni volta che apro
    this.azioneDaConfermare.set({ ordine, tipo });
  }

  annullaDialog(): void {
    this.azioneDaConfermare.set(null);
  }

  // Tiene aggiornato il signal delle note mentre l'utente scrive.
  aggiornaNote(event: Event): void {
    this.noteCompletamento.set((event.target as HTMLTextAreaElement).value);
  }

  conferma(): void {
    const azione = this.azioneDaConfermare();
    if (!azione) {
      return;
    }

    if (azione.tipo === 'completa') {
      this.cambiaStato({
        orderId: azione.ordine.id,
        newStatus: OrderStatus.Completed,
        // note vuote → undefined: il campo è facoltativo
        completionNotes: this.noteCompletamento() || undefined,
      });
    } else {
      this.cambiaStato({
        orderId: azione.ordine.id,
        newStatus: OrderStatus.Cancelled,
      });
    }

    this.azioneDaConfermare.set(null);
  }

  // "badge" incluso qui per evitare conflitto tra classe statica e binding [class]
  classeStato(statusName: string): string {
    return 'badge badge-' + statusName.toLowerCase();
  }

  classePriorita(priorityName: string): string {
    return 'badge prio-' + priorityName.toLowerCase();
  }

  // Chiamata comune al backend + ricarica della lista per riflettere il nuovo stato.
  private cambiaStato(request: UpdateOrderStatusRequest): void {
    this.error.set(null);
    this.orderService.updateStatus(request).subscribe({
      next: () => this.loadOrders(),
      error: (err) => this.error.set(err.error?.error ?? 'Operazione non riuscita.'),
    });
  }

  private loadOrders(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Impossibile caricare gli ordini di manutenzione.');
        this.isLoading.set(false);
      },
    });
  }
}