import { Routes } from '@angular/router';
import { Chat } from './chat/chat.component';
import { Home } from './home/home.component';
import { Studio } from './studio/studio.component';
import { Knowledge } from './knowledge/knowledge.component';
import { KnowledgeList } from './knowledge/knowledge-list/knowledge-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'studio', component: Studio },
  {
    path: 'knowledge',
    component: Knowledge,
    children: [{ path: '', component: KnowledgeList }],
  },
  { path: 'chat/:id', component: Chat },
];
