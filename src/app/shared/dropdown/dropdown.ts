import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

// Una voce della tendina: il valore "tecnico" + l'etichetta mostrata.
export interface DropdownOption {
  value: string | number;
  label: string;
}

// Contatore globale per generare id univoci: servono all'ARIA quando in pagina
// ci sono più tendine (es. Asset e Priorità insieme).
let prossimoId = 0;

@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown {
  // --- API pubblica (come la si usa da fuori) ---
  readonly options = input.required<DropdownOption[]>();
  readonly placeholder = input('Seleziona…');
  readonly ariaLabel = input('');
  // model = binding bidirezionale: il valore entra ed esce dal componente.
  readonly value = model<string | number | null>(null);

  // --- stato interno ---
  readonly open = signal(false);
  readonly evidenziato = signal(0); // indice della voce evidenziata da tastiera/mouse

  // id univoci per collegare trigger e lista (aria-controls / aria-activedescendant)
  private readonly uid = prossimoId++;
  readonly listboxId = `dropdown-${this.uid}-list`;
  optionId(i: number): string {
    return `dropdown-${this.uid}-opt-${i}`;
  }

  // mi serve per capire se un click/focus è dentro o fuori dal componente
  private readonly el = inject(ElementRef);

  // Testo da mostrare nel trigger: cerco l'opzione col valore attuale,
  // altrimenti mostro il placeholder.
  readonly labelCorrente = computed(() => {
    const corrente = this.value();
    return this.options().find((o) => o.value === corrente)?.label ?? this.placeholder();
  });

  // id della voce evidenziata, ma solo quando è aperta (altrimenti niente).
  readonly activeDescendant = computed(() =>
    this.open() ? this.optionId(this.evidenziato()) : null,
  );

  // --- apertura / chiusura ---
  apri(): void {
    // all'apertura evidenzio la voce già scelta (o la prima se non c'è scelta)
    const sel = this.options().findIndex((o) => o.value === this.value());
    this.evidenziato.set(sel >= 0 ? sel : 0);
    this.open.set(true);
  }
  chiudi(): void {
    this.open.set(false);
  }
  toggle(): void {
    this.open() ? this.chiudi() : this.apri();
  }

  // --- scelta di una voce ---
  scegli(i: number): void {
    const opt = this.options()[i];
    if (!opt) return;
    this.value.set(opt.value); // il valore esce dal componente tramite il model
    this.chiudi();
  }

  // --- tastiera (gestita sul trigger, il focus resta lì) ---
  onKeydown(e: KeyboardEvent): void {
    const ultimo = this.options().length - 1;

    // Se è CHIUSA: solo i tasti che la aprono.
    if (!this.open()) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        this.apri();
      }
      return;
    }

    // Se è APERTA:
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.evidenziato.update((i) => Math.min(i + 1, ultimo));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.evidenziato.update((i) => Math.max(i - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        this.evidenziato.set(0);
        break;
      case 'End':
        e.preventDefault();
        this.evidenziato.set(ultimo);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.scegli(this.evidenziato());
        break;
      case 'Escape':
        e.preventDefault();
        this.chiudi();
        break;
    }
  }

  // --- chiusura automatica ---
  // click in un punto qualsiasi: se è FUORI dal componente, chiudo.
  @HostListener('document:click', ['$event.target'])
  onClickFuori(target: Node): void {
    if (this.open() && !this.el.nativeElement.contains(target)) {
      this.chiudi();
    }
  }
  // il focus esce dal componente (es. Tab): chiudo.
  @HostListener('focusout', ['$event'])
  onFocusOut(e: FocusEvent): void {
    const dove = e.relatedTarget as Node | null;
    if (this.open() && !this.el.nativeElement.contains(dove)) {
      this.chiudi();
    }
  }
}