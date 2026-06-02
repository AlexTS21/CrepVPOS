import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'caja',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/caja/caja.component').then(m => m.CajaComponent),
  },
  {
    path: 'pos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/pos/pos.component').then(m => m.PosComponent),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/orders.component').then(m => m.OrdersComponent),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
  },
  {
    path: 'reports',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/reports/reports.component').then(m => m.ReportsComponent),
  },
  { path: '**', redirectTo: 'login' },
];
