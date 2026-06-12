import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { MaintenanceOrder, OrderStatus, UpdateOrderStatusRequest } from '../../../core/models/maintenance-order.model';

@Component({
  selector: 'app-maintenance-list',
  imports: [RouterLink, DatePipe], // DatePipe serve per formattare la data nel template
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.scss',
})
export class MaintenanceList implements OnInit {
  // --- Dependency injection ---
  private readonly orderService = inject(MaintenanceOrderService);

  // --- Campi (stato del componente) ---
  readonly orders = signal<MaintenanceOrder[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly skeletonRows = [0, 1, 2, 3, 4]; // array fittizio: ripete la riga-scheletro

  // Filtro per stato. '' = mostra tutti. Stesso schema della tendina categorie.
  readonly statoSelezionato = signal<string>('');
  readonly menuAperto = signal(false);

  // Gli stati sono fissi e noti (a differenza delle categorie, che nascono dai dati).
  // Uso i nomi esattamente come li restituisce il backend in statusName.
  readonly statiPossibili = ['Pending', 'InProgress', 'Completed', 'Cancelled'];

  // Ordini filtrati: si ricalcola da solo quando cambia 'orders' o 'statoSelezionato'.
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

  // Testo della textarea note nel dialog di completamento.
  readonly noteCompletamento = signal('');

  // --- Lifecycle ---
  ngOnInit(): void {
    this.loadOrders();
  }

  // --- Metodi pubblici ---

  // Avvia: Pending → InProgress. Diretto, senza conferma.
  avvia(ordine: MaintenanceOrder): void {
    this.cambiaStato({ orderId: ordine.id, newStatus: OrderStatus.InProgress });
  }

  // Apre il dialog per completare o annullare l'ordine.
  chiediConferma(ordine: MaintenanceOrder, tipo: 'completa' | 'annulla'): void {
    this.noteCompletamento.set(''); // azzero le note ogni volta che apro
    this.azioneDaConfermare.set({ ordine, tipo });
  }

  // Chiude il dialog senza fare niente.
  annullaDialog(): void {
    this.azioneDaConfermare.set(null);
  }

  // Tiene aggiornato il signal delle note mentre l'utente scrive.
  aggiornaNote(event: Event): void {
    this.noteCompletamento.set((event.target as HTMLTextAreaElement).value);
  }

  // Conferma dal dialog: esegue completa o annulla in base al tipo salvato.
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

  // Apre/chiude la tendina del filtro-stato (fatta a mano).
  apriChiudiMenu(): void {
    this.menuAperto.update((aperto) => !aperto);
  }

  chiudiMenu(): void {
    this.menuAperto.set(false);
  }

  scegliStato(stato: string): void {
    this.statoSelezionato.set(stato);
    this.menuAperto.set(false);
  }

  // Compone la classe del badge in base allo stato: "badge badge-pending" ecc.
  // Includo "badge" qui dentro per evitare il conflitto tra classe statica e [class].
  classeStato(statusName: string): string {
    return 'badge badge-' + statusName.toLowerCase();
  }

  // Stessa logica per la priorità: "badge prio-high" ecc.
  classePriorita(priorityName: string): string {
    return 'badge prio-' + priorityName.toLowerCase();
  }

  // --- Metodi privati (aiutanti interni) ---

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