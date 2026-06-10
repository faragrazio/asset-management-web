import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MaintenanceOrderService } from '../../../core/services/maintenance-order.service';
import { AssetService } from '../../../core/services/asset.service';
import { Asset, AssetStatus } from '../../../core/models/asset.model';
import { Priority } from '../../../core/models/maintenance-order.model';
import { Dropdown, DropdownOption } from '../../../shared/dropdown/dropdown';

@Component({
  selector: 'app-maintenance-create',
  imports: [ReactiveFormsModule, RouterLink, Dropdown],
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

  // assetsAttivi è una lista di Asset; la tendina vuole {value, label}.
  // value = id (quello che finisce nel form), label = nome mostrato.
  readonly assetOptions = computed<DropdownOption[]>(() =>
    this.assetsAttivi().map((a) => ({ value: a.id, label: a.name })),
  );
  
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

  // Il dropdown emette string|number|null perché è generico.
  // Qui assetId nel form è un number, quindi riporto il valore a numero.
  // null non capita (non c'è un'opzione vuota), ma lo gestisco: 0 = "nessun asset",
  // così il Validators.min(1) tiene il form invalido finché non si sceglie davvero.
  onAssetChange(value: string | number | null): void {
    this.form.controls.assetId.setValue(value === null ? 0 : Number(value));
  }

  // priority è l'enum Priority (numerico): riporto a numero e lo tratto come Priority.
  onPriorityChange(value: string | number | null): void {
    this.form.controls.priority.setValue(Number(value) as Priority);
  }
}