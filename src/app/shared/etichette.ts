// Il backend manda stati e priorità in inglese ("Pending", "High"...).
// Su una pagina in italiano lo screen reader li pronuncerebbe con la fonetica
// italiana (WCAG 3.1.2 Parti in lingua): li traduco solo per la visualizzazione.
export const ETICHETTE_STATO_ORDINE: Record<string, string> = {
  Pending: 'In attesa',
  InProgress: 'In corso',
  Completed: 'Completato',
  Cancelled: 'Annullato',
};

export const ETICHETTE_PRIORITA: Record<string, string> = {
  Low: 'Bassa',
  Medium: 'Media',
  High: 'Alta',
  Critical: 'Critica',
};

export const ETICHETTE_STATO_ASSET: Record<string, string> = {
  Active: 'Attivo',
  InMaintenance: 'In manutenzione',
  Decommissioned: 'Dismesso',
};

export const traduci = (mappa: Record<string, string>, valore: string): string =>
  mappa[valore] ?? valore;
