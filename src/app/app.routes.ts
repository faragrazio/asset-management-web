import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },

  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },

  {
    path: 'assets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets/asset-list/asset-list').then((m) => m.AssetList),
  },

  {
    path: 'assets/new',
    canActivate: [authGuard],
    loadComponent: () => import('./features/assets/asset-create/asset-create').then((m) => m.AssetCreate),
  },

  { 
    path: '', redirectTo: 'home', pathMatch: 'full' 
  },

  { 
    path: '**', redirectTo: 'home' 
  },
];