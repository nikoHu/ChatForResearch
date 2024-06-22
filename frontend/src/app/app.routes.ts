import { Routes } from '@angular/router';
import { Chat } from './chat/chat.component';
import { Home } from './home/home.component';
import { Studio } from './studio/studio.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'studio', component: Studio },
  { path: 'chat/:id', component: Chat },
];
