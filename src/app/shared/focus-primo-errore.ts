// Dopo un invio non valido porta il focus sul primo campo con errore:
// chi usa la tastiera o lo screen reader arriva subito al punto da correggere
// e sente l'etichetta e il messaggio collegato (aria-describedby).
// setTimeout: aspetto che Angular abbia aggiornato aria-invalid nel DOM.
export function focusPrimoErrore(form: HTMLElement): void {
  setTimeout(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
}
