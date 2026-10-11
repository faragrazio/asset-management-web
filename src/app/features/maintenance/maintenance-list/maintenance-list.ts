import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { MaintenanceOrder, OrderStatus, UpdateOrderStatusRequest } from '../../../core/models/maintenance-order.model';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';
import { Dialog } from '../../../shared/dialog/dialog';
import { ETICHETTE_PRIORITA, ETICHETTE_STATO_ORDINE, traduci } from '../../../shared/etichette';
@Component({
  selector: 'app-maintenance-list',
  imports: [RouterLink, DatePipe, Dropdown, Dialog], // DatePipe per la data, Dropdown per il filtro stato
  templateUrl: './maintenance-list.html',
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
    { value: 'Pending', label: 'In attesa' },
    { value: 'InProgress', label: 'In corso' },
    { value: 'Completed', label: 'Completato' },
    { value: 'Cancelled', label: 'Annullato' },
  ];

  readonly ordersFiltrati = computed(() => {
    const stato = this.statoSelezionato();
    if (!stato) {
      return this.orders(); // nessuno stato scelto → tutti
    }
    return this.orders().filter((o) => o.statusName === stato);
  });

  readonly stato = (s: string) => traduci(ETICHETTE_STATO_ORDINE, s);
  readonly priorita = (p: string) => traduci(ETICHETTE_PRIORITA, p);

  // esito dell'ultima azione, da annunciare allo screen reader (WCAG 4.1.3)
  readonly esito = signal('');
  readonly annuncio = computed(() => {
    if (this.isLoading()) return 'Caricamento degli ordini in corso';
    const n = this.ordersFiltrati().length;
    const conteggio = n === 1 ? '1 ordine in elenco' : `${n} ordini in elenco`;
    return this.esito() ? `${this.esito()} ${conteggio}` : conteggio;
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
    this.cambiaStato(
      { orderId: ordine.id, newStatus: OrderStatus.InProgress },
      `Intervento «${ordine.title}» avviato.`,
    );
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
      this.cambiaStato(
        {
          orderId: azione.ordine.id,
          newStatus: OrderStatus.Completed,
          // note vuote → undefined: il campo è facoltativo
          completionNotes: this.noteCompletamento() || undefined,
        },
        `Intervento «${azione.ordine.title}» completato.`,
      );
    } else {
      this.cambiaStato(
        { orderId: azione.ordine.id, newStatus: OrderStatus.Cancelled },
        `Intervento «${azione.ordine.title}» annullato.`,
      );
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
  // Dopo il cambio di stato la riga si ridisegna e il pulsante premuto sparisce:
  // porto il focus sul titolo e annuncio l'esito, così l'utente non resta "nel vuoto".
  private cambiaStato(request: UpdateOrderStatusRequest, messaggio: string): void {
    this.error.set(null);
    this.esito.set('');
    this.orderService.updateStatus(request).subscribe({
      next: () =>
        this.loadOrders(() => {
          this.esito.set(messaggio);
          setTimeout(() => document.querySelector<HTMLElement>('main h1')?.focus());
        }),
      error: (err) => this.error.set(err.error?.error ?? 'Operazione non riuscita.'),
    });
  }

  private loadOrders(dopo?: () => void): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.orderService.getAll().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
        dopo?.();
      },
      error: () => {
        this.error.set('Impossibile caricare gli ordini di manutenzione.');
        this.isLoading.set(false);
      },
    });
  }
}