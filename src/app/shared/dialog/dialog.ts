import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

let prossimoId = 0;

// Dialogo modale costruito sull'elemento <dialog> nativo aperto con showModal().
// Il browser fa già tre cose che prima mancavano: rende inerte la pagina sotto
// (il Tab non ci finisce più), chiude con Esc (evento "cancel") e mette il focus
// sul primo controllo del dialogo. Questo componente aggiunge il nome del dialogo
// (aria-labelledby) e la restituzione del focus a chi lo ha aperto.
@Component({
  selector: 'app-dialog',
  template: `
    <dialog
      #dlg
      class="dialog"
      [attr.aria-labelledby]="titoloId"
      (cancel)="onCancel($event)"
      (close)="avvisaChiusura()"
    >
      <h2 [id]="titoloId">{{ titolo() }}</h2>
      <ng-content />
    </dialog>
  `,
})
export class Dialog implements OnDestroy {
  readonly titolo = input.required<string>();
  // il genitore decide cosa fare (di solito azzera il signal che tiene aperto il dialogo)
  readonly chiudi = output<void>();

  readonly titoloId = `dialog-${prossimoId++}-titolo`;
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  // il componente nasce quando l'utente preme il pulsante: quello è l'elemento attivo
  private readonly apertoDa = document.activeElement as HTMLElement | null;
  private chiusuraAvvisata = false;

  constructor() {
    afterNextRender(() => this.dlg().nativeElement.showModal());
  }

  onCancel(event: Event): void {
    // Esc: non lascio chiudere al browser da solo, avviso il genitore che toglie il dialogo
    event.preventDefault();
    this.avvisaChiusura();
  }

  avvisaChiusura(): void {
    if (this.chiusuraAvvisata) return;
    this.chiusuraAvvisata = true;
    this.chiudi.emit();
  }

  ngOnDestroy(): void {
    this.chiusuraAvvisata = true; // la chiusura qui sotto non deve riavvisare il genitore
    const el = this.dlg().nativeElement;
    if (el.open) el.close();
    // focus restituito al pulsante che ha aperto il dialogo; se non esiste più
    // (es. la riga eliminata) lo porto sul titolo della pagina
    if (this.apertoDa?.isConnected) {
      this.apertoDa.focus();
    } else {
      const h1 = document.querySelector<HTMLElement>('main h1');
      h1?.setAttribute('tabindex', '-1');
      h1?.focus();
    }
  }
}
