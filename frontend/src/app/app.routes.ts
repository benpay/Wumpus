import { Routes } from '@angular/router';
import { GameComponent } from './features/game/game';
import { HomeComponent } from './features/home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'game/:id', component: GameComponent },
  { path: '**', redirectTo: '' },
];
