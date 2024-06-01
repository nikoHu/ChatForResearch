import { Routes } from '@angular/router';
import { Chat } from './chat/chat.component';
import { Home } from './home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'chat/:id', component: Chat },
];
