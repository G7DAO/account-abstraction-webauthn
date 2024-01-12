import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'wallet-demo',
    loadComponent: () =>
      import('./wallet-demo/wallet-demo.page').then((m) => m.WalletDemoPage),
  },
  {
    path: 'console-demo',
    loadComponent: () =>
      import('./console-demo/console-demo.page').then((m) => m.ConsoleDemoPage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
