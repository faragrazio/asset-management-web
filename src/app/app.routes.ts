import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Accedi | AssetManagement',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  {
    path: 'register',
    title: 'Registrati | AssetManagement',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },

  {
    path: 'home',
    title: 'Home | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },

  {
    path: 'assets',
    title: 'Elenco asset | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets/asset-list/asset-list').then((m) => m.AssetList),
  },

  {
    path: 'assets/new',
    title: 'Nuovo asset | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets/asset-create/asset-create').then((m) => m.AssetCreate),
  },

  {
    path: 'assets/:id/edit',
    title: 'Modifica asset | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/assets/asset-edit/asset-edit').then((m) => m.AssetEdit),
  },

  {
    path: 'maintenance',
    title: 'Manutenzioni | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/maintenance/maintenance-list/maintenance-list').then(
        (m) => m.MaintenanceList,
      ),
  },

  {
    path: 'maintenance/new',
    title: 'Nuovo ordine di manutenzione | AssetManagement',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/maintenance/maintenance-create/maintenance-create').then(
        (m) => m.MaintenanceCreate,
      ),
  },
  
  { 
    path: '', redirectTo: 'home', pathMatch: 'full' 
  },

  { 
    path: '**', redirectTo: 'home' 
  },
 
];