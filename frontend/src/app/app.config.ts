import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import {
  LucideAngularModule,
  FileText,
  Zap,
  Settings,
  Plus,
  Search,
  ChevronDown,
  FolderClosed,
  Trash2,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideMarkdown(),
    importProvidersFrom(
      LucideAngularModule.pick({ FileText, Zap, Settings, Plus, Search, ChevronDown, FolderClosed, Trash2 }),
    ),
  ],
};
