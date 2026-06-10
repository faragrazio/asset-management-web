import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Home } from './home';
import { Asset, AssetStatus } from '../../core/models/asset.model';

// Asset finto: riempio i campi obbligatori con valori segnaposto e faccio
// variare solo categoria e stato, perché sono gli unici che le metriche guardano
function asset(category: string, status: AssetStatus): Asset {
  return {
    id: 1, name: '', serialNumber: '', category, location: '',
    status, statusName: '', purchaseDate: '', createdAt: '', updatedAt: '',
  };
}

describe('Home', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),           // serve perché il template usa routerLink
        provideHttpClient(),         // HTTP di base...
        provideHttpClientTesting(),  // ...sostituito da quello finto, che intercetta le chiamate
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // mi assicuro che non sia rimasta nessuna richiesta HTTP non gestita
    httpMock.verify();
  });

  it('tiene le metriche a null finché i dati non arrivano (stato skeleton)', () => {
    const home = TestBed.createComponent(Home).componentInstance;

    // il costruttore ha già lanciato GET /api/assets, ma noi non abbiamo ancora risposto
    expect(home.totale()).toBeNull();
    expect(home.categorie()).toBeNull();
    expect(home.inManutenzione()).toBeNull();

    // svuoto la richiesta in sospeso (lista vuota) così afterEach non protesta
    httpMock.expectOne((r) => r.url.endsWith('/assets')).flush([]);
  });

  it('calcola totale, categorie distinte e asset in manutenzione', () => {
    const home = TestBed.createComponent(Home).componentInstance;

    const lista = [
      asset('IT', AssetStatus.Active),
      asset('IT', AssetStatus.InMaintenance),
      asset('Veicoli', AssetStatus.InMaintenance),
      asset('Ufficio', AssetStatus.Decommissioned),
    ];

    // rispondo alla GET partita dal costruttore con la lista di prova
    httpMock.expectOne((r) => r.url.endsWith('/assets')).flush(lista);

    expect(home.totale()).toBe(4);         // 4 asset in totale
    expect(home.categorie()).toBe(3);      // IT, Veicoli, Ufficio (IT contato una volta)
    expect(home.inManutenzione()).toBe(2); // i due con stato InMaintenance
  });
});