import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ChatList } from './chat-list/chat-list.component';
import { GlobalStateService } from './services/global-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChatList, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen w-screen flex-row">
      <div class="transition-width relative border-r bg-black/5 duration-300" [class]="isOpen ? 'w-0' : 'w-1/5'">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="absolute right-0 mr-4 mt-3 size-8 cursor-pointer rounded-md stroke-black stroke-2 p-1 hover:bg-black/10"
          (click)="setIsOpen()"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        <chat-list></chat-list>
      </div>
      <div class="w-full">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class AppComponent {
  title = 'ChatBot';

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
