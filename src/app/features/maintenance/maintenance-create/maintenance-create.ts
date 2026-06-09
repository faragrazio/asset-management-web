import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { AssetService } from '../../../core/services/asset.service';
import { Asset, AssetStatus } from '../../../core/models/asset.model';
import { Priority } from '../../../core/models/maintenance-order.model';

@Component({
  selector: 'app-maintenance-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './maintenance-create.html',
  styleUrl: './maintenance-create.scss',
})
export class MaintenanceCreate implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(MaintenanceOrderService);
  private readonly assetService = inject(AssetService);
  private readonly router = inject(Router);

  // Solo gli asset Active possono ricevere un ordine: crearlo su un asset già
  // in manutenzione farebbe fallire il backend. Quindi nella select mostro solo questi.
  readonly assetsAttivi = signal<Asset[]>([]);
  readonly error = signal<string | null>(null);

  // Priorità per la tendina. Etichette in inglese per restare coerente con i
  // badge della lista (priorityName arriva in inglese dal backend).
  readonly priorita = [
    { value: Priority.Low, label: 'Low' },
    { value: Priority.Medium, label: 'Medium' },
    { value: Priority.High, label: 'High' },
    { value: Priority.Critical, label: 'Critical' },
  ];

  // Data minima selezionabile = oggi, in formato yyyy-MM-dd per l'attributo min.
  readonly oggi = new Date().toISOString().split('T')[0];

  // assetId parte da 0 + min(1): finché non si sceglie un asset il form è invalido.
  // priority parte da Medium come default ragionevole.
  readonly form = this.fb.nonNullable.group({
    assetId: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    priority: [Priority.Medium, Validators.required],
    assignedTo: ['', [Validators.required, Validators.maxLength(200)]],
    scheduledDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.assetService.getAll().subscribe({
      next: (data) =>
        this.assetsAttivi.set(data.filter((a) => a.status === AssetStatus.Active)),
      error: () => this.error.set('Impossibile caricare gli asset.'),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    // getRawValue() restituisce già i tipi corretti (assetId e priority numerici,
    // grazie a [ngValue]): l'oggetto combacia con CreateOrderRequest.
    this.orderService.create(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/maintenance']),
      error: (err) => {
        // Messaggio reale del backend se presente (es. data nel passato,
        // asset non attivo); altrimenti un fallback generico.
        this.error.set(err.error?.error ?? 'Impossibile creare l\'ordine.');
      },
    });
  }

  // Una tendina per l'asset e una per la priorità: stato di apertura separato.
  readonly menuAssetAperto = signal(false);
  readonly menuPrioritaAperto = signal(false);

  // Aprendo una tendina chiudo l'altra: non devono restare aperte insieme.
  apriChiudiAsset(): void {
    this.menuPrioritaAperto.set(false);
    this.menuAssetAperto.update((aperto) => !aperto);
  }
  chiudiAsset(): void {
    this.menuAssetAperto.set(false);
  }

  apriChiudiPriorita(): void {
    this.menuAssetAperto.set(false);
    this.menuPrioritaAperto.update((aperto) => !aperto);
  }
  chiudiPriorita(): void {
    this.menuPrioritaAperto.set(false);
  }

  // Scelta dell'utente: scrivo il valore NEL FORM e chiudo il menu (come in register).
  scegliAsset(id: number): void {
    this.form.controls.assetId.setValue(id);
    this.menuAssetAperto.set(false);
  }
  scegliPriorita(value: Priority): void {
    this.form.controls.priority.setValue(value);
    this.menuPrioritaAperto.set(false);
  }

  // Traduzione valore → testo da mostrare nel trigger.
  // L'asset nel form è un id (numero): cerco il nome corrispondente.
  nomeAssetSelezionato(): string {
    const id = this.form.controls.assetId.value;
    return this.assetsAttivi().find((a) => a.id === id)?.name ?? 'Seleziona un asset…';
  }
  // La priorità nel form è un enum: cerco la label corrispondente.
  labelPriorita(): string {
    const value = this.form.controls.priority.value;
    return this.priorita.find((p) => p.value === value)?.label ?? '';
  }
}