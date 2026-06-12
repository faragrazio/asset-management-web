import { TestBed } from '@angular/core/testing';
import { Dropdown, DropdownOption } from './dropdown';

// Tre voci di prova: value tecnico + label mostrata, come usa il componente.
const OPZIONI: DropdownOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

// Crea il componente e gli passa le options (input.required): vanno impostate
// PRIMA di detectChanges, altrimenti Angular lancia errore sull'input mancante.
function crea(options: DropdownOption[]): Dropdown {
  const fixture = TestBed.createComponent(Dropdown);
  fixture.componentRef.setInput('options', options);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('Dropdown', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('mostra il placeholder senza scelta, poi la label della voce scelta', () => {
    const dd = crea(OPZIONI);
    // niente value → labelCorrente cade sul placeholder di default
    expect(dd.labelCorrente()).toBe('Seleziona…');
    dd.value.set('b');
    expect(dd.labelCorrente()).toBe('Beta');
  });

  it('scegliere una voce imposta il valore e chiude il menu', () => {
    const dd = crea(OPZIONI);
    dd.apri();
    expect(dd.open()).toBe(true);
    dd.scegli(2); // terza voce → 'c'
    expect(dd.value()).toBe('c');
    expect(dd.open()).toBe(false);
  });

  it('da chiuso ArrowDown apre, da aperto Escape chiude', () => {
    const dd = crea(OPZIONI);
    const tasto = (key: string) => new KeyboardEvent('keydown', { key });
    expect(dd.open()).toBe(false);
    dd.onKeydown(tasto('ArrowDown'));
    expect(dd.open()).toBe(true);
    dd.onKeydown(tasto('Escape'));
    expect(dd.open()).toBe(false);
  });

  it('ArrowDown sposta l’evidenziazione ed Enter seleziona la voce evidenziata', () => {
    const dd = crea(OPZIONI);
    dd.apri(); // all'apertura, senza scelta, evidenzia la prima voce (indice 0)
    expect(dd.evidenziato()).toBe(0);
    dd.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(dd.evidenziato()).toBe(1);
    dd.onKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(dd.value()).toBe('b'); // seconda voce
    expect(dd.open()).toBe(false);
  });
});