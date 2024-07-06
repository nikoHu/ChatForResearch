import { Routes } from '@angular/router';
import { Home } from './main/home/home.component';
import { Studio } from './main/studio/studio.component';
import { Knowledge } from './main/knowledge/knowledge.component';
import { KnowledgeList } from './main/knowledge/knowledge-list/knowledge-list.component';
import { Create } from './main/knowledge/create/create.component';
import { Upload } from './main/knowledge/upload/upload.component';
import { Split } from './main/knowledge/split/split.component';
import { Finish } from './main/knowledge/finish/finish.component';
import { LoginComponent } from './login/login/login.component';
import { MainComponent } from './main/main.component';
import { authGuard } from './services/auth.guard';
import { KnowledgeDetail } from './main/knowledge/knowledge-detail/knowledge-detail.component';
import { Files } from './main/knowledge/knowledge-detail/files/files.component';
import { Recall } from './main/knowledge/knowledge-detail/recall/recall.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainComponent,
    canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'studio', component: Studio },
      {
        path: 'knowledge',
        component: Knowledge,
        children: [
          { path: '', component: KnowledgeList },
          {
            path: 'create',
            component: Create,
            children: [
              { path: '', redirectTo: 'upload', pathMatch: 'full' },
              { path: 'upload', component: Upload },
              { path: 'split', component: Split },
              { path: 'finish', component: Finish },
            ],
          },
          {
            path: ':name',
            component: KnowledgeDetail,
            children: [
              { path: '', redirectTo: 'files', pathMatch: 'full' },
              { path: 'files', component: Files },
              { path: 'recall', component: Recall },
            ],
          },
        ],
      },
    ],
  },
];
