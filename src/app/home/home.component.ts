import { Component } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'home',
  standalone: true,
  imports: [MarkdownModule],
  template: `
    <div class="flex h-full w-full items-center justify-center rounded-r-2xl border-y border-r text-3xl">
      <markdown class="prose prose-slate" [data]="markdown"></markdown>
    </div>
  `,
})
export class Home {
  markdown = `# Welcome to ChatBot`;
}
