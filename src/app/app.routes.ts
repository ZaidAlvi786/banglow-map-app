import { Routes } from '@angular/router';

export const routes: Routes = [{
    path: 'map', loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
},
];
