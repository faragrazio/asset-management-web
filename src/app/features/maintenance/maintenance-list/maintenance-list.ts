import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { MaintenanceOrder } from '../../../core/models/maintenance-order.model';

@Component({
  selector: 'app-maintenance-list',
  imports: [RouterLink, DatePipe], // DatePipe serve per formattare la data nel template
  templateUrl: './maintenance-list.html',
  styleUrl: './maintenance-list.scss',
})
export class MaintenanceList implements OnInit {
  private readonly orderService = inject(MaintenanceOrderService);

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

  ngOnInit(): void {
    this.loadOrders();
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
}