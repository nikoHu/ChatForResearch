import { Component } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { GlobalStateService } from '../services/global-state.service';

@Component({
  selector: 'home',
  standalone: true,
  imports: [MarkdownModule],
  template: `
    <div class="relative flex h-full w-full items-center justify-center text-3xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="absolute left-0 top-0 ml-5 mt-5 size-8 cursor-pointer rounded-md stroke-black stroke-2 p-1 hover:bg-black/10"
        [class]="isOpen ? 'block' : 'hidden'"
        (click)="setIsOpen()"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
      <markdown class="prose prose-slate" [data]="markdown"></markdown>
    </div>
  `,
})
export class Home {
  markdown = `# Welcome to ChatBot`;

  isOpen = false;

  constructor(private globalStateService: GlobalStateService) {
    this.globalStateService.isOpen$.subscribe((state: boolean) => {
      this.isOpen = state;
    });
  }

  setIsOpen() {
    this.globalStateService.setIsOpen();
  }
}
